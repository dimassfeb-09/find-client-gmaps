import { useState, useEffect, useCallback } from 'react'

const API = '/api'

export function usePlaces() {
  const [places, setPlaces] = useState([])
  const [stats, setStats] = useState(null)
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
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

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  const triggerScrape = async (keyword, location, mode = 'sequential') => {
    const res = await fetch(`${API}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, location, mode }),
    })
    const data = await res.json()
    await fetchPlaces()
    return data
  }

  const deletePlace = async (id) => {
    await fetch(`${API}/places/${id}`, { method: 'DELETE' })
    await fetchPlaces()
  }

  const clearData = async () => {
    await fetch(`${API}/clear`, { method: 'POST' })
    await fetchPlaces()
  }

  return { places, stats, cities, loading, filters, setFilters, triggerScrape, deletePlace, clearData }
}
