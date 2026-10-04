import os from 'os'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execFileSync } from 'child_process'
import { app } from 'electron'
import { formatDeviceCode, isValidActivationCode, normalizeActivationCode, buildLicenseRecord, isLicenseRecordSigned } from '../../shared/licenseKeys.mjs'

const LICENSE_FILE = path.join(os.homedir(), '.dental-lab-license.json')
const MASTER_CODE = 'Hassan01009039628'

let cachedDeviceId = null

function secondaryLicenseFile() {
  try {
    return path.join(app.getPath('userData'), 'license.dat')
  } catch (e) {
    return null
  }
}

function getLicenseFiles() {
  const files = [LICENSE_FILE]
  const secondary = secondaryLicenseFile()
  if (secondary) files.push(secondary)
  return files
}

function readWindowsMachineGuid() {
  try {
    const out = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 5000
    })
    const match = out.match(/MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]+)/)
    return match ? match[1] : null
  } catch (e) {
    return null
  }
}

function readFallbackFingerprint() {
  const cpus = os.cpus() || []
  const cpuModel = cpus[0]?.model || ''
  const totalMem = os.totalmem()
  const networkInterfaces = os.networkInterfaces()
  const macs = Object.keys(networkInterfaces)
    .sort()
    .flatMap((key) => networkInterfaces[key] || [])
    .map((iface) => iface.mac)
    .filter((mac) => mac && mac !== '00:00:00:00:00:00')
    .sort()
    .join('')
  return `cpu:${cpuModel}|mem:${totalMem}|mac:${macs}`
}

function computeDeviceId() {
  if (cachedDeviceId) return cachedDeviceId
  const platform = os.platform()
  const arch = os.arch()
  const machineGuid = process.platform === 'win32' ? readWindowsMachineGuid() : null
  const source = machineGuid ? `guid:${machineGuid}` : `fallback:${readFallbackFingerprint()}`
  cachedDeviceId = crypto.createHash('sha256').update(`${platform}-${arch}|${source}`).digest('hex')
  return cachedDeviceId
}

export function getDeviceCode() {
  return formatDeviceCode(computeDeviceId())
}

function readLicenseFile(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'))
    }
  } catch (e) {
    console.error('Error reading license:', e)
  }
  return null
}

function getLicense() {
  for (const file of getLicenseFiles()) {
    const license = readLicenseFile(file)
    if (license) return license
  }
  return null
}

function saveLicense(record) {
  const payload = JSON.stringify(record, null, 2)
  for (const file of getLicenseFiles()) {
    try {
      fs.writeFileSync(file, payload)
    } catch (e) {
      console.error('Error writing license:', e)
    }
  }
}

export function validateActivationCode(code, deviceId = computeDeviceId()) {
  if (normalizeActivationCode(code) === MASTER_CODE.toUpperCase()) return true
  return isValidActivationCode(code, deviceId)
}

export function isActivated() {
  const license = getLicense()
  if (!license) return false
  if (!isLicenseRecordSigned(license)) return false
  return license.deviceId === computeDeviceId()
}

export function activateSoftware(code) {
  if (isActivated()) {
    return { success: false, message: 'البرنامج مفعّل بالفعل على هذا الجهاز' }
  }

  const deviceId = computeDeviceId()
  if (!validateActivationCode(code, deviceId)) {
    return { success: false, message: 'كود التفعيل غير صحيح' }
  }

  saveLicense(buildLicenseRecord(deviceId, getDeviceCode()))

  return { success: true, message: 'تم تفعيل البرنامج بنجاح', hardwareId: deviceId, deviceCode: getDeviceCode() }
}

export function getHardwareId() {
  return computeDeviceId()
}

export function resetLicense() {
  try {
    for (const file of getLicenseFiles()) {
      if (fs.existsSync(file)) fs.unlinkSync(file)
    }
    return true
  } catch (e) {
    return false
  }
}
