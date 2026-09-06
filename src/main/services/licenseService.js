import os from 'os'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const LICENSE_FILE = path.join(os.homedir(), '.dental-lab-license.json')

function computeHardwareId() {
  const platform = os.platform()
  const arch = os.arch()
  const cpus = os.cpus()
  const cpuModel = cpus[0]?.model || ''
  const cpuSpeed = cpus[0]?.speed || 0
  const totalMem = os.totalmem()
  const networkInterfaces = os.networkInterfaces()
  const macs = Object.keys(networkInterfaces)
    .sort()
    .flatMap(key => networkInterfaces[key])
    .map(iface => iface.mac)
    .filter(Boolean)
    .sort()
    .join('')
  const hostname = os.hostname()
  
  const raw = `${platform}-${arch}-${cpuModel}-${cpuSpeed}-${totalMem}-${macs}-${hostname}`
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function saveLicense(hardwareId) {
  const licenseData = {
    hardwareId,
    activatedAt: new Date().toISOString(),
    isValid: true
  }
  fs.writeFileSync(LICENSE_FILE, JSON.stringify(licenseData, null, 2))
}

function getLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      return JSON.parse(fs.readFileSync(LICENSE_FILE, 'utf-8'))
    }
  } catch (e) {
    console.error('Error reading license:', e)
  }
  return null
}

export function validateActivationCode(code) {
  const validCode = 'Hassan01009039628'
  return code === validCode
}

export function isActivated() {
  const license = getLicense()
  if (!license) return false
  
  const currentHardwareId = computeHardwareId()
  return license.isValid && license.hardwareId === currentHardwareId
}

export function activateSoftware(code) {
  if (!validateActivationCode(code)) {
    return { success: false, message: 'كود التفعيل غير صحيح' }
  }
  
  const hardwareId = computeHardwareId()
  saveLicense(hardwareId)
  
  return { success: true, message: 'تم تفعيل البرنامج بنجاح', hardwareId }
}

export function getHardwareId() {
  return computeHardwareId()
}

export function resetLicense() {
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      fs.unlinkSync(LICENSE_FILE)
    }
    return true
  } catch (e) {
    return false
  }
}
