import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const SESSION_FILE = path.join(app.getPath('userData'), 'session.json')

export function saveSession(user) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ user }))
}

export function loadSession() {
  try {
    const data = fs.readFileSync(SESSION_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    fs.unlinkSync(SESSION_FILE)
  } catch {}
}
