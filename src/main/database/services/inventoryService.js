import { getRealm } from '../realm.js'
import { generateId } from './dentistService.js'
import { logAudit } from './auditService.js'
import { getCurrentUser } from './authService.js'

export function getAllInventory() {
  const realm = getRealm()
  const items = realm.objects('Item').filtered('inventory == true').sorted('name', true)
  return items.map((i) => {
    const category = realm.objectForPrimaryKey('Category', i.categoryId)
    const outTransactions = realm.objects('InventoryTransaction').filtered('itemId == $0 AND type == "OUT"', i.id)
    const withdrawn = outTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const remaining = Math.max(0, (i.quantity || 0) - withdrawn)
    return {
      id: i.id, name: i.name, categoryId: i.categoryId, price: i.price,
      quantity: i.quantity || 0, box: i.box || '',
      categoryName: category ? category.name : '',
      withdrawn, remaining,
      active: i.active, createdAt: i.createdAt, updatedAt: i.updatedAt
    }
  })
}

export function getItem(id) {
  const realm = getRealm()
  const item = realm.objectForPrimaryKey('Item', id)
  if (!item) return null
  return { id: item.id, name: item.name, categoryId: item.categoryId, price: item.price, quantity: item.quantity || 0, box: item.box || '', active: item.active, createdAt: item.createdAt }
}

export function setQuantity(itemId, quantity, box, notes) {
  const realm = getRealm()
  const item = realm.objectForPrimaryKey('Item', itemId)
  if (!item) throw new Error('الصنف غير موجود')
  realm.write(() => {
    item.quantity = (item.quantity || 0) + quantity
    if (box !== undefined) item.box = box || ''
    item.updatedAt = new Date()
  })
  logAudit(getCurrentUser()?.username || 'system', 'INVENTORY_SET', 'Item', itemId, `إضافة ${quantity} إلى كمية "${item.name}" (الجديد: ${item.quantity}) ${box ? 'مربع: ' + box : ''}`)
  return getItem(itemId)
}

export function setQuantityAbsolute(itemId, quantity, box, notes) {
  const realm = getRealm()
  const item = realm.objectForPrimaryKey('Item', itemId)
  if (!item) throw new Error('الصنف غير موجود')
  realm.write(() => {
    item.quantity = quantity
    if (box !== undefined) item.box = box || ''
    item.updatedAt = new Date()
  })
  logAudit(getCurrentUser()?.username || 'system', 'INVENTORY_SET', 'Item', itemId, `تعديل كمية "${item.name}" إلى ${quantity} ${box ? 'مربع: ' + box : ''}`)
  return getItem(itemId)
}

export function withdraw(itemId, quantity, orderId, notes) {
  const realm = getRealm()
  const item = realm.objectForPrimaryKey('Item', itemId)
  if (!item) throw new Error('الصنف غير موجود')
  const outTransactions = realm.objects('InventoryTransaction').filtered('itemId == $0 AND type == "OUT"', itemId)
  const currentWithdrawn = outTransactions.reduce((sum, t) => sum + t.quantity, 0)
  const remaining = (item.quantity || 0) - currentWithdrawn
  if (remaining < quantity) throw new Error(`الكمية غير الكافية - المتبقي ${remaining}`)
  realm.write(() => {
    item.updatedAt = new Date()
    realm.create('InventoryTransaction', {
      id: generateId(), itemId: item.id, itemName: item.name,
      type: 'OUT', quantity, box: item.box || '',
      orderId: orderId || null, notes: notes || '', createdAt: new Date()
    })
  })
  logAudit(getCurrentUser()?.username || 'system', 'INVENTORY_OUT', 'Item', itemId, `سحب ${quantity} من "${item.name}" ${orderId ? 'من الطلب ' + orderId : ''}`)
  return getItem(itemId)
}

export function resetItem(itemId) {
  const realm = getRealm()
  const item = realm.objectForPrimaryKey('Item', itemId)
  if (!item) throw new Error('الصنف غير موجود')
  realm.write(() => {
    item.quantity = 0
    item.updatedAt = new Date()
    const transactions = realm.objects('InventoryTransaction').filtered('itemId == $0', itemId)
    realm.delete(transactions)
  })
  logAudit(getCurrentUser()?.username || 'system', 'INVENTORY_RESET', 'Item', itemId, `تصفير مخزون "${item.name}"`)
  return getItem(itemId)
}

export function getTransactions(filters = {}) {
  const realm = getRealm()
  let ts = realm.objects('InventoryTransaction')
  if (filters.itemId) ts = ts.filtered('itemId == $0', filters.itemId)
  if (filters.type) ts = ts.filtered('type == $0', filters.type)
  if (filters.fromDate && filters.toDate) {
    const from = new Date(filters.fromDate)
    const to = new Date(filters.toDate)
    to.setHours(23, 59, 59, 999)
    ts = ts.filtered('createdAt >= $0 AND createdAt <= $1', from, to)
  }
  ts = ts.sorted('createdAt', true)
  return ts.map((t) => ({
    id: t.id, itemId: t.itemId, itemName: t.itemName, type: t.type,
    quantity: t.quantity, box: t.box || '', orderId: t.orderId || '',
    notes: t.notes || '', createdAt: t.createdAt
  }))
}
