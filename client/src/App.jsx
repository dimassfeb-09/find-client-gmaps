import { usePlaces } from './hooks/usePlaces'
import { StatsCard } from './components/StatsCard'
import { FilterBar } from './components/FilterBar'
import { DataTable } from './components/DataTable'
import { ScrapeDialog } from './components/ScrapeDialog'

function App() {
  const { places, stats, cities, loading, filters, setFilters, triggerScrape, deletePlace, clearData } =
    usePlaces()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Google Maps Scraper</h1>
          <p className="text-muted-foreground mt-1">
            Scrape and browse business data from Google Maps
          </p>
        </header>

        <ScrapeDialog onScrape={triggerScrape} />

        <StatsCard stats={stats} />

        <FilterBar
          filters={filters}
          setFilters={setFilters}
          cities={cities}
          onClear={clearData}
        />

        <DataTable places={places} loading={loading} onDelete={deletePlace} />
      </div>
    </div>
  )
}

export default App
