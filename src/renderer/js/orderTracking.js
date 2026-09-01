import { Router } from './router.js'
import { API } from './api.js'
import { Toast } from './components/toast.js'
import { Modal } from './components/modal.js'
import { formatCurrencyWithEGP, formatDate, escapeHtml, debounce } from './utilities.js'
import { Auth } from './auth.js'

const DELIVERY_STATUS = {
  IN_LAB: { label: 'في المعمل', class: 'status-info' },
  DELIVERED: { label: 'تم التسليم', class: 'status-paid' },
  WAITING: { label: 'في الانتظار', class: 'status-warning' },
  CANCELLED: { label: 'ملغى', class: 'status-cancelled' }
}

function toInputDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const OrderTracking = {
  orders: [],
  currentQuery: '',
  currentFilter: 'ALL',
  currentStatus: '',

  init(container) {
    this.container = container
    this.loadData()
  },

  async loadData(query = '', filter = 'ALL') {
    this.currentQuery = query
    this.currentFilter = filter
    try {
      const filters = filter !== 'ALL' ? { deliveryStatus: filter } : {}
      this.orders = await API.orders.search(query, filters)
      this.render()
    } catch (error) {
      console.error('Error loading orders:', error)
      this.orders = []
      this.render()
    }
  },

  render() {
    const searchInput = document.getElementById('orderSearch')
    const savedValue = searchInput?.value || this.currentQuery || ''
    const savedSelectionStart = searchInput?.selectionStart || 0
    const savedSelectionEnd = searchInput?.selectionEnd || 0
    const wasFocused = document.activeElement === searchInput

    this.container.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">🚚 متابعة الطلبات</h1>
        <button class="btn btn-outline" id="btnBack">العودة</button>
      </div>

      <div class="card">
        <div class="filter-bar">
          <div class="search-box" style="flex:1;max-width:300px">
            <input type="text" class="form-input" id="orderSearch" placeholder="ابحث برقم الطلب أو اسم الطبيب..." value="${escapeHtml(savedValue)}">
          </div>
          <div class="filter-chips">
            <button class="filter-chip ${this.currentFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">الكل</button>
            <button class="filter-chip ${this.currentFilter === 'IN_LAB' ? 'active' : ''}" data-filter="IN_LAB">في المعمل</button>
            <button class="filter-chip ${this.currentFilter === 'DELIVERED' ? 'active' : ''}" data-filter="DELIVERED">تم التسليم</button>
            <button class="filter-chip ${this.currentFilter === 'WAITING' ? 'active' : ''}" data-filter="WAITING">في الانتظار</button>
            <button class="filter-chip ${this.currentFilter === 'CANCELLED' ? 'active' : ''}" data-filter="CANCELLED">ملغى</button>
          </div>
        </div>

        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>الطبيب</th>
                <th>تاريخ الطلب</th>
                <th>المبلغ الإجمالي</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
                <th>حالة التسليم</th>
                <th>اسم المستلم</th>
                <th>تاريخ التسليم</th>
                <th style="width:160px">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${this.orders.length === 0
                ? `<tr><td colspan="10"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">لا توجد طلبات</div></div></div></td></tr>`
                : this.orders.map((order) => {
                    const ds = DELIVERY_STATUS[order.deliveryStatus] || { label: order.deliveryStatus, class: '' }
                    return `<tr>
                      <td class="code-cell">${escapeHtml(order.orderNumber)}</td>
                      <td class="name-cell">${escapeHtml(order.dentistName)}<br><small style="color:var(--text-secondary)">${escapeHtml(order.dentistPhone || '')}</small></td>
                      <td class="date-cell">${formatDate(order.orderDate)}</td>
                      <td>${formatCurrencyWithEGP(order.total)}</td>
                      <td class="amount-positive">${formatCurrencyWithEGP(order.paid)}</td>
                      <td>${formatCurrencyWithEGP(order.remaining)}</td>
                      <td><span class="status-badge ${ds.class}">${ds.label}</span></td>
                      <td>${escapeHtml(order.deliveryPerson || '')}</td>
                      <td class="date-cell">${formatDate(order.deliveryDate)}</td>
                      <td>
                        <div class="table-actions">
                          <button class="btn btn-sm btn-outline" data-action="update" data-id="${order.id}">تحديث التسليم</button>
                          ${Auth.isAdmin() ? `<button class="btn btn-sm btn-danger" data-action="delete" data-id="${order.id}">🗑️</button>` : ''}
                        </div>
                      </td>
                    </tr>`
                  }).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `

    const newSearchInput = document.getElementById('orderSearch')
    if (newSearchInput && wasFocused) {
      newSearchInput.focus()
      newSearchInput.setSelectionRange(savedSelectionStart, savedSelectionEnd)
    }

    document.getElementById('btnBack').addEventListener('click', () => Router.navigate('dashboard'))

    const debouncedSearch = debounce((q) => this.loadData(q, this.currentFilter), 500)
    newSearchInput?.addEventListener('input', (e) => debouncedSearch(e.target.value))

    this.container.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.loadData(this.currentQuery || '', chip.dataset.filter)
      })
    })

    this.container.querySelectorAll('[data-action="update"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.showUpdateModal(btn.dataset.id)
      })
    })

    this.container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.deleteOrder(btn.dataset.id)
      })
    })
  },

  async showUpdateModal(id) {
    const order = await API.orders.getById(id)
    if (!order) return

    this.currentStatus = order.deliveryStatus
    const statusOptions = Object.entries(DELIVERY_STATUS).map(([value, { label }]) => {
      const selected = order.deliveryStatus === value ? 'selected' : ''
      return `<option value="${value}" ${selected}>${label}</option>`
    }).join('')

    const content = `
      <form id="updateDeliveryForm">
        <div class="form-group">
          <label class="form-label">حالة التسليم</label>
          <select class="form-select" id="deliveryStatusSelect">${statusOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">اسم المستلم</label>
          <input type="text" class="form-input" id="deliveryPersonInput" value="${escapeHtml(order.deliveryPerson || '')}" placeholder="اسم من استلم الطلب">
        </div>
        <div class="form-group">
          <label class="form-label">تاريخ التسليم</label>
          <input type="date" class="form-input" id="deliveryDateInput" value="${toInputDate(order.deliveryDate)}">
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">حفظ</button>
          <button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button>
        </div>
      </form>
    `
    Modal.show('تحديث حالة التسليم', content, { size: 'md' })

    document.getElementById('modalCancelBtn')?.addEventListener('click', () => Modal.close())
    document.getElementById('updateDeliveryForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const status = document.getElementById('deliveryStatusSelect').value
      const person = document.getElementById('deliveryPersonInput').value.trim()
      const dateVal = document.getElementById('deliveryDateInput').value
      try {
        await API.orders.updateDeliveryStatus(order.id, status, person, dateVal ? new Date(dateVal) : null)
        Modal.close()
        Toast.success('تم تحديث حالة التسليم بنجاح')
        this.loadData(this.currentQuery || '', this.currentFilter)
      } catch (error) {
        console.error('Delivery update error:', error)
        Toast.error('حدث خطأ في تحديث الحالة')
      }
    })
  },

  async deleteOrder(id) {
    const order = this.orders.find(o => o.id === id)
    if (!order) return
    Modal.confirm(`هل أنت متأكد من حذف الطلب "${order.orderNumber}"؟\n\nسيتم حذف الطلب نهائياً.`, async () => {
      try {
        await API.orders.delete(id)
        Toast.success('تم حذف الطلب بنجاح')
        this.loadData(this.currentQuery || '', this.currentFilter)
      } catch (error) {
        Toast.error(error.message || 'حدث خطأ في حذف الطلب')
      }
    }, { title: 'تأكيد الحذف', confirmText: 'نعم، حذف', confirmClass: 'btn-danger' })
  }
}

Router.register('order-tracking', (c) => OrderTracking.init(c))
