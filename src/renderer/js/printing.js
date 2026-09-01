import { API } from './api.js'
import { formatCurrency, formatCurrencyWithEGP, formatDate, escapeHtml } from './utilities.js'
import { Toast } from './components/toast.js'

export const Printing = {
  async printInvoice(invoice) {
    const settings = await API.settings.get()
    const labName = settings?.labName || 'معمل الأسنان'
    const labAddress = settings?.address || ''
    const labPhone = settings?.phone || ''

    const pw = window.open('', '_blank', 'width=800,height=600')
    if (!pw) { Toast.error('يرجى السماح بفتح النوافذ المنبثقة'); return }

    let itemsHtml = ''
    if (invoice.items?.length) {
      invoice.items.forEach((i) => { itemsHtml += `<tr><td>${escapeHtml(i.itemNameSnapshot)}</td><td>${i.quantity}</td><td>${formatCurrency(i.unitPriceSnapshot)} ج.م</td><td>${formatCurrency(i.discount || 0)} ج.م</td><td>${formatCurrency(Math.max(0, (i.lineTotal || 0) - (i.discount || 0)))} ج.م</td></tr>` })
    }

    pw.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>فاتورة ${invoice.invoiceNumber}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',sans-serif;padding:20mm;padding-top:60px;color:#1e293b;line-height:1.6}.print-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 24px;background:#f8fafc;border-bottom:2px solid #1e293b;position:fixed;top:0;left:0;right:0;z-index:1000}.print-btn,.close-btn{padding:8px 16px;border:none;border-radius:6px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:background 0.2s}.print-btn{background:#1e293b;color:#fff}.print-btn:hover{background:#2d3a5a}.close-btn{background:#ef4444;color:#fff}.close-btn:hover{background:#dc2626}.header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #1e293b}.lab-icon{font-size:48px;margin-bottom:8px}.lab-name{font-size:24px;font-weight:800}.lab-info{font-size:12px;color:#64748b;margin-top:4px}.doc-title{font-size:20px;font-weight:700;margin-top:12px}.info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0;font-size:14px}.info-item{display:flex;gap:8px}.info-label{font-weight:600;color:#475569;min-width:70px}.detail-box{margin:12px 0;padding:10px;background:#f8fafc;border-radius:6px;font-size:13px}table{width:100%;border-collapse:collapse;margin:16px 0}th{padding:8px 12px;text-align:right;font-size:13px;font-weight:700;background:#f1f5f9;border:1px solid #e2e8f0}td{padding:8px 12px;border:1px solid #e2e8f0;font-size:13px}.summary{display:flex;gap:32px;justify-content:flex-end;margin-top:16px;padding-top:12px;border-top:2px solid #e2e8f0}.summary-item{text-align:right}.summary-label{font-size:12px;color:#64748b}.summary-value{font-size:18px;font-weight:800}.footer{margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8}@media print{body{padding:15mm}@page{size:A4;margin:10mm}.print-toolbar{display:none}}</style></head><body><div class="print-toolbar"><button class="print-btn" onclick="window.print()">🖨️ طباعة</button><button class="close-btn" onclick="window.close()">✕ إغلاق</button></div>
      <div class="header"><div class="lab-icon" >🦷</div><div class="lab-name">${escapeHtml(labName)}</div><div class="lab-info">${escapeHtml(labAddress)} ${labPhone ? '| ' + escapeHtml(labPhone) : ''}</div><div class="doc-title">فاتورة رقم ${invoice.invoiceNumber}</div></div>
      <div class="info-grid"><div class="info-item"><span class="info-label">التاريخ:</span><span>${formatDate(invoice.date)}</span></div><div class="info-item"><span class="info-label">الطبيب:</span><span>${escapeHtml(invoice.dentistName)}</span></div>${invoice.diagnosis ? `<div class="info-item"><span class="info-label">التشخيص:</span><span>${escapeHtml(invoice.diagnosis)}</span></div>` : ''}${invoice.teeth ? `<div class="info-item"><span class="info-label">الأسنان:</span><span>${escapeHtml(invoice.teeth)}</span></div>` : ''}${invoice.category ? `<div class="info-item"><span class="info-label">التصنيف:</span><span>${escapeHtml(invoice.category)}</span></div>` : ''}</div>
      ${invoice.categoryComment ? `<div class="detail-box"><strong>ملاحظة:</strong> ${escapeHtml(invoice.categoryComment)}</div>` : ''}
      <table><thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الإجمالي</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      <div class="summary"><div class="summary-item"><div class="summary-label">الإجمالي</div><div class="summary-value">${formatCurrencyWithEGP(invoice.total)}</div></div><div class="summary-item"><div class="summary-label">الخصم</div><div class="summary-value" style="color:#16a34a">${formatCurrencyWithEGP(invoice.totalDiscount || 0)}</div></div><div class="summary-item"><div class="summary-label">المدفوع</div><div class="summary-value" style="color:#16a34a">${formatCurrencyWithEGP(invoice.paid)}</div></div><div class="summary-item"><div class="summary-label">المتبقي</div><div class="summary-value" style="color:#dc2626">${formatCurrencyWithEGP(invoice.remaining)}</div></div></div>
      <div class="footer">شكرا لتعاملكم معنا</div></body></html>`)
    pw.document.close()
  },

  async printDentistStatement(dentistId) {
    const from = document.getElementById('accountFrom')?.value || '2020-01-01'
    const to = document.getElementById('accountTo')?.value || new Date().toISOString().split('T')[0]
    const account = await API.dentists.getAccount(dentistId, from, to)
    if (!account) return

    const settings = await API.settings.get()
    const labName = settings?.labName || 'معمل الأسنان'

    const pw = window.open('', '_blank', 'width=800,height=600')
    if (!pw) { Toast.error('يرجى السماح بفتح النوافذ المنبثقة'); return }

    let ledgerHtml = ''
    account.ledger.forEach((e) => { ledgerHtml += `<tr><td>${formatDate(e.date)}</td><td>${e.type === 'INVOICE' ? 'فاتورة' : 'دفعة'}</td><td>${escapeHtml(e.description)}</td><td>${e.debit > 0 ? formatCurrency(e.debit) + ' ج.م' : '-'}</td><td>${e.credit > 0 ? formatCurrency(e.credit) + ' ج.م' : '-'}</td><td style="font-weight:700">${formatCurrency(e.balance)} ج.م</td></tr>` })

    pw.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>كشف حساب ${account.dentist.name}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo',sans-serif;padding:20mm;padding-top:60px;color:#1e293b;line-height:1.6}.print-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 24px;background:#f8fafc;border-bottom:2px solid #1e293b;position:fixed;top:0;left:0;right:0;z-index:1000}.print-btn,.close-btn{padding:8px 16px;border:none;border-radius:6px;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:background 0.2s}.print-btn{background:#1e293b;color:#fff}.print-btn:hover{background:#2d3a5a}.close-btn{background:#ef4444;color:#fff}.close-btn:hover{background:#dc2626}.header{text-align:center;margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #1e293b}.lab-icon{font-size:35px;margin-bottom:8px}.lab-name{font-size:24px;font-weight:800}.doc-title{font-size:20px;font-weight:700;margin-top:12px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0;font-size:14px}.info-item{display:flex;gap:8px}.info-label{font-weight:600;color:#475569}.kpi-row{display:flex;gap:24px;justify-content:center;margin:20px 0}.kpi-box{text-align:center;padding:12px 20px;border:1px solid #e2e8f0;border-radius:8px}.kpi-box .label{font-size:12px;color:#64748b}.kpi-box .value{font-size:18px;font-weight:800;margin-top:4px}table{width:100%;border-collapse:collapse;margin:16px 0}th{padding:8px 12px;text-align:right;font-size:12px;font-weight:700;background:#f1f5f9;border:1px solid #e2e8f0}td{padding:8px 12px;border:1px solid #e2e8f0;font-size:12px}.footer{margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8}@media print{body{padding:15mm}@page{size:A4 landscape;margin:10mm}.print-toolbar{display:none}}</style></head><body><div class="print-toolbar"><button class="print-btn" onclick="window.print()">🖨️ طباعة</button><button class="close-btn" onclick="window.close()">✕ إغلاق</button></div>
      <div class="header"><div class="lab-icon">🦷</div><div class="lab-name">${escapeHtml(labName)}</div><div class="doc-title">كشف حساب الطبيب: ${escapeHtml(account.dentist.name)}</div><div style="font-size:13px;color:#64748b;margin-top:4px">الفترة: ${formatDate(from)} - ${formatDate(to)}</div></div>
      <div class="info-grid"><div class="info-item"><span class="info-label">الاسم:</span><span>${escapeHtml(account.dentist.name)}</span></div><div class="info-item"><span class="info-label">الهاتف:</span><span>${escapeHtml(account.dentist.phone)}</span></div><div class="info-item"><span class="info-label">العيادة:</span><span>${escapeHtml(account.dentist.clinic)}</span></div></div>
      <div class="kpi-row"><div class="kpi-box"><div class="label">عدد الفواتير</div><div class="value">${account.summary.invoiceCount}</div></div><div class="kpi-box"><div class="label">إجمالي الفواتير</div><div class="value">${formatCurrencyWithEGP(account.summary.totalInvoices)}</div></div><div class="kpi-box"><div class="label">إجمالي المدفوع</div><div class="value" style="color:#16a34a">${formatCurrencyWithEGP(account.summary.totalPaid)}</div></div><div class="kpi-box"><div class="label">الرصيد المتبقي</div><div class="value" style="color:#dc2626">${formatCurrencyWithEGP(account.summary.remaining)}</div></div></div>
      <table><thead><tr><th>التاريخ</th><th>نوع العملية</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>${ledgerHtml}</tbody></table>
      <div class="footer">تم طباعة هذا الكشف بتاريخ ${formatDate(new Date())}</div></body></html>`)
    pw.document.close()
  }
}
