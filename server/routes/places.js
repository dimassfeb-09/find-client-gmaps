import { Router } from 'express'
import { getAllPlaces, getCities, getStats, clearAll, insertPlace, deletePlace, updatePlace } from '../../database/db.js'
import { scrapePlaces } from '../../scraper/googleMapsScraper.js'
import { db } from '../../database/db.js'

export const placesRouter = Router()

// SSE clients keyed by sessionId
const sseClients = new Map()

// --- SSE progress stream ---
placesRouter.get('/scrape/progress/:sessionId', (req, res) => {
  const { sessionId } = req.params

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

  sseClients.set(sessionId, res)

  req.on('close', () => {
    sseClients.delete(sessionId)
  })
})

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
  .patch((req, res) => {
    const allowed = ['phone_verified', 'whatsapp_verified']
    const data = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key] ? 1 : 0
    }
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'No valid fields' })
    updatePlace(req.params.id, data)
    res.json({ message: 'Updated' })
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
  const { keyword, location, mode, concurrency, sessionId } = req.body
  if (!keyword || !location) {
    return res.status(400).json({ error: 'keyword and location are required' })
  }

  // Respond immediately, run scrape in background
  res.json({ status: 'started' })

  const send = (event) => {
    const client = sseClients.get(sessionId)
    if (client) {
      client.write(`data: ${JSON.stringify(event)}\n\n`)
    }
  }

  send({ type: 'status', message: 'Starting scrape...' })

  try {
    const places = await scrapePlaces(keyword, location, {
      mode,
      concurrency,
      onProgress: (p) => send(p),
    })

    send({ type: 'status', message: `Saving ${places.length} places to database...` })

    for (const place of places) {
      insertPlace(place)
    }

    send({ type: 'done', count: places.length })
  } catch (err) {
    send({ type: 'error', message: err.message })
  }

  // Close SSE stream
  const client = sseClients.get(sessionId)
  if (client) {
    client.end()
    sseClients.delete(sessionId)
  }
})

placesRouter.post('/clear', (_req, res) => {
  clearAll()
  res.json({ message: 'All data cleared' })
})
