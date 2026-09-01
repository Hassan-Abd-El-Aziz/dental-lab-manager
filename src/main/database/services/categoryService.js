import { getRealm } from '../realm.js'
import { generateId } from './dentistService.js'

export function getAllCategories() {
  const realm = getRealm()
  const categories = realm.objects('Category').sorted('name', true)
  return categories.map((cat) => ({ id: cat.id, name: cat.name, active: cat.active, createdAt: cat.createdAt }))
}

export function getActiveCategories() {
  const realm = getRealm()
  const categories = realm.objects('Category').filtered('active == true').sorted('name', true)
  return categories.map((cat) => ({ id: cat.id, name: cat.name }))
}

export function createCategory(data) {
  const realm = getRealm()
  const id = `cat-${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`
  realm.write(() => { realm.create('Category', { id, name: data.name, active: true, createdAt: new Date() }) })
  return { id }
}

export function updateCategory(id, data) {
  const realm = getRealm()
  const category = realm.objectForPrimaryKey('Category', id)
  if (!category) throw new Error('Category not found')
  realm.write(() => { if (data.name !== undefined) category.name = data.name })
  return { id }
}

export function deactivateCategory(id) {
  const realm = getRealm()
  const category = realm.objectForPrimaryKey('Category', id)
  if (!category) throw new Error('Category not found')
  realm.write(() => { category.active = !category.active })
  return { id, active: category.active }
}

export function deleteCategory(id) {
  const realm = getRealm()
  const category = realm.objectForPrimaryKey('Category', id)
  if (!category) throw new Error('Category not found')
  realm.write(() => { realm.delete(category) })
  return { id }
}
