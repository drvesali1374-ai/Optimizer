// =================== SVG ICONS ===================
const DELETE_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6666" stroke-width="2">
  <circle cx="12" cy="12" r="10" fill="rgba(255,0,0,0.1)"/>
  <line x1="8" y1="8" x2="16" y2="16"/>
  <line x1="16" y1="8" x2="8" y2="16"/>
</svg>`;

const ADD_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2">
  <circle cx="12" cy="12" r="10" fill="rgba(52,211,153,0.1)"/>
  <line x1="12" y1="8" x2="12" y2="16"/>
  <line x1="8" y1="12" x2="16" y2="12"/>
</svg>`;

// =================== PLANS & PAGINATION ===================
function renderCalculationPlans() {
  const totalPlans = state.plans.length;
  const currentPage = state.currentPlanPage;
  const isBase = currentPage === 0;
  const plan = isBase ? null : state.plans[currentPage - 1];

  let presetOptions = '<option value="-1">-- انتخاب لیوت --</option>';
  const userId = state.currentUser?.id;
  if (state.sharedData && userId) {
    const presets = state.sharedData.userPresets?.[userId]?.plans || [];
    presets.forEach((preset, idx) => {
      presetOptions += `<option value="${idx}">${preset.name}</option>`;
    });
  }

  const prevBtn = `<button class="page-btn" onclick="changePlanPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>‹</button>`;
  const nextBtn = `<button class="page-btn" onclick="changePlanPage(${currentPage + 1})" ${currentPage >= totalPlans ? 'disabled' : ''}>›</button>`;
  const pageInfo = isBase ? `طرح پایه` : `طرح ${currentPage} از ${totalPlans}`;

  const paginationHTML = `
    <div class="plan-pagination">
      ${prevBtn}
      <span class="page-info">${pageInfo}</span>
      ${nextBtn}
    </div>
  `;

  let contentHTML = '';
  if (isBase) {
    contentHTML = renderBasePlan();
  } else if (plan) {
    contentHTML = renderPlan(plan, currentPage - 1);
  }

  return `
    <div class="glass" style="padding:18px;">
      <h3 style="margin-bottom:16px;">طرح‌ریزی محاسبات</h3>
      <!-- مدیریت لیوت‌ها -->
      <div style="display:flex; gap:6px; align-items:center; margin-bottom:12px; flex-wrap:wrap;">
        <select id="planPresetSelect" onchange="if(this.value!='-1') applyPlanPreset(parseInt(this.value))" style="flex:1; min-width:140px;">
          ${presetOptions}
        </select>
        <button onclick="showDeletePlanPresetModal()" title="حذف لیوت" style="background:none; border:none; cursor:pointer; padding:4px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
        <button onclick="showEditPlanPresetModal()" title="ویرایش لیوت" style="background:none; border:none; cursor:pointer; padding:4px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button onclick="savePlanPreset(prompt('نام لیوت جدید برای طرح‌ها:'))" class="btn-secondary" style="white-space:nowrap;">💾 ذخیره</button>
        <button onclick="exportPlanPresets()" class="btn-secondary" style="white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="صدور لیوت‌ها">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          صدور
        </button>
        <button onclick="importPlanPresets()" class="btn-secondary" style="white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="وارد کردن لیوت‌ها">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          ورود
        </button>
      </div>
      ${paginationHTML}
      <div class="plan-card ${isBase ? 'plan-base' : ''}" style="background: ${isBase ? '' : getPlanBg(currentPage - 1)}">
        ${contentHTML}
        ${!isBase ? `
          <div style="display:flex; justify-content:flex-start; margin-top:12px;">
            <button onclick="addPlanRow('${plan.id}')" class="btn-success" style="font-size:0.8em;padding:4px 10px;">+ افزودن ردیف</button>
          </div>
        ` : ''}
      </div>
      ${paginationHTML}
      <button onclick="addPlan()" class="btn-new-plan" style="margin-top:15px; font-family:'Vazirmatn','BNazanin','Calibri',sans-serif;">
        ${ADD_ICON} طرح جدید
      </button>
    </div>
  `;
}

window.changePlanPage = (page) => { state.currentPlanPage = Math.max(0, Math.min(page, state.plans.length)); saveLocalSettings(); renderApp(); };

function getPlanBg(index) {
  const colors = ['rgba(59,130,246,0.08)','rgba(139,92,246,0.08)','rgba(236,72,153,0.08)','rgba(245,158,11,0.08)','rgba(16,185,129,0.08)','rgba(239,68,68,0.08)'];
  return colors[index % colors.length];
}

function renderBasePlan() {
  const criteriaHTML = renderCriteriaListEditor('base', state.basePlan.criteria);
  return `
    <div class="plan-header"><span class="plan-name">طرح پایه</span></div>
    <div style="margin-bottom:10px;">
      <label style="margin-left:10px;">شماره ترکیب برگزیده:</label>
      <input type="number" value="${state.basePlan.selectedRank}" min="1" onchange="updateBasePlanRank(this.value)" style="width:80px;">
    </div>
    ${criteriaHTML}
  `;
}

function renderPlan(plan) {
  const rowsHTML = plan.rows.map(row => renderPlanRow(plan.id, row)).join('');
  return `
    <div class="plan-header" style="display:flex; justify-content:space-between; align-items:center;">
      <span class="plan-name">${plan.name}</span>
      <button onclick="confirmDeletePlan('${plan.id}')" class="btn-delete-plan" style="font-family:'Vazirmatn','BNazanin','Calibri',sans-serif;">
        ${DELETE_ICON} حذف طرح
      </button>
    </div>
    <div id="rows_${plan.id}">${rowsHTML}</div>
  `;
}

function renderPlanRow(planId, row) {
  const criteriaHTML = renderCriteriaListEditor(`row_${planId}_${row.step}`, row.criteria);
  const trashIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;

  return `
    <div class="row-card">
      <div class="row-fields">
        <span class="row-number">ردیف ${row.step}</span>
        <label style="font-size:inherit;">شماره ردیف: <input type="number" value="${row.step}" onchange="updatePlanRowStep('${planId}', ${row.step}, this.value)" min="1"></label>
        <label style="font-size:inherit;">شماره ترکیب برگزیده: <input type="number" value="${row.selectedRank}" onchange="updatePlanRowRank('${planId}', ${row.step}, this.value)" min="1"></label>
        <button onclick="confirmDeleteRow('${planId}', ${row.step})" class="btn-delete-row" title="حذف ردیف">${trashIcon}</button>
      </div>
      ${criteriaHTML}
    </div>
  `;
}

// =================== DELETE CONFIRMATION MODALS ===================
window.showConfirm = function(message, onConfirm) {
  // بستن هر مودال قبلی (برای اطمینان)
  const prev = document.querySelector('.modal-overlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="glass-dark" style="padding:25px; max-width:380px; text-align:center;">
      <p style="margin-bottom:20px;">${message}</p>
      <button id="confirmYes" type="button" class="btn-confirm-delete">بله، حذف شود</button>
      <button id="confirmNo" type="button" class="btn-secondary" style="margin:5px;">انصراف</button>
    </div>
  `;
  document.body.appendChild(overlay);

  function closeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  // دکمه‌ها
  overlay.querySelector('#confirmYes').onclick = () => {
    closeOverlay();
    onConfirm();
  };
  overlay.querySelector('#confirmNo').onclick = closeOverlay;

  // پشتیبانی از کیبورد
  const handleKey = function(e) {
    if (e.key === 'Escape') {
      closeOverlay();
      document.removeEventListener('keydown', handleKey);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      closeOverlay();
      onConfirm();
      document.removeEventListener('keydown', handleKey);
    }
  };
  document.addEventListener('keydown', handleKey);
};

window.confirmDeletePlan = (id) => {
  window.showConfirm('آیا از حذف این طرح اطمینان دارید؟', () => deletePlan(id));
};

window.confirmDeleteRow = (planId, step) => {
  window.showConfirm('آیا از حذف این ردیف اطمینان دارید؟', () => deletePlanRow(planId, step));
};

// =================== PLAN ACTIONS ===================
window.addPlan = () => {
  const newPlan = { id: Date.now().toString(), name: `طرح ${state.plans.length + 1}`, rows: [] };
  state.plans.push(newPlan);
  state.currentPlanPage = state.plans.length;
  saveLocalSettings(); renderApp();
};
window.deletePlan = (id) => {
  state.plans = state.plans.filter(p => p.id !== id);
  state.plans.forEach((p, i) => p.name = `طرح ${i + 1}`);
  if (state.currentPlanPage > state.plans.length) state.currentPlanPage = Math.max(0, state.plans.length);
  saveLocalSettings(); renderApp();
};
window.addPlanRow = (planId) => {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;
  const nextStep = plan.rows.length > 0 ? Math.max(...plan.rows.map(r => r.step)) + 1 : 1;
  plan.rows.push({ step: nextStep, selectedRank: 1, criteria: state.basePlan.criteria.map(c => ({ field: c.field, dir: c.dir })) });
  saveLocalSettings(); renderApp();
};
window.deletePlanRow = (planId, step) => {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;
  plan.rows = plan.rows.filter(r => r.step !== step);
  saveLocalSettings(); renderApp();
};
window.updatePlanRowStep = (planId, oldStep, newStep) => {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;
  const row = plan.rows.find(r => r.step === oldStep);
  if (row) row.step = parseInt(newStep) || oldStep;
  saveLocalSettings(); renderApp();
};
window.updatePlanRowRank = (planId, step, rank) => {
  const plan = state.plans.find(p => p.id === planId);
  if (!plan) return;
  const row = plan.rows.find(r => r.step === step);
  if (row) row.selectedRank = parseInt(rank) || 1;
  saveLocalSettings(); renderApp();
};
window.updateBasePlanRank = (val) => { state.basePlan.selectedRank = parseInt(val) || 1; saveLocalSettings(); renderApp(); };