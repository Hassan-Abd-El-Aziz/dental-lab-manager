import { getRealm } from '../realm.js'
import Realm from 'realm'
import { generateId } from './dentistService.js'

function generateOrderNumber() {
  const realm = getRealm()
  const settings = realm.objects('Settings')[0]
  let num
  realm.write(() => { num = `ORD-${String(settings.nextOrderNumber).padStart(6, '0')}`; settings.nextOrderNumber += 1 })
  return num
}

function generatePaymentNumberInternal(realm) {
  const settings = realm.objects('Settings')[0]
  const num = `PAY-${String(settings.nextPaymentNumber).padStart(6, '0')}`
  settings.nextPaymentNumber += 1
  return num
}

function buildTeethString(data) {
  const parts = []
  if (data.upperTooth1) parts.push(`علوي ${data.upperTooth1}`)
  if (data.upperTooth2) parts.push(`علوي ${data.upperTooth2}`)
  if (data.lowerTooth1) parts.push(`سفلي ${data.lowerTooth1}`)
  if (data.lowerTooth2) parts.push(`سفلي ${data.lowerTooth2}`)
  return parts.join(' - ')
}

export function createOrder(data) {
  const realm = getRealm()
  const orderNumber = generateOrderNumber()
  const orderId = generateId()
  const invoiceId = generateId()
  let invoiceNumber = ''
  realm.write(() => {
    const settings = realm.objects('Settings')[0]
    invoiceNumber = `INV-${String(settings.nextInvoiceNumber).padStart(6, '0')}`
    settings.nextInvoiceNumber += 1
  })

  const paid = data.paid || 0
  const remaining = data.total - paid

  realm.write(() => {
    realm.create('Order', {
      id: orderId, orderNumber, invoiceId, dentistId: data.dentistId,
      orderDate: new Date(data.orderDate), condition: data.condition || 'حالة جديدة',
      diagnosis: data.diagnosis || '', upperTooth1: data.upperTooth1 || null,
      upperTooth2: data.upperTooth2 || null, lowerTooth1: data.lowerTooth1 || null,
      lowerTooth2: data.lowerTooth2 || null, categoryId: data.categoryId || '',
      categoryNameSnapshot: data.categoryName || '', categoryComment: data.categoryComment || '',
      total: data.total, paid, remaining,
      status: remaining <= 0 ? 'COMPLETED' : 'PENDING',
      createdAt: new Date(), updatedAt: new Date()
    })

    if (data.items?.length) {
      data.items.forEach((item) => {
        realm.create('OrderItem', { id: generateId(), orderId, itemId: item.itemId, itemNameSnapshot: item.itemName, unitPriceSnapshot: item.unitPrice, quantity: item.quantity, lineTotal: item.lineTotal })
      })
    }

    realm.create('Invoice', {
      id: invoiceId, invoiceNumber, orderId, dentistId: data.dentistId,
      date: new Date(data.orderDate), total: data.total, paid, remaining,
      status: remaining <= 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'UNPAID',
      diagnosis: data.diagnosis || '', teeth: buildTeethString(data),
      category: data.categoryName || '', categoryComment: data.categoryComment || '',
      createdAt: new Date(), updatedAt: new Date()
    })

    realm.create('LedgerEntry', { id: generateId(), dentistId: data.dentistId, orderId, invoiceId, paymentId: null, date: new Date(data.orderDate), type: 'INVOICE', description: `فاتورة ${invoiceNumber}`, debit: data.total, credit: 0, createdAt: new Date() })

    if (paid > 0) {
      const paymentNum = generatePaymentNumberInternal(realm)
      const paymentId = generateId()
      realm.create('Payment', { id: paymentId, paymentNumber: paymentNum, dentistId: data.dentistId, invoiceId, orderId, amount: paid, date: new Date(data.orderDate), notes: 'دفعة مع الطلب', createdAt: new Date() })
      realm.create('LedgerEntry', { id: generateId(), dentistId: data.dentistId, orderId, invoiceId, paymentId, date: new Date(data.orderDate), type: 'PAYMENT', description: `دفعة ${paymentNum}`, debit: 0, credit: paid, createdAt: new Date() })
    }
  })

  return { orderId, invoiceId, orderNumber, invoiceNumber }
}

export function getAllOrders(filters = {}) {
  const realm = getRealm()
  let orders = realm.objects('Order')
  if (filters.dentistId) orders = orders.filtered('dentistId == $0', filters.dentistId)
  if (filters.fromDate && filters.toDate) {
    const from = new Date(filters.fromDate); const to = new Date(filters.toDate); to.setHours(23, 59, 59, 999)
    orders = orders.filtered('orderDate >= $0 AND orderDate <= $1', from, to)
  }
  orders = orders.sorted('createdAt', true)
  return orders.map((o) => {
    const dentist = realm.objectForPrimaryKey('Dentist', o.dentistId)
    const orderItems = realm.objects('OrderItem').filtered('orderId == $0', o.id)
    return {
      id: o.id, orderNumber: o.orderNumber, invoiceId: o.invoiceId, dentistId: o.dentistId,
      dentistName: dentist ? dentist.name : '', orderDate: o.orderDate, condition: o.condition,
      diagnosis: o.diagnosis, total: o.total, paid: o.paid, remaining: o.remaining, status: o.status,
      items: orderItems.map((i) => ({ id: i.id, itemNameSnapshot: i.itemNameSnapshot, unitPriceSnapshot: i.unitPriceSnapshot, quantity: i.quantity, lineTotal: i.lineTotal }))
    }
  })
}

export function getOrderById(id) {
  const realm = getRealm()
  const o = realm.objectForPrimaryKey('Order', id)
  if (!o) return null
  const dentist = realm.objectForPrimaryKey('Dentist', o.dentistId)
  const orderItems = realm.objects('OrderItem').filtered('orderId == $0', o.id)
  return {
    id: o.id, orderNumber: o.orderNumber, invoiceId: o.invoiceId, dentistId: o.dentistId,
    dentistName: dentist ? dentist.name : '', orderDate: o.orderDate, condition: o.condition,
    total: o.total, paid: o.paid, remaining: o.remaining, status: o.status,
    items: orderItems.map((i) => ({ id: i.id, itemNameSnapshot: i.itemNameSnapshot, unitPriceSnapshot: i.unitPriceSnapshot, quantity: i.quantity, lineTotal: i.lineTotal }))
  }
}
