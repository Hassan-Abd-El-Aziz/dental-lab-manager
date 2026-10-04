#!/usr/bin/env node
import { generateActivationCode, normalizeDeviceCode } from '../src/shared/licenseKeys.mjs'

const deviceCode = normalizeDeviceCode(process.argv[2] || '')

if (!deviceCode) {
  console.log('الاستخدام: npm run license:generate -- <رقم الجهاز>')
  console.log('مثال: npm run license:generate -- 1A2B-3C4D-5E6F-7A8B')
  process.exit(1)
}

console.log(`كود التفعيل للجهاز ${deviceCode.replace(/(.{4})/g, '$1-').replace(/-$/, '')}:`)
console.log(generateActivationCode(deviceCode))
