const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  dentists: {
    getAll: () => ipcRenderer.invoke('dentists:getAll'),
    getById: (id) => ipcRenderer.invoke('dentists:getById', id),
    create: (data) => ipcRenderer.invoke('dentists:create', data),
    update: (id, data) => ipcRenderer.invoke('dentists:update', id, data),
    deactivate: (id) => ipcRenderer.invoke('dentists:deactivate', id),
    getAccount: (dentistId, fromDate, toDate) => ipcRenderer.invoke('dentists:getAccount', dentistId, fromDate, toDate),
    search: (query) => ipcRenderer.invoke('dentists:search', query)
  },
  orders: {
    getAll: (filters) => ipcRenderer.invoke('orders:getAll', filters),
    getById: (id) => ipcRenderer.invoke('orders:getById', id),
    create: (data) => ipcRenderer.invoke('orders:create', data)
  },
  invoices: {
    getAll: (filters) => ipcRenderer.invoke('invoices:getAll', filters),
    getById: (id) => ipcRenderer.invoke('invoices:getById', id),
    cancel: (id) => ipcRenderer.invoke('invoices:cancel', id)
  },
  payments: {
    getAll: (filters) => ipcRenderer.invoke('payments:getAll', filters),
    create: (data) => ipcRenderer.invoke('payments:create', data)
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
    deactivate: (id) => ipcRenderer.invoke('items:deactivate', id)
  },
  categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    getActive: () => ipcRenderer.invoke('categories:getActive'),
    create: (data) => ipcRenderer.invoke('categories:create', data),
    update: (id, data) => ipcRenderer.invoke('categories:update', id, data),
    deactivate: (id) => ipcRenderer.invoke('categories:deactivate', id)
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (data) => ipcRenderer.invoke('settings:update', data)
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
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    restore: () => ipcRenderer.invoke('backup:restore')
  }
})
