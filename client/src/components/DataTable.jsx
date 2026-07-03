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

function isLikelyWhatsApp(phone) {
  if (!phone) return false
  return /^08|\+628|^628/.test(phone.replace(/\s/g, ''))
}

function toWhatsAppLink(phone) {
  const digits = phone.replace(/\D/g, '')
  let wa = digits
  if (wa.startsWith('0')) wa = '62' + wa.slice(1)
  else if (wa.startsWith('628')) wa = wa
  else if (wa.startsWith('62')) wa = wa
  else return null
  return `https://wa.me/${wa}`
}

export function DataTable({ places, loading, onDelete }) {
  if (loading) {
    return <p className="text-muted-foreground py-8 text-center">Loading...</p>
  }

  if (places.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No places found. Run a scrape first or adjust filters.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Coordinates</TableHead>
            <TableHead>Phone / WhatsApp</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {places.map((place) => (
            <TableRow key={place.id}>
              <TableCell className="font-medium">{place.name}</TableCell>
              <TableCell className="max-w-[200px] truncate">{place.address}</TableCell>
              <TableCell>{place.city}</TableCell>
              <TableCell className="text-xs">
                {place.latitude && place.longitude
                  ? `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
                  : '-'}
              </TableCell>
              <TableCell>
                {place.phone ? (
                  <div className="flex items-center gap-2">
                    {isLikelyWhatsApp(place.phone) ? (
                      <>
                        <a
                          href={toWhatsAppLink(place.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:underline font-medium"
                        >
                          {place.phone}
                        </a>
                        <Badge variant="default" className="bg-green-600 text-xs whitespace-nowrap">
                          WhatsApp
                        </Badge>
                      </>
                    ) : (
                      <span>{place.phone}</span>
                    )}
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{place.email || '-'}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {place.website ? (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {place.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {place.has_website ? (
                  <Badge variant="default" className="bg-green-600 whitespace-nowrap">Has Website</Badge>
                ) : (
                  <Badge variant="destructive" className="whitespace-nowrap">No Website</Badge>
                )}
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Place</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete <strong>{place.name}</strong>? This action cannot be undone.
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
  )
}
