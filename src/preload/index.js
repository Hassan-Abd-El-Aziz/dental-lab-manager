const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  dentists: {
    getAll: () => ipcRenderer.invoke('dentists:getAll'),
    getById: (id) => ipcRenderer.invoke('dentists:getById', id),
    create: (data) => ipcRenderer.invoke('dentists:create', data),
    update: (id, data) => ipcRenderer.invoke('dentists:update', id, data),
    deactivate: (id) => ipcRenderer.invoke('dentists:deactivate', id),
    delete: (id) => ipcRenderer.invoke('dentists:delete', id),
    getAccount: (dentistId, fromDate, toDate) => ipcRenderer.invoke('dentists:getAccount', dentistId, fromDate, toDate),
    search: (query) => ipcRenderer.invoke('dentists:search', query)
  },
  orders: {
    getAll: (filters) => ipcRenderer.invoke('orders:getAll', filters),
    getById: (id) => ipcRenderer.invoke('orders:getById', id),
    create: (data) => ipcRenderer.invoke('orders:create', data),
    updateDeliveryStatus: (id, status, person, date) => ipcRenderer.invoke('orders:updateDeliveryStatus', id, status, person, date),
    search: (query, filters) => ipcRenderer.invoke('orders:search', query, filters),
    delete: (id) => ipcRenderer.invoke('orders:delete', id)
  },
  invoices: {
    getAll: (filters) => ipcRenderer.invoke('invoices:getAll', filters),
    getById: (id) => ipcRenderer.invoke('invoices:getById', id),
    cancel: (id) => ipcRenderer.invoke('invoices:cancel', id),
    delete: (id) => ipcRenderer.invoke('invoices:delete', id)
  },
  payments: {
    getAll: (filters) => ipcRenderer.invoke('payments:getAll', filters),
    create: (data) => ipcRenderer.invoke('payments:create', data),
    delete: (id) => ipcRenderer.invoke('payments:delete', id)
  },
  expenses: {
    getAll: (filters) => ipcRenderer.invoke('expenses:getAll', filters),
    create: (data) => ipcRenderer.invoke('expenses:create', data),
    update: (id, data) => ipcRenderer.invoke('expenses:update', id, data),
    delete: (id) => ipcRenderer.invoke('expenses:delete', id)
  },
  items: {
    getAll: () => ipcRenderer.invoke('items:getAll'),
    getByCategory: (categoryId) => ipcRenderer.invoke('items:getByCategory', categoryId),
    create: (data) => ipcRenderer.invoke('items:create', data),
    update: (id, data) => ipcRenderer.invoke('items:update', id, data),
    deactivate: (id) => ipcRenderer.invoke('items:deactivate', id),
    delete: (id) => ipcRenderer.invoke('items:delete', id)
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    getActive: () => ipcRenderer.invoke('categories:getActive'),
    create: (data) => ipcRenderer.invoke('categories:create', data),
    update: (id, data) => ipcRenderer.invoke('categories:update', id, data),
    deactivate: (id) => ipcRenderer.invoke('categories:deactivate', id),
    delete: (id) => ipcRenderer.invoke('categories:delete', id)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (data) => ipcRenderer.invoke('settings:update', data),
    getLogo: () => ipcRenderer.invoke('settings:getLogo')
  },
  dashboard: {
    getStats: (date) => ipcRenderer.invoke('dashboard:getStats', date),
    getMonthlyChart: (year, month) => ipcRenderer.invoke('dashboard:getMonthlyChart', year, month),
    getInvoiceStatusChart: () => ipcRenderer.invoke('dashboard:getInvoiceStatusChart'),
    getTopDentists: (fromDate, toDate, limit) => ipcRenderer.invoke('dashboard:getTopDentists', fromDate, toDate, limit),
    getMonthlyFinancial: (months) => ipcRenderer.invoke('dashboard:getMonthlyFinancial', months),
    getRecentActivity: (date, limit) => ipcRenderer.invoke('dashboard:getRecentActivity', date, limit)
  },
  reports: {
    generate: (fromDate, toDate) => ipcRenderer.invoke('reports:generate', fromDate, toDate)
  },
  auth: {
    login: (username, password) => ipcRenderer.invoke('auth:login', username, password),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),
    initSession: () => ipcRenderer.invoke('auth:initSession'),
    logout: () => ipcRenderer.invoke('auth:logout')
  },
  users: {
    getAll: () => ipcRenderer.invoke('users:getAll'),
    getById: (id) => ipcRenderer.invoke('users:getById', id),
    create: (data) => ipcRenderer.invoke('users:create', data),
    update: (id, data) => ipcRenderer.invoke('users:update', id, data),
    delete: (id) => ipcRenderer.invoke('users:delete', id)
  },
  audit: {
    getAll: (filters) => ipcRenderer.invoke('audit:getAll', filters)
  },
  inventory: {
    getAll: () => ipcRenderer.invoke('inventory:getAll'),
    getById: (id) => ipcRenderer.invoke('inventory:getById', id),
    setQuantity: (itemId, quantity, box, notes) => ipcRenderer.invoke('inventory:setQuantity', itemId, quantity, box, notes),
    setQuantityAbsolute: (itemId, quantity, box, notes) => ipcRenderer.invoke('inventory:setQuantityAbsolute', itemId, quantity, box, notes),
    withdraw: (itemId, quantity, orderId, notes) => ipcRenderer.invoke('inventory:withdraw', itemId, quantity, orderId, notes),
    transactions: (filters) => ipcRenderer.invoke('inventory:transactions', filters),
    reset: (itemId) => ipcRenderer.invoke('inventory:reset', itemId)
  },
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: () => ipcRenderer.invoke('backup:restore')
  },
  reset: {
    financialWithBackup: () => ipcRenderer.invoke('reset:financialWithBackup')
  },
  app: {
    restart: () => ipcRenderer.invoke('app:restart')
  },
  license: {
    check: () => ipcRenderer.invoke('license:check'),
    activate: (code) => ipcRenderer.invoke('license:activate', code),
    getHardwareId: () => ipcRenderer.invoke('license:getHardwareId'),
    getDeviceCode: () => ipcRenderer.invoke('license:getDeviceCode')
  }
})
