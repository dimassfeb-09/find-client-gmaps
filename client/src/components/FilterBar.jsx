import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function FilterBar({ filters, setFilters, cities, onClear }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="text-sm font-medium mb-1 block">Search</label>
        <Input
          placeholder="Search by name or address..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
      </div>

      <div className="w-[160px]">
        <label className="text-sm font-medium mb-1 block">City</label>
        <Select
          value={filters.city || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, city: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c.city} value={c.city}>
                {c.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-[140px]">
        <label className="text-sm font-medium mb-1 block">Website</label>
        <Select
          value={filters.hasWebsite || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hasWebsite: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Has website</SelectItem>
            <SelectItem value="false">No website</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[140px]">
        <label className="text-sm font-medium mb-1 block">Phone</label>
        <Select
          value={filters.hasPhone || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hasPhone: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Has phone</SelectItem>
            <SelectItem value="false">No phone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-[150px]">
        <label className="text-sm font-medium mb-1 block">WhatsApp</label>
        <Select
          value={filters.hasWhatsApp || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hasWhatsApp: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">08xx (WA)</SelectItem>
            <SelectItem value="false">Non-08xx</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <button
        onClick={onClear}
        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 text-sm"
      >
        Clear Data
      </button>
    </div>
  )
}
