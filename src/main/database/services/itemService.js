import { getRealm } from '../realm.js'
import { generateId } from './dentistService.js'

export function getAllItems() {
  const realm = getRealm()
  const items = realm.objects('Item').sorted('name', true)
  return items.map((item) => {
    const category = realm.objectForPrimaryKey('Category', item.categoryId)
    return { id: item.id, name: item.name, categoryId: item.categoryId, categoryName: category ? category.name : '', price: item.price, active: item.active }
  })
}

export function getItemsByCategory(categoryId) {
  const realm = getRealm()
  const items = realm.objects('Item').filtered('categoryId == $0 AND active == true', categoryId).sorted('name', true)
  return items.map((item) => ({ id: item.id, name: item.name, categoryId: item.categoryId, price: item.price }))
}

export function createItem(data) {
  const realm = getRealm()
  const id = generateId()
  realm.write(() => { realm.create('Item', { id, name: data.name, categoryId: data.categoryId, price: data.price, active: true, createdAt: new Date(), updatedAt: new Date() }) })
  return { id }
}

export function updateItem(id, data) {
  const realm = getRealm()
  const item = realm.objectForPrimaryKey('Item', id)
  if (!item) throw new Error('Item not found')
  realm.write(() => { if (data.name !== undefined) item.name = data.name; if (data.categoryId !== undefined) item.categoryId = data.categoryId; if (data.price !== undefined) item.price = data.price; item.updatedAt = new Date() })
  return { id }
}

export function deactivateItem(id) {
  const realm = getRealm()
  const item = realm.objectForPrimaryKey('Item', id)
  if (!item) throw new Error('Item not found')
  realm.write(() => { item.active = !item.active; item.updatedAt = new Date() })
  return { id, active: item.active }
}
