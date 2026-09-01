import { getRealm } from '../realm.js'
import { logAudit } from './auditService.js'
import { getCurrentUser } from './authService.js'

export function getAllInvoices(filters = {}) {
  const realm = getRealm()
  let invoices = realm.objects('Invoice')
  if (filters.dentistId) invoices = invoices.filtered('dentistId == $0', filters.dentistId)
  if (filters.fromDate && filters.toDate) {
    const from = new Date(filters.fromDate); const to = new Date(filters.toDate); to.setHours(23, 59, 59, 999)
    invoices = invoices.filtered('date >= $0 AND date <= $1', from, to)
  }
  if (filters.status) invoices = invoices.filtered('status == $0', filters.status)
  if (filters.search) invoices = invoices.filtered('invoiceNumber CONTAINS[c] $0', filters.search)
  invoices = invoices.sorted('createdAt', true)
  return invoices.map((inv) => {
    const dentist = realm.objectForPrimaryKey('Dentist', inv.dentistId)
    return { id: inv.id, invoiceNumber: inv.invoiceNumber, orderId: inv.orderId, dentistId: inv.dentistId, dentistName: dentist ? dentist.name : '', date: inv.date, total: inv.total, paid: inv.paid, remaining: inv.remaining, status: inv.status, totalDiscount: inv.totalDiscount || 0, diagnosis: inv.diagnosis || '', teeth: inv.teeth || '', category: inv.category || '', categoryComment: inv.categoryComment || '' }
  })
}

export function getInvoiceById(id) {
  const realm = getRealm()
  const inv = realm.objectForPrimaryKey('Invoice', id)
  if (!inv) return null
  const dentist = realm.objectForPrimaryKey('Dentist', inv.dentistId)
  const order = realm.objectForPrimaryKey('Order', inv.orderId)
  let items = []
  if (order) {
    const orderItems = realm.objects('OrderItem').filtered('orderId == $0', order.id)
    items = orderItems.map((i) => ({ itemNameSnapshot: i.itemNameSnapshot, unitPriceSnapshot: i.unitPriceSnapshot, quantity: i.quantity, lineTotal: i.lineTotal, discount: i.discount || 0 }))
  }
  return { id: inv.id, invoiceNumber: inv.invoiceNumber, orderId: inv.orderId, dentistId: inv.dentistId, dentistName: dentist ? dentist.name : '', dentistPhone: dentist ? dentist.phone : '', dentistClinic: dentist ? dentist.clinic : '', date: inv.date, total: inv.total, paid: inv.paid, remaining: inv.remaining, status: inv.status, totalDiscount: inv.totalDiscount || 0, diagnosis: inv.diagnosis || '', teeth: inv.teeth || '', category: inv.category || '', categoryComment: inv.categoryComment || '', items }
}

export function cancelInvoice(id) {
  const realm = getRealm()
  const invoice = realm.objectForPrimaryKey('Invoice', id)
  if (!invoice) throw new Error('Invoice not found')
  realm.write(() => { invoice.status = 'CANCELLED'; invoice.updatedAt = new Date() })
  return getInvoiceById(id)
}

export function deleteInvoice(id) {
  const realm = getRealm()
  const invoice = realm.objectForPrimaryKey('Invoice', id)
  if (!invoice) throw new Error('الفاتورة غير موجودة')
  const invoiceNumber = invoice.invoiceNumber
  realm.write(() => { realm.delete(invoice) })
  logAudit(getCurrentUser()?.username || 'system', 'DELETE', 'Invoice', id, `حذف الفاتورة "${invoiceNumber}"`)
  return true
}
