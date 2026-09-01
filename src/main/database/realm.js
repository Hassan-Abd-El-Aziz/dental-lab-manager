import { app } from 'electron'
import Realm from 'realm'
import { schemas } from './schemas.js'
import path from 'path'
import fs from 'fs'

let realm = null

function getRealmPath() {
  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'database')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  return path.join(dbDir, 'dental-lab.realm')
}

export function initializeDatabase() {
  try {
    const realmPath = getRealmPath()
    console.log('Realm DB path:', realmPath)

    realm = new Realm({
      path: realmPath,
      schema: schemas,
      schemaVersion: 7,
      migration: (oldRealm, newRealm) => {
        if (oldRealm.schemaVersion < 6) {
          const oldItems = oldRealm.objects('Item')
          for (let i = 0; i < oldItems.length; i++) {
            const newItem = newRealm.create('Item', {
              id: oldItems[i].id,
              name: oldItems[i].name,
              categoryId: oldItems[i].categoryId,
              price: oldItems[i].price,
              quantity: oldItems[i].quantity,
              box: oldItems[i].box || '',
              active: oldItems[i].active,
              inventory: false,
              createdAt: oldItems[i].createdAt,
              updatedAt: oldItems[i].updatedAt
            })
          }
        }
      }
    })

    initializeDefaultData()
    console.log('Database initialized successfully')
    return realm
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

function initializeDefaultData() {
  const settings = realm.objects('Settings')
  if (settings.length === 0) {
    realm.write(() => {
      realm.create('Settings', {
        id: 'settings-001',
        labName: 'معمل الأسنان',
        address: '',
        phone: '',
        whatsapp: '',
        email: '',
        logoPath: '',
        nextOrderNumber: 1,
        nextInvoiceNumber: 1,
        nextPaymentNumber: 1,
        nextDentistCode: 1
      })
    })
  }


  const categories = realm.objects('Category')
  if (categories.length === 0) {
    const defaultCategories = ['Crown', 'Bridge', 'Zirconia', 'E-Max', 'Veneer', 'Denture', 'Repair', 'Other']
    realm.write(() => {
      defaultCategories.forEach((name) => {
        realm.create('Category', {
          id: `cat-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: name,
          active: true,
          createdAt: new Date()
        })
      })
    })
  }
}

export function getRealm() {
  return realm
}
