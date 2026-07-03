import { Card, CardContent } from '@/components/ui/card'
import { Globe, GlobeOff, Phone, PhoneOff, MapPin, Building2 } from 'lucide-react'

const items = [
  { key: 'total', label: 'Total Places', icon: Building2, color: 'text-primary' },
  { key: 'withWebsite', label: 'With Website', icon: Globe, color: 'text-emerald-600' },
  { key: 'withoutWebsite', label: 'No Website', icon: GlobeOff, color: 'text-red-600' },
  { key: 'withPhone', label: 'With Phone', icon: Phone, color: 'text-emerald-600' },
  { key: 'withoutPhone', label: 'No Phone', icon: PhoneOff, color: 'text-red-600' },
  { key: 'cities', label: 'Cities', icon: MapPin, color: 'text-primary' },
]

export function StatsCard({ stats }) {
  if (!stats) return null

  const values = { ...stats, cities: stats.perCity?.length ?? 0 }

  return (
    <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
      {items.map(({ key, label, icon: Icon, color }) => (
        <Card key={key} className="shadow-none border-muted">
          <CardContent className="p-3 flex items-center gap-3">
            <div className={`shrink-0 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                {label}
              </p>
              <p className="text-lg font-bold tabular-nums">{values[key] ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
