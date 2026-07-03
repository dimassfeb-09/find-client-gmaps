import { useState, useEffect, useCallback, useRef } from 'react'

const API = '/api'

export function usePlaces() {
  const [places, setPlaces] = useState([])
  const [stats, setStats] = useState(null)
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [scrapeProgress, setScrapeProgress] = useState([])
  const [isScraping, setIsScraping] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    hasWebsite: '',
    hasPhone: '',
    hasWhatsApp: '',
  })

  const fetchPlaces = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.city) params.set('city', filters.city)
      if (filters.hasWebsite !== '') params.set('hasWebsite', filters.hasWebsite)
      if (filters.hasPhone !== '') params.set('hasPhone', filters.hasPhone)
      if (filters.hasWhatsApp !== '') params.set('hasWhatsApp', filters.hasWhatsApp)
      const qs = params.toString()

      const [placesRes, statsRes, citiesRes] = await Promise.all([
        fetch(`${API}/places${qs ? `?${qs}` : ''}`),
        fetch(`${API}/stats`),
        fetch(`${API}/cities`),
      ])

      setPlaces(await placesRes.json())
      setStats(await statsRes.json())
      setCities(await citiesRes.json())
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Keep a ref to the latest fetchPlaces for use in async callbacks
  const fetchPlacesRef = useRef(fetchPlaces)
  fetchPlacesRef.current = fetchPlaces

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  const triggerScrape = async (keyword, location, mode = 'sequential') => {
    setIsScraping(true)
    setScrapeProgress([])

    const sessionId = crypto.randomUUID()
    const es = new EventSource(`${API}/scrape/progress/${sessionId}`)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setScrapeProgress((prev) => [...prev, data])
        if (data.type === 'done' || data.type === 'error') {
          es.close()
          setIsScraping(false)
          fetchPlacesRef.current()
        }
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => {
      es.close()
      setIsScraping(false)
    }

    // Trigger the scrape (non-blocking — server returns immediately)
    await fetch(`${API}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, location, mode, sessionId }),
    })
  }

  const updatePlace = async (id, data) => {
    await fetch(`${API}/places/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await fetchPlaces()
  }

  const deletePlace = async (id) => {
    await fetch(`${API}/places/${id}`, { method: 'DELETE' })
    await fetchPlaces()
  }

  const clearData = async () => {
    await fetch(`${API}/clear`, { method: 'POST' })
    await fetchPlaces()
  }

  return {
    places, stats, cities, loading,
    scrapeProgress, isScraping,
    filters, setFilters,
    triggerScrape, updatePlace, deletePlace, clearData,
  }
}
