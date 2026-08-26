import { getRealm } from '../realm.js'
import { generateId } from './dentistService.js'

function generatePaymentNumber() {
  const realm = getRealm()
  const settings = realm.objects('Settings')[0]
  let num
  realm.write(() => { num = `PAY-${String(settings.nextPaymentNumber).padStart(6, '0')}`; settings.nextPaymentNumber += 1 })
  return num
}

export function createPayment(data) {
  const realm = getRealm()
  const paymentNumber = generatePaymentNumber()
  const paymentId = generateId()
  realm.write(() => {
    realm.create('Payment', { id: paymentId, paymentNumber, dentistId: data.dentistId, invoiceId: data.invoiceId || null, orderId: data.orderId || null, amount: data.amount, date: new Date(data.date), notes: data.notes || '', createdAt: new Date() })
    realm.create('LedgerEntry', { id: generateId(), dentistId: data.dentistId, orderId: data.orderId || null, invoiceId: data.invoiceId || null, paymentId, date: new Date(data.date), type: 'PAYMENT', description: `دفعة ${paymentNumber}`, debit: 0, credit: data.amount, createdAt: new Date() })
    if (data.invoiceId) {
      const invoice = realm.objectForPrimaryKey('Invoice', data.invoiceId)
      if (invoice) {
        invoice.paid += data.amount; invoice.remaining = invoice.total - invoice.paid
        if (invoice.remaining <= 0) invoice.status = 'PAID'
        else if (invoice.paid > 0) invoice.status = 'PARTIAL'
        invoice.updatedAt = new Date()
      }
    }
  })
  return { paymentId, paymentNumber }
}

export function getAllPayments(filters = {}) {
  const realm = getRealm()
  let payments = realm.objects('Payment')
  if (filters.dentistId) payments = payments.filtered('dentistId == $0', filters.dentistId)
  if (filters.fromDate && filters.toDate) {
    const from = new Date(filters.fromDate); const to = new Date(filters.toDate); to.setHours(23, 59, 59, 999)
    payments = payments.filtered('date >= $0 AND date <= $1', from, to)
  }
  payments = payments.sorted('createdAt', true)
  return payments.map((pay) => {
    const dentist = realm.objectForPrimaryKey('Dentist', pay.dentistId)
    return { id: pay.id, paymentNumber: pay.paymentNumber, dentistId: pay.dentistId, dentistName: dentist ? dentist.name : '', invoiceId: pay.invoiceId || '', orderId: pay.orderId || '', amount: pay.amount, date: pay.date, notes: pay.notes || '' }
  })
}
