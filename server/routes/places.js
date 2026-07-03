import { Router } from 'express'
import { getAllPlaces, getCities, getStats, clearAll, insertPlace, deletePlace } from '../../database/db.js'
import { scrapePlaces } from '../../scraper/googleMapsScraper.js'
import { db } from '../../database/db.js'

export const placesRouter = Router()

placesRouter.get('/places', (req, res) => {
  const filters = {
    city: req.query.city || undefined,
    search: req.query.search || undefined,
    hasPhone: req.query.hasPhone || undefined,
    hasWhatsApp: req.query.hasWhatsApp || undefined,
  }
  if (req.query.hasWebsite !== undefined) {
    filters.hasWebsite = req.query.hasWebsite === 'true'
  }
  const places = getAllPlaces(filters)
  res.json(places)
})

placesRouter.route('/places/:id')
  .get((req, res) => {
    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id)
    if (!place) return res.status(404).json({ error: 'Not found' })
    res.json(place)
  })
  .delete((req, res) => {
    const result = deletePlace(req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
  })

placesRouter.get('/cities', (_req, res) => {
  res.json(getCities())
})

placesRouter.get('/stats', (_req, res) => {
  res.json(getStats())
})

placesRouter.post('/scrape', async (req, res) => {
  const { keyword, location } = req.body
  if (!keyword || !location) {
    return res.status(400).json({ error: 'keyword and location are required' })
  }

  try {
    const places = await scrapePlaces(keyword, location)
    for (const place of places) {
      insertPlace(place)
    }
    res.json({ count: places.length, places })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

placesRouter.post('/clear', (_req, res) => {
  clearAll()
  res.json({ message: 'All data cleared' })
})
