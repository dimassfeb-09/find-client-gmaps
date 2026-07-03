import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { scrapePlaces } from './googleMapsScraper.js'
import { insertPlace } from '../database/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, '..', 'config', 'config.json')
const rawConfig = JSON.parse(readFileSync(configPath, 'utf-8'))

// Support both new format ({ mode, concurrency, queries }) and old flat array
let mode = 'sequential'
let concurrency = 3
let queryList = []

if (Array.isArray(rawConfig)) {
  queryList = rawConfig
} else {
  mode = rawConfig.mode || 'sequential'
  concurrency = rawConfig.concurrency || 3
  queryList = rawConfig.queries || []
}

async function main() {
  console.log('=== Google Maps Scraper ===')
  console.log(`Mode: ${mode}${mode === 'concurrent' ? ` (concurrency: ${concurrency})` : ''}`)
  console.log(`Queries: ${queryList.length}\n`)

  let totalSaved = 0

  for (const config of queryList) {
    const label = `"${config.keyword}" in "${config.location}"`
    console.log(`>>> Scraping ${label}`)
    const start = Date.now()

    try {
      const places = await scrapePlaces(config.keyword, config.location, { mode, concurrency })
      console.log(`\nSaving ${places.length} places to database...`)

      for (const place of places) {
        insertPlace(place)
      }

      totalSaved += places.length
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      console.log(`✓ ${label} — ${places.length} places saved (${elapsed}s)\n`)
    } catch (err) {
      console.error(`✗ ${label} — error: ${err.message}\n`)
    }
  }

  console.log(`=== Done! Total: ${totalSaved} places saved ===`)
}

main().catch(console.error)
