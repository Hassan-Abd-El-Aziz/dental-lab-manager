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

export function registerIpcHandlers() {
  ipcMain.handle('dentists:getAll', () => dentistService.getAllDentists())
  ipcMain.handle('dentists:getById', (_, id) => dentistService.getDentistById(id))
  ipcMain.handle('dentists:create', (_, data) => dentistService.createDentist(data))
  ipcMain.handle('dentists:update', (_, id, data) => dentistService.updateDentist(id, data))
  ipcMain.handle('dentists:deactivate', (_, id) => dentistService.deactivateDentist(id))
  ipcMain.handle('dentists:getAccount', (_, dentistId, fromDate, toDate) => dentistService.getDentistAccount(dentistId, fromDate, toDate))
  ipcMain.handle('dentists:search', (_, query) => dentistService.searchDentists(query))

  ipcMain.handle('orders:getAll', (_, filters) => orderService.getAllOrders(filters))
  ipcMain.handle('orders:getById', (_, id) => orderService.getOrderById(id))
  ipcMain.handle('orders:create', (_, data) => orderService.createOrder(data))

  ipcMain.handle('invoices:getAll', (_, filters) => invoiceService.getAllInvoices(filters))
  ipcMain.handle('invoices:getById', (_, id) => invoiceService.getInvoiceById(id))
  ipcMain.handle('invoices:cancel', (_, id) => invoiceService.cancelInvoice(id))

  ipcMain.handle('payments:getAll', (_, filters) => paymentService.getAllPayments(filters))
  ipcMain.handle('payments:create', (_, data) => paymentService.createPayment(data))

  ipcMain.handle('expenses:getAll', (_, filters) => expenseService.getAllExpenses(filters))
  ipcMain.handle('expenses:create', (_, data) => expenseService.createExpense(data))
  ipcMain.handle('expenses:delete', (_, id) => expenseService.deleteExpense(id))

  ipcMain.handle('items:getAll', () => itemService.getAllItems())
  ipcMain.handle('items:getByCategory', (_, categoryId) => itemService.getItemsByCategory(categoryId))
  ipcMain.handle('items:create', (_, data) => itemService.createItem(data))
  ipcMain.handle('items:update', (_, id, data) => itemService.updateItem(id, data))
  ipcMain.handle('items:deactivate', (_, id) => itemService.deactivateItem(id))

  ipcMain.handle('categories:getAll', () => categoryService.getAllCategories())
  ipcMain.handle('categories:getActive', () => categoryService.getActiveCategories())
  ipcMain.handle('categories:create', (_, data) => categoryService.createCategory(data))
  ipcMain.handle('categories:update', (_, id, data) => categoryService.updateCategory(id, data))
  ipcMain.handle('categories:deactivate', (_, id) => categoryService.deactivateCategory(id))

  ipcMain.handle('settings:get', () => settingsService.getSettings())
  ipcMain.handle('settings:update', (_, data) => settingsService.updateSettings(data))

  ipcMain.handle('dashboard:getStats', (_, date) => dashboardService.getDailyStats(date))
  ipcMain.handle('dashboard:getMonthlyChart', (_, year, month) => dashboardService.getMonthlyChartData(year, month))
  ipcMain.handle('dashboard:getInvoiceStatusChart', () => dashboardService.getInvoiceStatusChart())
  ipcMain.handle('dashboard:getTopDentists', (_, fromDate, toDate, limit) => dashboardService.getTopDentists(fromDate, toDate, limit))
  ipcMain.handle('dashboard:getMonthlyFinancial', (_, months) => dashboardService.getMonthlyFinancialSummary(months))
  ipcMain.handle('dashboard:getRecentActivity', (_, date, limit) => dashboardService.getRecentActivity(date, limit))

  ipcMain.handle('reports:generate', (_, fromDate, toDate) => reportService.generateReport(fromDate, toDate))
}
