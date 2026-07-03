import { Card, CardContent } from '@/components/ui/card'

export function StatsCard({ stats }) {
  if (!stats) return null

  const cities = stats.perCity?.length ?? 0

  return (
    <div className="grid gap-3 grid-cols-3 sm:grid-cols-6">
      <Card className="shadow-none border-muted">
        <CardContent className="p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Places</p>
          <p className="text-lg font-bold tabular-nums">{stats.total}</p>
        </CardContent>
      </Card>
      <Card className="shadow-none border-muted">
        <CardContent className="p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">With Website</p>
          <p className="text-lg font-bold tabular-nums text-emerald-600">{stats.withWebsite}</p>
        </CardContent>
      </Card>
      <Card className="shadow-none border-muted">
        <CardContent className="p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">No Website</p>
          <p className="text-lg font-bold tabular-nums text-red-600">{stats.withoutWebsite}</p>
        </CardContent>
      </Card>
      <Card className="shadow-none border-muted">
        <CardContent className="p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">With Phone</p>
          <p className="text-lg font-bold tabular-nums text-emerald-600">{stats.withPhone}</p>
        </CardContent>
      </Card>
      <Card className="shadow-none border-muted">
        <CardContent className="p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">No Phone</p>
          <p className="text-lg font-bold tabular-nums text-red-600">{stats.withoutPhone}</p>
        </CardContent>
      </Card>
      <Card className="shadow-none border-muted">
        <CardContent className="p-3">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cities</p>
          <p className="text-lg font-bold tabular-nums">{cities}</p>
        </CardContent>
      </Card>
    </div>
  )
}
