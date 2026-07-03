import { usePlaces } from './hooks/usePlaces'
import { StatsCard } from './components/StatsCard'
import { FilterBar } from './components/FilterBar'
import { DataTable } from './components/DataTable'
import { ScrapeDialog } from './components/ScrapeDialog'

function App() {
  const {
    places, stats, cities, loading,
    scrapeProgress, isScraping,
    filters, setFilters, triggerScrape, deletePlace, clearData,
  } = usePlaces()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Google Maps Scraper</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scrape and browse business listings
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Scrape */}
        <ScrapeDialog
          onScrape={triggerScrape}
          scrapeProgress={scrapeProgress}
          isScraping={isScraping}
        />

        {/* Stats */}
        <section>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Overview
          </div>
          <StatsCard stats={stats} />
        </section>

        {/* Data */}
        <section>
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            cities={cities}
            onClear={clearData}
          />

          <div className="mt-3">
            {!loading && places.length > 0 && (
              <div className="text-xs text-muted-foreground mb-2">
                Showing {places.length} result{places.length !== 1 ? 's' : ''}
                {stats ? (
                  <span className="text-muted-foreground/60">
                    {' '}of {stats.total} total
                  </span>
                ) : null}
              </div>
            )}
            <DataTable places={places} loading={loading} onDelete={deletePlace} />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
