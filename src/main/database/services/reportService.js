import { getRealm } from '../realm.js'

export function generateReport(fromDate, toDate) {
  const realm = getRealm()
  const from = new Date(fromDate); const to = new Date(toDate); to.setHours(23, 59, 59, 999)
  const orders = realm.objects('Order').filtered('orderDate >= $0 AND orderDate <= $1', from, to)
  const invoices = realm.objects('Invoice').filtered('date >= $0 AND date <= $1', from, to)
  const payments = realm.objects('Payment').filtered('date >= $0 AND date <= $1', from, to)
  const expenses = realm.objects('Expense').filtered('date >= $0 AND date <= $1', from, to)

  let totalInvoiceAmount = 0, totalPaymentAmount = 0, totalExpenseAmount = 0
  invoices.forEach((inv) => { totalInvoiceAmount += inv.total })
  payments.forEach((pay) => { totalPaymentAmount += pay.amount })
  expenses.forEach((exp) => { totalExpenseAmount += exp.amount })

  return { fromDate, toDate, orderCount: orders.length, invoiceCount: invoices.length, totalInvoices: totalInvoiceAmount, totalPayments: totalPaymentAmount, totalRemaining: totalInvoiceAmount - totalPaymentAmount, totalExpenses: totalExpenseAmount, netIncome: totalPaymentAmount - totalExpenseAmount }
}
