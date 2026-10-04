import { getRealm } from '../realm.js'
import { existsSync, readFileSync } from 'fs'

export function getSettings() {
  const realm = getRealm()
  const settings = realm.objects('Settings')[0]
  if (!settings) return null
  return { id: settings.id, labName: settings.labName || '', address: settings.address || '', phone: settings.phone || '', whatsapp: settings.whatsapp || '', email: settings.email || '', logoPath: settings.logoPath || '', nextOrderNumber: settings.nextOrderNumber, nextInvoiceNumber: settings.nextInvoiceNumber, nextPaymentNumber: settings.nextPaymentNumber, nextDentistCode: settings.nextDentistCode }
}

export function updateSettings(data) {
  const realm = getRealm()
  const settings = realm.objects('Settings')[0]
  if (!settings) throw new Error('Settings not found')
  realm.write(() => { if (data.labName !== undefined) settings.labName = data.labName; if (data.address !== undefined) settings.address = data.address; if (data.phone !== undefined) settings.phone = data.phone; if (data.whatsapp !== undefined) settings.whatsapp = data.whatsapp; if (data.email !== undefined) settings.email = data.email; if (data.logoPath !== undefined) settings.logoPath = data.logoPath })
  return getSettings()
}

export function getLogoDataUrl() {
  const settings = getSettings()
  const logoPath = settings?.logoPath
  if (!logoPath || !existsSync(logoPath)) return null
  const ext = logoPath.split('.').pop()?.toLowerCase()
  const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  try {
    return `data:${mime};base64,${readFileSync(logoPath).toString('base64')}`
  } catch {
    return null
  }
}
