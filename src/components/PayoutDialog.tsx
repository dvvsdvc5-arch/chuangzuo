/**
 * components/PayoutDialog.tsx
 * Modal dialog to trigger manual payout from accrued earnings to wallet.
 */
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Button } from '../components/ui/button'

/**
 * PayoutDialogProps
 * Props for manual payout dialog.
 */
interface PayoutDialogProps {
  disabled?: boolean
  accruedMinor: number
  onConfirm: () => Promise<void>
}

/**
 * formatMinor
 * Formats minor units to human readable currency string.
 */
function formatMinor(minor: number, currency = 'USD') {
  const value = minor / 100
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

/**
 * PayoutDialog
 * Confirms and executes a payout action.
 */
export default function PayoutDialog({ disabled, accruedMinor, onConfirm }: PayoutDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="shadow-sm">Manual Payout</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Manual Payout</DialogTitle>
          <DialogDescription>
            This will move your accrued earnings into your wallet balance and create a ledger record.
          </DialogDescription>
        </DialogHeader>
        <div className="my-3 text-sm">
          Accrued amount to payout now:
          <span className="ml-2 font-medium">{formatMinor(accruedMinor)}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" className="bg-transparent" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || accruedMinor <= 0}>
            {loading ? 'Processing…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
