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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, ExternalLink, MessageCircle, Globe, Database } from 'lucide-react'

function isLikelyWhatsApp(phone) {
  if (!phone) return false
  return /^08|\+628|^628/.test(phone.replace(/\s/g, ''))
}

function toWhatsAppLink(phone) {
  const digits = phone.replace(/\D/g, '')
  let wa = digits
  if (wa.startsWith('0')) wa = '62' + wa.slice(1)
  else if (wa.startsWith('628') || wa.startsWith('62')) wa = wa
  else return null
  return `https://wa.me/${wa}`
}

export function DataTable({ places, loading, onDelete }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Database size={32} className="text-muted-foreground/40" />
        <p className="text-sm font-medium">No data yet</p>
        <p className="text-xs text-muted-foreground/60">
          Run a scrape or adjust your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Address</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">City</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Coordinates</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Phone / WhatsApp</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Email</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Website</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {places.map((place) => (
              <TableRow key={place.id} className="group">
                <TableCell className="font-medium text-sm">{place.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={place.address}>
                  {place.address || '—'}
                </TableCell>
                <TableCell className="text-xs">{place.city}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground tabular-nums">
                  {place.latitude && place.longitude
                    ? `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
                    : '—'}
                </TableCell>
                <TableCell>
                  {place.phone ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isLikelyWhatsApp(place.phone) ? (
                        <>
                          <a
                            href={toWhatsAppLink(place.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                          >
                            <MessageCircle size={12} />
                            {place.phone}
                          </a>
                          <Badge
                            variant="default"
                            className="bg-emerald-600/10 text-emerald-700 border-emerald-200 text-[10px] font-medium px-1.5 py-0"
                          >
                            WA
                          </Badge>
                        </>
                      ) : (
                        <span className="text-xs">{place.phone}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {place.email || '—'}
                </TableCell>
                <TableCell className="max-w-[140px]">
                  {place.website ? (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <Globe size={11} />
                      <span className="truncate">{place.website.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={10} className="shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {place.has_website ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-600/5 text-emerald-700 border-emerald-200 text-[10px] font-medium"
                    >
                      Has Website
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-red-600/5 text-red-700 border-red-200 text-[10px] font-medium"
                    >
                      No Website
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-opacity"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Place</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{place.name}</strong>?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(place.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
