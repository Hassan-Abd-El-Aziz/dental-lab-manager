export const Router = {
  currentPage: null,
  pages: {},

  register(name, renderFn) {
    this.pages[name] = renderFn
  },

  navigate(page) {
    if (this.currentPage === page) return
    this.currentPage = page

    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.page === page)
    })

    const container = document.getElementById('page-container')
    if (this.pages[page]) {
      this.pages[page](container)
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🚧</div>
          <div class="empty-state-text">هذه الصفحة قيد التطوير</div>
        </div>
      `
    }

    document.getElementById('main-content').scrollTop = 0
  },

  init() {
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault()
        this.navigate(item.dataset.page)
      })
    })
  }
}
