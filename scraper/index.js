import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { scrapePlaces } from './googleMapsScraper.js'
import { insertPlace } from '../database/db.js'
import { createLogger } from '../server/logger.js'

const log = createLogger('cli')

const __dirname = dirname(fileURLToPath(import.meta.url))
const configPath = join(__dirname, '..', 'config', 'config.json')
const rawConfig = JSON.parse(readFileSync(configPath, 'utf-8'))

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
  log.info({ mode, queries: queryList.length }, 'Starting scraper')

  let totalSaved = 0

  for (const config of queryList) {
    const label = `"${config.keyword}" in "${config.location}"`
    log.info({ keyword: config.keyword, location: config.location }, `Scraping ${label}`)
    const start = Date.now()

    try {
      const places = await scrapePlaces(config.keyword, config.location, { mode, concurrency })
      log.info({ count: places.length }, `Saving ${places.length} places`)

      for (const place of places) {
        insertPlace(place)
      }

      totalSaved += places.length
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)
      log.info({ count: places.length, elapsed }, `${label} done`)
    } catch (err) {
      log.error({ err }, `${label} error`)
    }
  }

  log.info({ total: totalSaved }, 'Scraper finished')
}

main().catch((err) => log.fatal({ err }, 'Fatal error'))
