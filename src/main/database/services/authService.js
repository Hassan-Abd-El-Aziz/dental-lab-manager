import crypto from 'crypto'
import { getRealm } from '../realm.js'
import { generateId } from './dentistService.js'
import { logAudit, setAuditUser } from './auditService.js'
import { saveSession, loadSession, clearSession } from './sessionStore.js'

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const key = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${key}`
}

function verifyPassword(password, stored) {
  if (!stored) return false
  const [salt, key] = stored.split(':')
  const testKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(testKey, 'hex'))
}

let currentUser = null

export function login(username, password) {
  const realm = getRealm()
  const user = realm.objects('User').filtered('username == $0', username.toLowerCase())[0]
  if (!user) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة')
  if (!user.active) throw new Error('الحساب غير فعال')
  if (!verifyPassword(password, user.passwordHash)) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة')
  currentUser = { id: user.id, username: user.username, role: user.role, name: user.name }
  saveSession(currentUser)
  setAuditUser(user.username)
  logAudit(user.username, 'LOGIN', 'User', user.id, 'تسجيل دخول')
  return currentUser
}

export function initSession() {
  clearSession()
  currentUser = null
  setAuditUser(null)
  return currentUser
}

export function logout() {
  logAudit(currentUser?.username || 'system', 'LOGOUT', 'User', currentUser?.id || '', 'تسجيل خروج')
  currentUser = null
  setAuditUser(null)
  clearSession()
}

export function getCurrentUser() {
  return currentUser
}

export function getCurrentUserRole() {
  return currentUser?.role || null
}

export function isAuthenticated() {
  return currentUser !== null
}

export function isAdmin() {
  return currentUser?.role === 'admin'
}

export function createUser(data) {
  const realm = getRealm()
  const existing = realm.objects('User').filtered('username == $0', data.username.toLowerCase())[0]
  if (existing) throw new Error('اسم المستخدم موجود بالفعل')
  let user
  realm.write(() => {
    user = realm.create('User', {
      id: generateId(),
      username: data.username.toLowerCase(),
      passwordHash: hashPassword(data.password),
      role: data.role || 'user',
      name: data.name || '',
      active: data.active !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  })
  logAudit(currentUser?.username || 'system', 'CREATE', 'User', user.id, `أنشأ المستخدم ${data.username}`)
  return { id: user.id, username: user.username, role: user.role, name: user.name }
}

export function seedAdminUser() {
  const realm = getRealm()
  const existing = realm.objects('User').filtered('username == "admin"')[0]
  if (!existing) {
    realm.write(() => {
      realm.create('User', {
        id: generateId(),
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        role: 'admin',
        name: 'المدير العام',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    })
    logAudit('system', 'CREATE', 'User', 'admin', 'أنشأ مستخدم المدير الافتراضي')
  }
}
