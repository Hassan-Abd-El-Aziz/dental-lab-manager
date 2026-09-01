import crypto from 'crypto'
import { getRealm } from '../realm.js'
import { generateId } from './dentistService.js'
import { logAudit, getAuditUser } from './auditService.js'

export function getAllUsers() {
  const realm = getRealm()
  return realm.objects('User').sorted('createdAt', true).map((u) => ({
    id: u.id, username: u.username, name: u.name || '', role: u.role,
    active: u.active, createdAt: u.createdAt
  }))
}

export function getUserById(id) {
  const realm = getRealm()
  const user = realm.objectForPrimaryKey('User', id)
  if (!user) return null
  return { id: user.id, username: user.username, name: user.name || '', role: user.role, active: user.active, createdAt: user.createdAt }
}

export function updateUser(id, data) {
  const realm = getRealm()
  const user = realm.objectForPrimaryKey('User', id)
  if (!user) throw new Error('المستخدم غير موجود')
  const oldRole = user.role
  const oldActive = user.active
  realm.write(() => {
    if (data.name !== undefined) user.name = data.name
    if (data.role !== undefined) user.role = data.role
    if (data.active !== undefined) user.active = data.active
    if (data.password) {
      const salt = crypto.randomBytes(16).toString('hex')
      const key = crypto.scryptSync(data.password, salt, 64).toString('hex')
      user.passwordHash = `${salt}:${key}`
    }
    user.updatedAt = new Date()
  })
  const changes = []
  if (oldRole !== data.role) changes.push(`غيّر الدور من ${oldRole} إلى ${data.role}`)
  if (oldActive !== data.active) changes.push(`غيّر الحالة إلى ${data.active ? 'فعال' : 'غير فعال'}`)
  if (data.name !== undefined) changes.push(`حدث الاسم`)
  if (data.password) changes.push('غيّر كلمة المرور')
  logAudit(getAuditUser(), 'UPDATE', 'User', id, changes.join('، ') || 'حدث بيانات المستخدم')
  return getUserById(id)
}

export function deleteUser(id) {
  const realm = getRealm()
  const user = realm.objectForPrimaryKey('User', id)
  if (!user) throw new Error('المستخدم غير موجود')
  if (user.role === 'admin') throw new Error('لا يمكن حذف مدير النظام')
  const username = user.username
  realm.write(() => {
    realm.delete(user)
  })
  logAudit(getAuditUser(), 'DELETE', 'User', id, `حذف المستخدم ${username}`)
}
