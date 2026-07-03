import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ScrapeDialog({ scrapeProgress, isScraping, onScrape }) {
  const keywordRef = useRef(null)
  const locationRef = useRef(null)
  const modeRef = useRef(null)
  const logEndRef = useRef(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [scrapeProgress])

  const handleScrape = () => {
    const keyword = keywordRef.current?.value
    const location = locationRef.current?.value
    const mode = modeRef.current?.value || 'sequential'
    if (!keyword || !location) return
    onScrape(keyword, location, mode)
  }

  const lastProgress = scrapeProgress.findLast((p) => p.type === 'progress' || p.type === 'detail')
  const current = lastProgress?.current ?? 0
  const total = scrapeProgress.find((p) => p.type === 'listings')?.total ?? 0
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  const isDone = scrapeProgress.some((p) => p.type === 'done')

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
      <div className="flex flex-col p-4 gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Keyword
            </label>
            <Input
              ref={keywordRef}
              placeholder="e.g. restaurant"
              defaultValue=""
              disabled={isScraping}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Location
            </label>
            <Input
              ref={locationRef}
              placeholder="e.g. Jakarta"
              defaultValue=""
              disabled={isScraping}
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Mode
            </label>
            <Select defaultValue="sequential" disabled={isScraping}>
              <SelectTrigger ref={modeRef}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="concurrent">Concurrent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleScrape} disabled={isScraping}>
              {isScraping ? 'Scraping...' : 'Scrape'}
            </Button>
          </div>
        </div>

        {isScraping && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Progress value={percent} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {current}/{total}
              </span>
            </div>

            <div className="h-36 overflow-y-auto rounded-lg border bg-muted/40 p-2.5 text-xs font-mono leading-relaxed space-y-1">
              {scrapeProgress.map((entry, i) => (
                <div key={i} className={logEntryClass(entry.type)}>
                  {entry.type === 'status' && entry.message}
                  {entry.type === 'listings' && `Found ${entry.total} results`}
                  {entry.type === 'progress' &&
                    `[${String(entry.current).padStart(String(total).length, ' ')}/${total}] ${entry.name.slice(0, 50)}...`}
                  {entry.type === 'detail' && (
                    <span>
                      {entry.name.slice(0, 45)} - phone: {entry.phone ? 'yes' : 'no'}, website:{' '}
                      {entry.website ? 'yes' : 'no'}
                    </span>
                  )}
                  {entry.type === 'wa_progress' &&
                    `WA check: ${entry.current}/${entry.total}`}
                  {entry.type === 'error' && entry.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}

        {!isScraping && isDone && (
          <p className="text-xs text-emerald-600 font-medium">
            Done - {scrapeProgress.find((p) => p.type === 'done')?.count ?? 0} places saved
          </p>
        )}
      </div>
    </div>
  )
}

function logEntryClass(type) {
  switch (type) {
    case 'error':
      return 'text-red-600'
    case 'detail':
    case 'done':
      return 'text-emerald-700'
    default:
      return 'text-muted-foreground'
  }
}
