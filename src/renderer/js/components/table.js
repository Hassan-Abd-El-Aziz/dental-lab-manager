import { escapeHtml } from '../utilities.js'

export const Table = {
  render(config) {
    const { columns, data, emptyMessage } = config
    if (!data || data.length === 0) {
      return `
        <div class="data-table-wrapper">
          <div class="table-empty">
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <div class="empty-state-text">${emptyMessage || 'لا توجد بيانات'}</div>
            </div>
          </div>
        </div>
      `
    }

    let html = '<div class="data-table-wrapper"><table class="data-table"><thead><tr>'
    columns.forEach((col) => {
      html += `<th>${col.header}</th>`
    })
    html += '</tr></thead><tbody>'

    data.forEach((row, index) => {
      html += '<tr>'
      columns.forEach((col) => {
        let cellContent = ''
        if (col.render) {
          cellContent = col.render(row, index)
        } else if (col.key) {
          cellContent = escapeHtml(row[col.key])
        }
        html += `<td>${cellContent}</td>`
      })
      html += '</tr>'
    })

    html += '</tbody></table></div>'
    return html
  }
}
