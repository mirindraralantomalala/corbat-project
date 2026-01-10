(function(){
  'use strict';

  /* ----------  Nouveau contrôle d’authentification ---------- */
  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/check", {
        credentials: "include"
      });

      if (res.status !== 200) {
        window.location.href = "login.html";
      }
    } catch (err) {
      window.location.href = "login.html";
    }
  }

  // Lancer le contrôle seulement si ce n’est **pas** la page login
  if (!location.pathname.endsWith("login.html")) {
    checkAuth();
  }

  /* ---------- Utilitaires génériques (inchangés) ---------- */
  function load(key){ try { const v = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(v) ? v : []; } catch(e){ return []; } }
  function save(key, arr){ localStorage.setItem(key, JSON.stringify(arr || [])); }
  function fmt(date){ try { return new Date(date).toLocaleString(); } catch(e){ return date || '-'; } }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }

  function downloadCsvFromArray(arr, header, filename){
    const rows = arr.map(item => header.map(k => `"${((item[k]||'')+'').toString().replace(/"/g,'""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  /* ---------- Render helper generic (table-based) ---------- */
  function renderTableForKey(options){
    const { key, tbodySelector, searchEl, filterEl, exportBtn, statusMap, filename } = options;
    const tbody = document.querySelector(tbodySelector);
    if (!tbody) return;

    function render(){
      const all = load(key);
      const search = searchEl ? (searchEl.value||'').toLowerCase().trim() : '';
      const statusFilter = filterEl ? (filterEl.value||'').toLowerCase().trim() : '';

      let rows = all.map((r, idx) => ({ _idx_full: idx, ...r }));

      if (statusFilter) rows = rows.filter(r => (String(r.status||'').toLowerCase() === statusFilter));
      if (search) rows = rows.filter(r => ((r.fullname||r.name||'') + ' ' + (r.email||'') + ' ' + (r.service||r.Service||'')).toLowerCase().includes(search));

      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding:20px;text-align:center;color:#666">Aucune entrée.</td></tr>';
        return;
      }

      tbody.innerHTML = rows.map(r => {
        const opts = Object.keys(statusMap).map(k => `<option value="${k}" ${ (r.status === k) ? 'selected' : '' }>${statusMap[k]}</option>`).join('');
        return `<tr data-idx-full="${r._idx_full}">
          <td>${escapeHtml(r.fullname || r.name || '-')}</td>
          <td>${escapeHtml(r.email || '-')}</td>
          <td>${escapeHtml(r.phone || '-')}</td>
          <td>${escapeHtml(r.service || r.Service || '-')}</td>
          <td>${escapeHtml(fmt(r.created_at || r.date))}</td>
          <td><select class="status-select" data-idx-full="${r._idx_full}">${opts}</select></td>
          <td><button class="btn-small view-btn" data-idx-full="${r._idx_full}">Voir</button><button class="btn-ghost del-btn" data-idx-full="${r._idx_full}">Supprimer</button></td>
        </tr>`;
      }).join('');

      tbody.querySelectorAll('.view-btn').forEach(b => b.addEventListener('click', () => showDetailModal(load(key)[+b.dataset.idxFull], key)));
      tbody.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', () => { const arr = load(key); arr.splice(+b.dataset.idxFull, 1); save(key, arr); render(); }));
      tbody.querySelectorAll('.status-select').forEach(s => s.addEventListener('change', () => { const arr = load(key); arr[+s.dataset.idxFull].status = s.value; save(key, arr); render(); }));
    }

    if (searchEl) searchEl.addEventListener('input', render);
    if (filterEl) filterEl.addEventListener('change', render);
    if (exportBtn) exportBtn.addEventListener('click', () => downloadCsvFromArray(load(key), ['fullname','email','phone','service','message','status','created_at'], filename));

    render();
  }

})();
