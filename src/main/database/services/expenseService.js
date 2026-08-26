import { getRealm } from '../realm.js'
import { generateId } from './dentistService.js'

export function createExpense(data) {
  const realm = getRealm()
  const id = generateId()
  realm.write(() => { realm.create('Expense', { id, date: new Date(data.date), category: data.category, amount: data.amount, notes: data.notes || '', createdAt: new Date() }) })
  return { id }
}

export function getAllExpenses(filters = {}) {
  const realm = getRealm()
  let expenses = realm.objects('Expense')
  if (filters.fromDate && filters.toDate) {
    const from = new Date(filters.fromDate); const to = new Date(filters.toDate); to.setHours(23, 59, 59, 999)
    expenses = expenses.filtered('date >= $0 AND date <= $1', from, to)
  }
  expenses = expenses.sorted('date', true)
  return expenses.map((exp) => ({ id: exp.id, date: exp.date, category: exp.category, amount: exp.amount, notes: exp.notes || '' }))
}

export function deleteExpense(id) {
  const realm = getRealm()
  const expense = realm.objectForPrimaryKey('Expense', id)
  if (!expense) throw new Error('Expense not found')
  realm.write(() => { realm.delete(expense) })
  return { success: true }
}
