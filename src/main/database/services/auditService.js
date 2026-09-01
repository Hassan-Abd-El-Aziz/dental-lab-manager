import { getRealm } from '../realm.js'
import { generateId } from './dentistService.js'

let currentAuditUser = null

export function setAuditUser(username) {
  currentAuditUser = username
}

export function getAuditUser() {
  return currentAuditUser || 'system'
}

export function logAudit(userId, action, entityType, entityId, details) {
  const realm = getRealm()
  realm.write(() => {
    realm.create('AuditLog', {
      id: generateId(),
      userId: userId || '',
      username: getAuditUser(),
      action: action,
      entityType: entityType,
      entityId: entityId || '',
      details: details || '',
      timestamp: new Date()
    })
  })
}

export function getAllAuditLogs(filters = {}) {
  const realm = getRealm()
  let logs = realm.objects('AuditLog')
  if (filters.entityType) logs = logs.filtered('entityType == $0', filters.entityType)
  if (filters.action) logs = logs.filtered('action == $0', filters.action)
  if (filters.fromDate && filters.toDate) {
    const from = new Date(filters.fromDate)
    const to = new Date(filters.toDate)
    to.setHours(23, 59, 59, 999)
    logs = logs.filtered('timestamp >= $0 AND timestamp <= $1', from, to)
  }
  logs = logs.sorted('timestamp', true)
  return logs.map((l) => ({
    id: l.id, userId: l.userId, username: l.username, action: l.action,
    entityType: l.entityType, entityId: l.entityId, details: l.details,
    timestamp: l.timestamp
  }))
}
