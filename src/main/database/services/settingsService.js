import { getRealm } from '../realm.js'

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
