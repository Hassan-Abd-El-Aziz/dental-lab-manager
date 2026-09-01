import { getRealm } from '../realm.js'
import { logAudit } from './auditService.js'
import { getCurrentUser } from './authService.js'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function generateDentistCode() {
  const realm = getRealm()
  const settings = realm.objects('Settings')[0]
  let code
  realm.write(() => {
    code = `DOC-${String(settings.nextDentistCode).padStart(6, '0')}`
    settings.nextDentistCode += 1
  })
  return code
}

export function getAllDentists() {
  const realm = getRealm()
  const dentists = realm.objects('Dentist').sorted('createdAt', true)
  return dentists.map((d) => {
    const invoices = realm.objects('Invoice').filtered('dentistId == $0', d.id)
    const payments = realm.objects('Payment').filtered('dentistId == $0', d.id)
    let totalInvoices = 0, totalPaid = 0
    invoices.forEach((inv) => { totalInvoices += inv.total })
    payments.forEach((pay) => { totalPaid += pay.amount })
    return {
      id: d.id, dentistCode: d.dentistCode, name: d.name, phone: d.phone || '',
      clinic: d.clinic || '', address: d.address || '', notes: d.notes || '',
      active: d.active, createdAt: d.createdAt, updatedAt: d.updatedAt,
      invoiceCount: invoices.length, totalInvoices, totalPaid, remaining: totalInvoices - totalPaid
    }
  })
}

export function getDentistById(id) {
  const realm = getRealm()
  const d = realm.objectForPrimaryKey('Dentist', id)
  if (!d) return null
  const invoices = realm.objects('Invoice').filtered('dentistId == $0', d.id)
  const payments = realm.objects('Payment').filtered('dentistId == $0', d.id)
  let totalInvoices = 0, totalPaid = 0
  invoices.forEach((inv) => { totalInvoices += inv.total })
  payments.forEach((pay) => { totalPaid += pay.amount })
  return {
    id: d.id, dentistCode: d.dentistCode, name: d.name, phone: d.phone || '',
    clinic: d.clinic || '', address: d.address || '', notes: d.notes || '',
    active: d.active, createdAt: d.createdAt, updatedAt: d.updatedAt,
    invoiceCount: invoices.length, totalInvoices, totalPaid, remaining: totalInvoices - totalPaid
  }
}

export function createDentist(data) {
  const realm = getRealm()
  const code = generateDentistCode()
  const id = generateId()
  realm.write(() => {
    realm.create('Dentist', { id, dentistCode: code, name: data.name, phone: data.phone || '', clinic: data.clinic || '', address: data.address || '', notes: data.notes || '', active: true, createdAt: new Date(), updatedAt: new Date() })
  })
  return getDentistById(id)
}

export function updateDentist(id, data) {
  const realm = getRealm()
  const dentist = realm.objectForPrimaryKey('Dentist', id)
  if (!dentist) throw new Error('Dentist not found')
  realm.write(() => {
    if (data.name !== undefined) dentist.name = data.name
    if (data.phone !== undefined) dentist.phone = data.phone
    if (data.clinic !== undefined) dentist.clinic = data.clinic
    if (data.address !== undefined) dentist.address = data.address
    if (data.notes !== undefined) dentist.notes = data.notes
    dentist.updatedAt = new Date()
  })
  return getDentistById(id)
}

export function deactivateDentist(id) {
  const realm = getRealm()
  const dentist = realm.objectForPrimaryKey('Dentist', id)
  if (!dentist) throw new Error('Dentist not found')
  realm.write(() => { dentist.active = !dentist.active; dentist.updatedAt = new Date() })
  return getDentistById(id)
}

export function deleteDentist(id) {
  const realm = getRealm()
  const dentist = realm.objectForPrimaryKey('Dentist', id)
  if (!dentist) throw new Error('الطبيب غير موجود')
  const dentistName = dentist.name
  realm.write(() => { realm.delete(dentist) })
  logAudit(getCurrentUser()?.username || 'system', 'DELETE', 'Dentist', id, `حذف الطبيب "${dentistName}"`)
  return true
}

export function getDentistAccount(dentistId, fromDate, toDate) {
  const realm = getRealm()
  const dentist = realm.objectForPrimaryKey('Dentist', dentistId)
  if (!dentist) throw new Error('Dentist not found')

  let entries = realm.objects('LedgerEntry').filtered('dentistId == $0', dentistId)
  if (fromDate && toDate) {
    const from = new Date(fromDate)
    const to = new Date(toDate); to.setHours(23, 59, 59, 999)
    entries = entries.filtered('date >= $0 AND date <= $1', from, to)
  }
  entries = entries.sorted('date', false)

  let runningBalance = 0
  const allEntries = realm.objects('LedgerEntry').filtered('dentistId == $0', dentistId).sorted('date', true)
  if (fromDate && toDate) {
    const from = new Date(fromDate)
    allEntries.forEach((entry) => { if (entry.date < from) runningBalance += entry.debit - entry.credit })
  }

  const ledgerEntries = entries.map((entry) => {
    runningBalance += entry.debit - entry.credit
    return { id: entry.id, date: entry.date, type: entry.type, description: entry.description, debit: entry.debit, credit: entry.credit, balance: runningBalance }
  })

  const invoices = realm.objects('Invoice').filtered('dentistId == $0', dentistId)
  const payments = realm.objects('Payment').filtered('dentistId == $0', dentistId)
  let totalInvoices = 0, totalPaid = 0
  invoices.forEach((inv) => { totalInvoices += inv.total })
  payments.forEach((pay) => { totalPaid += pay.amount })

  return {
    dentist: { id: dentist.id, name: dentist.name, phone: dentist.phone || '', clinic: dentist.clinic || '' },
    summary: { invoiceCount: invoices.length, totalInvoices, totalPaid, remaining: totalInvoices - totalPaid },
    ledger: ledgerEntries
  }
}

export function searchDentists(query) {
  const realm = getRealm()
  const results = realm.objects('Dentist').filtered('name CONTAINS[c] $0 OR phone CONTAINS[c] $0 OR dentistCode CONTAINS[c] $0', query).sorted('name', true)
  return results.map((d) => ({ id: d.id, dentistCode: d.dentistCode, name: d.name, phone: d.phone || '', clinic: d.clinic || '', active: d.active }))
}

export { generateId }
