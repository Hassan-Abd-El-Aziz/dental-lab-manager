import { getRealm } from '../realm.js'
import { logAudit } from './auditService.js'
import { getCurrentUser } from './authService.js'

export function resetFinancialData() {
  const realm = getRealm()
  realm.write(() => {
    realm.delete(realm.objects('OrderItem'))
    realm.delete(realm.objects('Order'))
    realm.delete(realm.objects('Invoice'))
    realm.delete(realm.objects('Payment'))
    realm.delete(realm.objects('LedgerEntry'))
    realm.delete(realm.objects('Expense'))
    realm.delete(realm.objects('AuditLog'))
    const settings = realm.objects('Settings')[0]
    if (settings) {
      settings.nextOrderNumber = 1
      settings.nextInvoiceNumber = 1
      settings.nextPaymentNumber = 1
    }
  })
  logAudit(getCurrentUser()?.username || 'system', 'DELETE', 'Financial', 'all', 'تصفير جميع التعاملات المالية')
}
