import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { scrapePlaces } from './googleMapsScraper.js'
import { insertPlace } from '../database/db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, '..', 'config', 'config.json')
const configs = JSON.parse(readFileSync(configPath, 'utf-8'))

async function main() {
  console.log('=== Google Maps Scraper ===')
  console.log(`Configs: ${configs.length} search queries\n`)

  let totalSaved = 0

  for (const config of configs) {
    const label = `"${config.keyword}" in "${config.location}"`
    console.log(`>>> Scraping ${label}`)
    const start = Date.now()

    try {
      const places = await scrapePlaces(config.keyword, config.location)
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
