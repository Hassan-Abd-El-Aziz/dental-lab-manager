import crypto from 'crypto'

const SECRET = 'dental-lab-manager::license::v1::8f2c41a7b6d94e0f'
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const CODE_GROUP_SIZE = 4

function toBase32(bytes) {
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function stripSymbols(value) {
  return String(value || '').toUpperCase().replace(/[^0-9A-Z]/g, '')
}

function mapAmbiguous(value) {
  return value.replace(/I/g, '1').replace(/L/g, '1').replace(/O/g, '0')
}

function group(text, size) {
  return text.match(new RegExp(`.{1,${size}}`, 'g'))?.join('-') || text
}

export function formatDeviceCode(deviceId) {
  return group(stripSymbols(crypto.createHash('sha256').update(`DEV:${deviceId}`).digest('hex')).slice(0, 16), 4)
}

export function normalizeDeviceCode(value) {
  return mapAmbiguous(stripSymbols(value))
}

function activationSeed(deviceId) {
  return `DLM1:${deviceId}`
}

function signActivationCode(deviceId) {
  return toBase32(crypto.createHmac('sha256', SECRET).update(activationSeed(deviceId)).digest().slice(0, 10))
}

export function generateActivationCode(deviceId) {
  return group(signActivationCode(deviceId), CODE_GROUP_SIZE)
}

export function normalizeActivationCode(value) {
  return mapAmbiguous(stripSymbols(value))
}

export function isValidActivationCode(code, deviceId) {
  const entered = normalizeActivationCode(code)
  if (!entered) return false
  return entered === signActivationCode(deviceId)
}

export function signLicenseRecord(record) {
  return crypto.createHmac('sha256', SECRET).update(`${record.deviceId}|${record.activatedAt}|${record.deviceCode}`).digest('hex')
}

export function isLicenseRecordSigned(record) {
  if (!record || !record.signature) return false
  return signLicenseRecord(record) === record.signature
}

export function buildLicenseRecord(deviceId, deviceCode) {
  const record = { deviceId, deviceCode, activatedAt: new Date().toISOString() }
  return { ...record, signature: signLicenseRecord(record) }
}
