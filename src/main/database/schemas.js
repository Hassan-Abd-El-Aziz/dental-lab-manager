export const DentistSchema = {
  name: 'Dentist',
  primaryKey: 'id',
  properties: {
    id: 'string',
    dentistCode: 'string',
    name: 'string',
    phone: 'string?',
    clinic: 'string?',
    address: 'string?',
    notes: 'string?',
    active: { type: 'bool', default: true },
    createdAt: 'date',
    updatedAt: 'date'
  }
}

export const CategorySchema = {
  name: 'Category',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    active: { type: 'bool', default: true },
    createdAt: 'date'
  }
}

export const ItemSchema = {
  name: 'Item',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    categoryId: 'string',
    price: 'double',
    active: { type: 'bool', default: true },
    createdAt: 'date',
    updatedAt: 'date'
  }
}

export const OrderSchema = {
  name: 'Order',
  primaryKey: 'id',
  properties: {
    id: 'string',
    orderNumber: 'string',
    invoiceId: 'string?',
    dentistId: 'string',
    orderDate: 'date',
    condition: 'string',
    diagnosis: 'string?',
    upperTooth1: 'int?',
    upperTooth2: 'int?',
    lowerTooth1: 'int?',
    lowerTooth2: 'int?',
    categoryId: 'string?',
    categoryNameSnapshot: 'string?',
    categoryComment: 'string?',
    total: 'double',
    paid: 'double',
    remaining: 'double',
    status: 'string',
    createdAt: 'date',
    updatedAt: 'date'
  }
}

export const OrderItemSchema = {
  name: 'OrderItem',
  primaryKey: 'id',
  properties: {
    id: 'string',
    orderId: 'string',
    itemId: 'string',
    itemNameSnapshot: 'string',
    unitPriceSnapshot: 'double',
    quantity: 'int',
    lineTotal: 'double'
  }
}

export const InvoiceSchema = {
  name: 'Invoice',
  primaryKey: 'id',
  properties: {
    id: 'string',
    invoiceNumber: 'string',
    orderId: 'string',
    dentistId: 'string',
    date: 'date',
    total: 'double',
    paid: 'double',
    remaining: 'double',
    status: 'string',
    diagnosis: 'string?',
    teeth: 'string?',
    category: 'string?',
    categoryComment: 'string?',
    createdAt: 'date',
    updatedAt: 'date'
  }
}

export const PaymentSchema = {
  name: 'Payment',
  primaryKey: 'id',
  properties: {
    id: 'string',
    paymentNumber: 'string',
    dentistId: 'string',
    invoiceId: 'string?',
    orderId: 'string?',
    amount: 'double',
    date: 'date',
    notes: 'string?',
    createdAt: 'date'
  }
}

export const ExpenseSchema = {
  name: 'Expense',
  primaryKey: 'id',
  properties: {
    id: 'string',
    date: 'date',
    category: 'string',
    amount: 'double',
    notes: 'string?',
    createdAt: 'date'
  }
}

export const LedgerEntrySchema = {
  name: 'LedgerEntry',
  primaryKey: 'id',
  properties: {
    id: 'string',
    dentistId: 'string',
    orderId: 'string?',
    invoiceId: 'string?',
    paymentId: 'string?',
    date: 'date',
    type: 'string',
    description: 'string',
    debit: 'double',
    credit: 'double',
    createdAt: 'date'
  }
}

export const SettingsSchema = {
  name: 'Settings',
  primaryKey: 'id',
  properties: {
    id: 'string',
    labName: 'string?',
    address: 'string?',
    phone: 'string?',
    whatsapp: 'string?',
    email: 'string?',
    logoPath: 'string?',
    nextOrderNumber: 'int',
    nextInvoiceNumber: 'int',
    nextPaymentNumber: 'int',
    nextDentistCode: 'int'
  }
}

export const schemas = [
  DentistSchema, CategorySchema, ItemSchema, OrderSchema,
  OrderItemSchema, InvoiceSchema, PaymentSchema, ExpenseSchema,
  LedgerEntrySchema, SettingsSchema
]
