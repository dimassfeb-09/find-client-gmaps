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

function toWhatsAppLink(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  let wa = digits
  if (wa.startsWith('0')) wa = '62' + wa.slice(1)
  else if (wa.startsWith('628') || wa.startsWith('62')) wa = wa
  else return null
  return `https://wa.me/${wa}`
}

export function DataTable({ places, loading, onDelete, onCheckWhatsApp, checkingWA }) {
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
                  {place.address || '-'}
                </TableCell>
                <TableCell className="text-xs">{place.city}</TableCell>
                <TableCell className="text-[11px] text-muted-foreground tabular-nums">
                  {place.latitude && place.longitude
                    ? `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
                    : '-'}
                </TableCell>
                <TableCell>
                  {place.phone ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {place.whatsapp_verified ? (
                        <>
                          <a
                            href={toWhatsAppLink(place.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-emerald-600 hover:underline"
                          >
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{place.phone}</span>
                          <button
                            onClick={() => onCheckWhatsApp?.(place.id)}
                            disabled={checkingWA === place.id}
                            className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-medium border border-muted-foreground/20 text-muted-foreground hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 transition-colors"
                          >
                            {checkingWA === place.id ? (
                              <span className="flex items-center gap-1">
                                <span className="size-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                                Checking
                              </span>
                            ) : (
                              'Check WA'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {place.email || '-'}
                </TableCell>
                <TableCell className="max-w-[140px]">
                  {place.website ? (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate inline-block max-w-full"
                    >
                      {place.website.replace(/^https?:\/\//, '')}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c0 1 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
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
