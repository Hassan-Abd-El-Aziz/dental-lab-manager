import { getRealm } from '../realm.js'

export function getDailyStats(date) {
  const realm = getRealm()
  const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1)

  const orders = realm.objects('Order').filtered('orderDate >= $0 AND orderDate < $1', targetDate, nextDay)
  const invoices = realm.objects('Invoice').filtered('date >= $0 AND date < $1', targetDate, nextDay)
  const payments = realm.objects('Payment').filtered('date >= $0 AND date < $1', targetDate, nextDay)
  const expenses = realm.objects('Expense').filtered('date >= $0 AND date < $1', targetDate, nextDay)

  let totalInvoiceAmount = 0, totalPaymentAmount = 0, totalExpenseAmount = 0
  invoices.forEach((inv) => { totalInvoiceAmount += inv.total })
  payments.forEach((pay) => { totalPaymentAmount += pay.amount })
  expenses.forEach((exp) => { totalExpenseAmount += exp.amount })

  return { orderCount: orders.length, invoiceCount: invoices.length, totalInvoices: totalInvoiceAmount, totalPayments: totalPaymentAmount, totalRemaining: totalInvoiceAmount - totalPaymentAmount, totalExpenses: totalExpenseAmount, netIncome: totalPaymentAmount - totalExpenseAmount }
}

export function getMonthlyChartData(year, month) {
  const realm = getRealm()
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const daysInMonth = endDate.getDate()
  const dailyIncome = [], dailyExpenses = []

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStart = new Date(year, month, day, 0, 0, 0, 0)
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999)
    const dayPayments = realm.objects('Payment').filtered('date >= $0 AND date <= $1', dayStart, dayEnd)
    const dayExpenses = realm.objects('Expense').filtered('date >= $0 AND date <= $1', dayStart, dayEnd)
    let incomeSum = 0, expenseSum = 0
    dayPayments.forEach((p) => { incomeSum += p.amount })
    dayExpenses.forEach((e) => { expenseSum += e.amount })
    dailyIncome.push(incomeSum)
    dailyExpenses.push(expenseSum)
  }

  return { labels: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}/${month + 1}`), income: dailyIncome, expenses: dailyExpenses }
}

export function getInvoiceStatusChart() {
  const realm = getRealm()
  return {
    paid: realm.objects('Invoice').filtered('status == "PAID"').length,
    partial: realm.objects('Invoice').filtered('status == "PARTIAL"').length,
    unpaid: realm.objects('Invoice').filtered('status == "UNPAID"').length,
    cancelled: realm.objects('Invoice').filtered('status == "CANCELLED"').length
  }
}

export function getTopDentists(fromDate, toDate, limit = 10) {
  const realm = getRealm()
  const dentists = realm.objects('Dentist').filtered('active == true')
  const dentistStats = []
  dentists.forEach((dentist) => {
    let invoices
    if (fromDate && toDate) {
      const from = new Date(fromDate); const to = new Date(toDate); to.setHours(23, 59, 59, 999)
      invoices = realm.objects('Invoice').filtered('dentistId == $0 AND date >= $1 AND date <= $2', dentist.id, from, to)
    } else { invoices = realm.objects('Invoice').filtered('dentistId == $0', dentist.id) }
    let totalInvoices = 0
    invoices.forEach((inv) => { totalInvoices += inv.total })
    if (totalInvoices > 0) dentistStats.push({ name: dentist.name, total: totalInvoices })
  })
  dentistStats.sort((a, b) => b.total - a.total)
  return dentistStats.slice(0, limit)
}

export function getMonthlyFinancialSummary(months = 6) {
  const realm = getRealm()
  const now = new Date()
  const result = { labels: [], payments: [], expenses: [], netIncome: [] }
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear(), month = date.getMonth()
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
    const monthPayments = realm.objects('Payment').filtered('date >= $0 AND date <= $1', startDate, endDate)
    const monthExpenses = realm.objects('Expense').filtered('date >= $0 AND date <= $1', startDate, endDate)
    let totalPayments = 0, totalExpenses = 0
    monthPayments.forEach((p) => { totalPayments += p.amount })
    monthExpenses.forEach((e) => { totalExpenses += e.amount })
    result.labels.push(monthNames[month])
    result.payments.push(totalPayments)
    result.expenses.push(totalExpenses)
    result.netIncome.push(totalPayments - totalExpenses)
  }
  return result
}

export function getRecentActivity(date, limit = 20) {
  const realm = getRealm()
  const targetDate = new Date(date); targetDate.setHours(0, 0, 0, 0)
  const nextDay = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1)
  const activities = []

  realm.objects('Order').filtered('orderDate >= $0 AND orderDate < $1', targetDate, nextDay).sorted('createdAt', true).forEach((o) => {
    const dentist = realm.objectForPrimaryKey('Dentist', o.dentistId)
    activities.push({ time: o.createdAt, type: 'طلب جديد', number: o.orderNumber, dentist: dentist ? dentist.name : '', amount: o.total, notes: o.diagnosis || '' })
  })

  realm.objects('Invoice').filtered('date >= $0 AND date < $1', targetDate, nextDay).sorted('createdAt', true).forEach((inv) => {
    const dentist = realm.objectForPrimaryKey('Dentist', inv.dentistId)
    activities.push({ time: inv.createdAt, type: 'فاتورة', number: inv.invoiceNumber, dentist: dentist ? dentist.name : '', amount: inv.total, notes: inv.category || '' })
  })

  realm.objects('Payment').filtered('date >= $0 AND date < $1', targetDate, nextDay).sorted('createdAt', true).forEach((pay) => {
    const dentist = realm.objectForPrimaryKey('Dentist', pay.dentistId)
    activities.push({ time: pay.createdAt, type: 'دفعة', number: pay.paymentNumber, dentist: dentist ? dentist.name : '', amount: pay.amount, notes: pay.notes || '' })
  })

  realm.objects('Expense').filtered('date >= $0 AND date < $1', targetDate, nextDay).sorted('createdAt', true).forEach((exp) => {
    activities.push({ time: exp.createdAt, type: 'مصروف', number: '', dentist: '', amount: exp.amount, notes: exp.category })
  })

  activities.sort((a, b) => b.time - a.time)
  return activities.slice(0, limit)
}
