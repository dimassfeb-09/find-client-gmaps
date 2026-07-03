import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ScrapeDialog({ onScrape }) {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [mode, setMode] = useState('sequential')
  const [scraping, setScraping] = useState(false)
  const [result, setResult] = useState(null)

  const handleScrape = async () => {
    if (!keyword || !location) return
    setScraping(true)
    setResult(null)
    try {
      const data = await onScrape(keyword, location, mode)
      setResult(`Found ${data.count} places (${mode})`)
    } catch {
      setResult('Error scraping')
    } finally {
      setScraping(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scrape Google Maps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Keyword</label>
            <Input
              placeholder="e.g. restaurant"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Location</label>
            <Input
              placeholder="e.g. Jakarta"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="w-[140px]">
            <label className="text-sm font-medium mb-1 block">Mode</label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="concurrent">Concurrent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleScrape} disabled={scraping || !keyword || !location}>
            {scraping ? 'Scraping...' : 'Scrape'}
          </Button>
        </div>
        {result && <p className="mt-2 text-sm text-muted-foreground">{result}</p>}
      </CardContent>
    </Card>
  )
}
