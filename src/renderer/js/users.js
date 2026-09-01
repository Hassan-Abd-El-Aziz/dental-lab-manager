import { Router } from './router.js'
import { API } from './api.js'
import { Modal } from './components/modal.js'
import { Toast } from './components/toast.js'
import { formatDate, escapeHtml } from './utilities.js'

const UsersPage = {
  users: [],

  async render(container) {
    this.container = container
    await this.loadData()
  },

  async loadData() {
    this.users = await API.users.getAll()
    this.renderUI()
  },

  renderUI() {
    const el = this.container
    if (!el) return
    el.innerHTML = `
      <div class="page-header"><h1 class="page-title">👤 المستخدمين</h1><button class="btn btn-sm btn-primary" id="btnAddUser">+ إضافة مستخدم</button></div>
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead><tr><th>اسم المستخدم</th><th>الاسم</th><th>الدور</th><th>الحالة</th><th>تاريخ الإنشاء</th><th style="width:120px">الإجراءات</th></tr></thead>
          <tbody>${this.users.length === 0
            ? '<tr><td colspan="6"><div class="table-empty"><div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">لا يوجد مستخدمون</div></div></div></td></tr>'
            : this.users.map((u) => {
              const roleBadge = u.role === 'admin' ? '<span class="status-badge status-paid">مدير</span>' : '<span class="status-badge status-info">موظف</span>'
              const statusBadge = u.active ? '<span class="status-badge status-paid">نشط</span>' : '<span class="status-badge status-cancelled">غير نشط</span>'
              return `<tr>
                <td class="code-cell">${escapeHtml(u.username)}</td>
                <td class="name-cell">${escapeHtml(u.name || '')}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td class="date-cell">${formatDate(u.createdAt)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-sm btn-outline" data-action="edit" data-id="${u.id}">تعديل</button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${u.id}">حذف</button>
                  </div>
                </td>
              </tr>`
            }).join('')}
        </tbody>
        </table>
      </div>
    `

    document.getElementById('btnAddUser').addEventListener('click', () => this.showUserModal())
    this.container.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'edit') this.showUserModal(btn.dataset.id)
        else if (btn.dataset.action === 'delete') this.deleteUser(btn.dataset.id)
      })
    })
  },

  showUserModal(id) {
    const user = id ? this.users.find(u => u.id === id) : null
    const isEdit = !!user
    const roleOpts = ['admin', 'user'].map(r => {
      const selected = user?.role === r ? 'selected' : ''
      const label = r === 'admin' ? 'مدير' : 'موظف'
      return `<option value="${r}" ${selected}>${label}</option>`
    }).join('')

    const content = `
      <form id="userForm">
        <div class="form-group"><label class="form-label">اسم المستخدم</label><input type="text" class="form-input" id="userUsername" value="${escapeHtml(user?.username || '')}" ${isEdit ? 'readonly' : ''} required></div>
        <div class="form-group"><label class="form-label">الاسم</label><input type="text" class="form-input" id="userName" value="${escapeHtml(user?.name || '')}" placeholder="اختياري"></div>
        <div class="form-group"><label class="form-label">الدور</label><select class="form-select" id="userRole">${roleOpts}</select></div>
        <div class="form-group"><label class="form-label">كلمة المرور</label><input type="password" class="form-input" id="userPassword" placeholder="${isEdit ? 'اترك فارغاً لعدم التغيير' : 'إدخال كلمة مرور'}"></div>
        <div class="form-group"><label class="form-label">الحالة</label><select class="form-select" id="userActive">${user?.active === false ? '<option value="false">غير نشط</option><option value="true">نشط</option>' : '<option value="true">نشط</option><option value="false">غير نشط</option>'}</select></div>
        <div class="form-actions"><button type="submit" class="btn btn-primary">${isEdit ? 'حفظ' : 'إنشاء'}</button><button type="button" class="btn btn-outline" id="modalCancelBtn">إلغاء</button></div>
      </form>
    `

    Modal.show(isEdit ? 'تعديل مستخدم' : 'إضافة مستخدم', content, { size: 'md' })
    document.getElementById('modalCancelBtn').addEventListener('click', () => Modal.close())

    document.getElementById('userForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      const data = {
        username: document.getElementById('userUsername').value.trim(),
        name: document.getElementById('userName').value.trim(),
        role: document.getElementById('userRole').value,
        password: document.getElementById('userPassword').value,
        active: document.getElementById('userActive').value === 'true'
      }

      try {
        if (isEdit) {
          if (!data.password) delete data.password
          await API.users.update(id, data)
          Toast.success('تم تحديث المستخدم')
        } else {
          if (!data.username || !data.password) { Toast.error('اسم المستخدم وكلمة المرور مطلوبان'); return }
          await API.users.create(data)
          Toast.success('تم إنشاء المستخدم')
        }
        Modal.close()
        await this.loadData()
      } catch (error) {
        Toast.error(error.message || 'حدث خطأ')
      }
    })
  },

  async deleteUser(id) {
    const user = this.users.find(u => u.id === id)
    if (!user) return
    if (user.role === 'admin') { Toast.error('لا يمكن حذف مدير النظام'); return }
    Modal.confirm(`هل أنت متأكد من حذف المستخدم ${user.username}؟`, async () => {
      try {
        await API.users.delete(id)
        Toast.success('تم حذف المستخدم')
        await this.loadData()
      } catch (error) {
        Toast.error(error.message || 'حدث خطأ')
      }
    })
  }
}

Router.register('users', (c) => UsersPage.render(c))
