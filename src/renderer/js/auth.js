import { API } from './api.js'
import { Router } from './router.js'
import { Toast } from './components/toast.js'

const ADMIN_ROUTES = ['reports', 'settings', 'users', 'audit']

export const Auth = {
  user: null,

  async init() {
    this.user = await API.auth.initSession()
    return this.user
  },

  isAuthenticated() {
    return !!this.user
  },

  isAdmin() {
    return this.user?.role === 'admin'
  },

  isAdminRoute(page) {
    return ADMIN_ROUTES.includes(page)
  },

  canAccess(page) {
    if (!this.isAuthenticated()) return { allowed: false, redirect: 'login' }
    if (this.isAdminRoute(page) && !this.isAdmin()) return { allowed: false, redirect: 'dashboard' }
    return { allowed: true }
  },

  async logout() {
    await API.auth.logout()
    this.user = null
    Router.navigate('login')
    Toast.success('تم تسجيل الخروج')
  }
}
