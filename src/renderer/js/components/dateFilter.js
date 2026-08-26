import { todayString } from '../utilities.js'

export const DateFilter = {
  render(config = {}) {
    const filterId = config.id || 'dateFilter'
    const today = todayString()

    return `
      <div class="filter-bar" id="${filterId}">
        <div class="search-box">
          <input type="date" class="form-input" id="${filterId}-from" value="${today}" style="width:160px">
        </div>
        <span style="color:var(--text-secondary)">إلى</span>
        <div class="search-box">
          <input type="date" class="form-input" id="${filterId}-to" value="${today}" style="width:160px">
        </div>
        <button class="btn btn-sm btn-outline" onclick="window._dateFilterCallback_${filterId} && window._dateFilterCallback_${filterId}('today')">اليوم</button>
        <button class="btn btn-sm btn-outline" onclick="window._dateFilterCallback_${filterId} && window._dateFilterCallback_${filterId}('month')">هذا الشهر</button>
        <button class="btn btn-sm btn-outline" onclick="window._dateFilterCallback_${filterId} && window._dateFilterCallback_${filterId}('all')">كل الحساب</button>
        <button class="btn btn-sm btn-primary" onclick="window._dateFilterCallback_${filterId} && window._dateFilterCallback_${filterId}('search')">بحث</button>
      </div>
    `
  },

  register(filterId, callback) {
    window[`_dateFilterCallback_${filterId}`] = callback
  },

  getDates(filterId) {
    return {
      from: document.getElementById(`${filterId}-from`).value,
      to: document.getElementById(`${filterId}-to`).value
    }
  }
}
