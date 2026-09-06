import { ipcMain } from 'electron'
import * as dentistService from '../database/services/dentistService.js'
import * as orderService from '../database/services/orderService.js'
import * as invoiceService from '../database/services/invoiceService.js'
import * as paymentService from '../database/services/paymentService.js'
import * as expenseService from '../database/services/expenseService.js'
import * as itemService from '../database/services/itemService.js'
import * as categoryService from '../database/services/categoryService.js'
import * as settingsService from '../database/services/settingsService.js'
import * as dashboardService from '../database/services/dashboardService.js'
import * as reportService from '../database/services/reportService.js'
import * as authService from '../database/services/authService.js'
import * as userService from '../database/services/userService.js'
import * as auditService from '../database/services/auditService.js'
import * as inventoryService from '../database/services/inventoryService.js'
import * as licenseService from '../services/licenseService.js'

export function registerIpcHandlers() {
  ipcMain.handle('dentists:getAll', () => dentistService.getAllDentists())
  ipcMain.handle('dentists:getById', (_, id) => dentistService.getDentistById(id))
  ipcMain.handle('dentists:create', (_, data) => dentistService.createDentist(data))
  ipcMain.handle('dentists:update', (_, id, data) => dentistService.updateDentist(id, data))
  ipcMain.handle('dentists:deactivate', (_, id) => dentistService.deactivateDentist(id))
  ipcMain.handle('dentists:delete', (_, id) => dentistService.deleteDentist(id))
  ipcMain.handle('dentists:getAccount', (_, dentistId, fromDate, toDate) => dentistService.getDentistAccount(dentistId, fromDate, toDate))
  ipcMain.handle('dentists:search', (_, query) => dentistService.searchDentists(query))

  ipcMain.handle('orders:getAll', (_, filters) => orderService.getAllOrders(filters))
  ipcMain.handle('orders:getById', (_, id) => orderService.getOrderById(id))
  ipcMain.handle('orders:create', (_, data) => orderService.createOrder(data))
  ipcMain.handle('orders:updateDeliveryStatus', (_, id, deliveryStatus, deliveryPerson, deliveryDate) => orderService.updateDeliveryStatus(id, deliveryStatus, deliveryPerson, deliveryDate))
  ipcMain.handle('orders:search', (_, query, filters) => orderService.searchOrders(query, filters))
  ipcMain.handle('orders:delete', (_, id) => orderService.deleteOrder(id))

  ipcMain.handle('invoices:getAll', (_, filters) => invoiceService.getAllInvoices(filters))
  ipcMain.handle('invoices:getById', (_, id) => invoiceService.getInvoiceById(id))
  ipcMain.handle('invoices:cancel', (_, id) => invoiceService.cancelInvoice(id))
  ipcMain.handle('invoices:delete', (_, id) => invoiceService.deleteInvoice(id))

  ipcMain.handle('payments:getAll', (_, filters) => paymentService.getAllPayments(filters))
  ipcMain.handle('payments:create', (_, data) => paymentService.createPayment(data))
  ipcMain.handle('payments:delete', (_, id) => paymentService.deletePayment(id))

  ipcMain.handle('expenses:getAll', (_, filters) => expenseService.getAllExpenses(filters))
  ipcMain.handle('expenses:create', (_, data) => expenseService.createExpense(data))
  ipcMain.handle('expenses:delete', (_, id) => expenseService.deleteExpense(id))

  ipcMain.handle('items:getAll', () => itemService.getAllItems())
  ipcMain.handle('items:getByCategory', (_, categoryId) => itemService.getItemsByCategory(categoryId))
  ipcMain.handle('items:create', (_, data) => itemService.createItem(data))
  ipcMain.handle('items:update', (_, id, data) => itemService.updateItem(id, data))
  ipcMain.handle('items:deactivate', (_, id) => itemService.deactivateItem(id))
  ipcMain.handle('items:delete', (_, id) => itemService.deleteItem(id))

  ipcMain.handle('categories:getAll', () => categoryService.getAllCategories())
  ipcMain.handle('categories:getActive', () => categoryService.getActiveCategories())
  ipcMain.handle('categories:create', (_, data) => categoryService.createCategory(data))
  ipcMain.handle('categories:update', (_, id, data) => categoryService.updateCategory(id, data))
  ipcMain.handle('categories:deactivate', (_, id) => categoryService.deactivateCategory(id))
  ipcMain.handle('categories:delete', (_, id) => categoryService.deleteCategory(id))

  ipcMain.handle('settings:get', () => settingsService.getSettings())
  ipcMain.handle('settings:update', (_, data) => settingsService.updateSettings(data))

  ipcMain.handle('dashboard:getStats', (_, date) => dashboardService.getDailyStats(date))
  ipcMain.handle('dashboard:getMonthlyChart', (_, year, month) => dashboardService.getMonthlyChartData(year, month))
  ipcMain.handle('dashboard:getInvoiceStatusChart', () => dashboardService.getInvoiceStatusChart())
  ipcMain.handle('dashboard:getTopDentists', (_, fromDate, toDate, limit) => dashboardService.getTopDentists(fromDate, toDate, limit))
  ipcMain.handle('dashboard:getMonthlyFinancial', (_, months) => dashboardService.getMonthlyFinancialSummary(months))
  ipcMain.handle('dashboard:getRecentActivity', (_, date, limit) => dashboardService.getRecentActivity(date, limit))

  ipcMain.handle('reports:generate', (_, fromDate, toDate) => reportService.generateReport(fromDate, toDate))

  ipcMain.handle('auth:login', (_, username, password) => authService.login(username, password))
  ipcMain.handle('auth:getCurrentUser', () => authService.getCurrentUser())
  ipcMain.handle('auth:initSession', () => {
    const user = authService.initSession()
    if (user) return user
    return null
  })
  ipcMain.handle('auth:logout', () => { authService.logout(); return true })

  ipcMain.handle('users:getAll', () => userService.getAllUsers())
  ipcMain.handle('users:getById', (_, id) => userService.getUserById(id))
  ipcMain.handle('users:create', (_, data) => authService.createUser(data))
  ipcMain.handle('users:update', (_, id, data) => userService.updateUser(id, data))
  ipcMain.handle('users:delete', (_, id) => userService.deleteUser(id))

  ipcMain.handle('audit:getAll', (_, filters) => auditService.getAllAuditLogs(filters))

  ipcMain.handle('inventory:getAll', () => inventoryService.getAllInventory())
  ipcMain.handle('inventory:getById', (_, id) => inventoryService.getItem(id))
  ipcMain.handle('inventory:setQuantity', (_, itemId, quantity, box, notes) => inventoryService.setQuantity(itemId, quantity, box, notes))
  ipcMain.handle('inventory:setQuantityAbsolute', (_, itemId, quantity, box, notes) => inventoryService.setQuantityAbsolute(itemId, quantity, box, notes))
  ipcMain.handle('inventory:withdraw', (_, itemId, quantity, orderId, notes) => inventoryService.withdraw(itemId, quantity, orderId, notes))
  ipcMain.handle('inventory:transactions', (_, filters) => inventoryService.getTransactions(filters))
  ipcMain.handle('inventory:reset', (_, itemId) => inventoryService.resetItem(itemId))

  ipcMain.handle('license:check', () => licenseService.isActivated())
  ipcMain.handle('license:activate', (_, code) => licenseService.activateSoftware(code))
  ipcMain.handle('license:getHardwareId', () => licenseService.getHardwareId())
}
