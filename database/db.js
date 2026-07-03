import Database from 'better-sqlite3'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', 'data', 'places.db')

const dataDir = join(__dirname, '..', 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
db.exec(schema)

export { db }

export function insertPlace(place) {
  const stmt = db.prepare(`
    INSERT INTO places (name, address, latitude, longitude, city, phone, email, website, has_website, whatsapp_verified, search_keyword)
    VALUES (@name, @address, @latitude, @longitude, @city, @phone, @email, @website, @hasWebsite, @whatsappVerified, @searchKeyword)
  `)
  return stmt.run(place)
}

export function upsertPlace(place) {
  const existing = db
    .prepare('SELECT id FROM places WHERE name = ? AND city = ?')
    .get(place.name, place.city)

  if (existing) {
    const stmt = db.prepare(`
      UPDATE places SET
        address = @address,
        latitude = @latitude,
        longitude = @longitude,
        phone = @phone,
        email = @email,
        website = @website,
        has_website = @hasWebsite,
        search_keyword = @searchKeyword,
        scraped_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `)
    return stmt.run({ ...place, id: existing.id })
  }

  return insertPlace(place)
}

export function getAllPlaces(filters = {}) {
  let sql = 'SELECT * FROM places WHERE 1=1'
  const params = []

  if (filters.city) {
    sql += ' AND city = ?'
    params.push(filters.city)
  }
  if (filters.hasWebsite !== undefined) {
    sql += ' AND has_website = ?'
    params.push(filters.hasWebsite ? 1 : 0)
  }
  if (filters.hasPhone === 'true') {
    sql += ' AND phone IS NOT NULL'
  } else if (filters.hasPhone === 'false') {
    sql += ' AND phone IS NULL'
  }
  if (filters.hasWhatsApp === 'true') {
    sql += ' AND whatsapp_verified = 1'
  } else if (filters.hasWhatsApp === 'false') {
    sql += ' AND (whatsapp_verified = 0 OR whatsapp_verified IS NULL)'
  }
  if (filters.search) {
    sql += ' AND (name LIKE ? OR address LIKE ?)'
    params.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  sql += ' ORDER BY name ASC'
  return db.prepare(sql).all(...params)
}

export function getCities() {
  return db.prepare('SELECT DISTINCT city FROM places WHERE city IS NOT NULL ORDER BY city ASC').all()
}

export function getStats() {
  const total = db.prepare('SELECT COUNT(*) as count FROM places').get()
  const withWebsite = db.prepare("SELECT COUNT(*) as count FROM places WHERE has_website = 1").get()
  const withoutWebsite = db.prepare("SELECT COUNT(*) as count FROM places WHERE has_website = 0").get()
  const withPhone = db.prepare('SELECT COUNT(*) as count FROM places WHERE phone IS NOT NULL').get()
  const withoutPhone = db.prepare('SELECT COUNT(*) as count FROM places WHERE phone IS NULL').get()
  const perCity = db.prepare('SELECT city, COUNT(*) as count FROM places GROUP BY city ORDER BY count DESC').all()
  return { total: total.count, withWebsite: withWebsite.count, withoutWebsite: withoutWebsite.count, withPhone: withPhone.count, withoutPhone: withoutPhone.count, perCity }
}

export function getUnverifiedWhatsAppPlaces() {
  return db.prepare("SELECT id, name, phone FROM places WHERE phone IS NOT NULL AND (whatsapp_verified = 0 OR whatsapp_verified IS NULL)").all()
}

export function updatePlace(id, data) {
  const fields = Object.keys(data)
  if (fields.length === 0) return
  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  const values = fields.map((f) => data[f])
  return db.prepare(`UPDATE places SET ${setClause} WHERE id = ?`).run(...values, id)
}

export function deletePlace(id) {
  return db.prepare('DELETE FROM places WHERE id = ?').run(id)
}

export function clearAll() {
  return db.prepare('DELETE FROM places').run()
}
