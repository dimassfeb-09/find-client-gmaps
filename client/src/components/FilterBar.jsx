import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Search } from 'lucide-react'

export function FilterBar({ filters, setFilters, cities, onClear }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Filters
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            placeholder="Search name or address..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="pl-8 h-9 text-sm"
          />
        </div>

        {/* City */}
        <Select
          value={filters.city || 'all'}
          onValueChange={(v) => setFilters((f) => ({ ...f, city: v === 'all' ? '' : v }))}
        >
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="City" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All cities</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c.city} value={c.city}>
                {c.city} ({c.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Website */}
        <Select
          value={filters.hasWebsite || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hasWebsite: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Website" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Has website</SelectItem>
            <SelectItem value="false">No website</SelectItem>
          </SelectContent>
        </Select>

        {/* Phone */}
        <Select
          value={filters.hasPhone || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hasPhone: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="Phone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Has phone</SelectItem>
            <SelectItem value="false">No phone</SelectItem>
          </SelectContent>
        </Select>

        {/* WhatsApp */}
        <Select
          value={filters.hasWhatsApp || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hasWhatsApp: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="WhatsApp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">08xx (likely WA)</SelectItem>
            <SelectItem value="false">Non-08xx</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 size={14} />
              Clear Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear All Data</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>all</strong> scraped data?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClear}>Delete All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
