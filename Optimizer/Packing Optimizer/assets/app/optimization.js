// =================== VALIDATION ===================
function validatePlans() {
  for (let i = 0; i < state.items.length; i++) {
    const item = state.items[i];
    const w = parseFloat(item.width), wt = parseFloat(item.weight);
    if (!item.width || isNaN(w) || w <= 0) continue;
    if (isNaN(wt) || wt < 0) return `ردیف ${i + 1}: برای عرض ${item.width} باید وزن معتبر وارد کنید.`;
  }
  for (let plan of state.plans) {
    if (plan.rows.length === 0) return `طرح "${plan.name}" هیچ ردیفی ندارد.`;
    const steps = plan.rows.map(r => r.step);
    if (new Set(steps).size !== steps.length) return `در طرح "${plan.name}" شماره ردیف‌های تکراری وجود دارد.`;
  }
  const validWidths = state.items.filter(it => it.width && !isNaN(parseFloat(it.width)) && parseFloat(it.width) > 0).map(it => it.width);
  if (checkDuplicates(validWidths).length > 0) return 'عرض‌های تکراری در جدول قطعات وجود دارد.';
  return null;
}

// =================== LOADING ANIMATIONS ===================
function showLoadingPuzzle() {
  const prog = document.getElementById('progressText');
  if (prog) {
    prog.innerHTML = '<div class="loading-puzzle-container"><div class="puzzle-piece"></div><div class="puzzle-piece"></div><div class="puzzle-piece"></div></div>';
  }
  const mini = document.getElementById('headerLoading');
  if (mini) {
    mini.innerHTML = '<div class="loading-puzzle-mini"><span class="mini-dot"></span><span class="mini-dot"></span><span class="mini-dot"></span></div>';
  }
}

function hideLoadingPuzzle() {
  const prog = document.getElementById('progressText');
  if (prog) prog.textContent = '';
  const mini = document.getElementById('headerLoading');
  if (mini) mini.innerHTML = '';
}

// =================== MODAL ===================
function showClearOrAppendModal(callback) {
  // بستن قبلی
  const prev = document.querySelector('.modal-overlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="glass-dark" style="padding:30px; max-width:420px; text-align:center; position:relative;">
      <button id="closeModalBtn2" type="button" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#aaa; font-size:1.5rem; cursor:pointer;">&times;</button>
      <p style="margin-bottom:20px; font-family:'Vazirmatn','BNazanin','Calibri',sans-serif; color: inherit;">از قبل نتیجه‌ای وجود دارد. می‌خواهید چه کار کنید؟</p>
      <button id="clearResultsBtn2" type="button" class="btn-confirm-delete" style="margin:5px; padding:10px 20px; font-family:'Vazirmatn','BNazanin','Calibri',sans-serif; width:140px;">حذف سوابق</button>
      <button id="appendResultsBtn2" type="button" class="btn-primary" style="margin:5px; padding:10px 20px; font-family:'Vazirmatn','BNazanin','Calibri',sans-serif; width:140px;">افزودن به سوابق</button>
    </div>
  `;
  document.body.appendChild(overlay);

  function closeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  overlay.querySelector('#closeModalBtn2').onclick = closeOverlay;
  overlay.querySelector('#clearResultsBtn2').onclick = () => {
    closeOverlay();
    callback('clear');
  };
  overlay.querySelector('#appendResultsBtn2').onclick = () => {
    closeOverlay();
    callback('append');
  };

  // پشتیبانی از کیبورد
  const handleKey = function(e) {
    if (e.key === 'Escape') {
      closeOverlay();
      document.removeEventListener('keydown', handleKey);
    }
  };
  document.addEventListener('keydown', handleKey);
}

// =================== RESULT CARD ===================
function displayResultCard(resultObj, index) {
  const container = document.getElementById('resultsArea');
  if (!container) return;

  const { planName, timestamp, selectedCombos, finalInventory, reserveUsage, itemWidths } = resultObj;
  const maxPcs = Math.max(...selectedCombos.map(c => c.combo.length), 1);
  const totalRemain = finalInventory.reduce((sum, v) => sum + v, 0);
  const totalRows = selectedCombos.length;
  const totalSet = selectedCombos.reduce((sum, c) => sum + Math.round(c.repeat), 0);
  const totalReserve = reserveUsage ? reserveUsage.reduce((sum, r) => sum + r.count, 0) : 0;

  const cardId = `resultCard_${index}`;

  let comboRows = selectedCombos.map(c => {
    const comboCols = Array.from({ length: maxPcs }, (_, i) => `<td>${c.combo[i] ?? ''}</td>`).join('');
    return `<tr>${comboCols}<td class="col-repeat">${Math.round(c.repeat * 100) / 100}</td><td class="col-total">${c.total}</td></tr>`;
  }).join('');

  const sortedWidths = itemWidths ? [...itemWidths].sort((a, b) => a - b) : [];
  const invHeader = sortedWidths.map(w => `<th class="latin-num">${w}</th>`).join('');
  const invRow = sortedWidths.map(w => {
    const idx = itemWidths.indexOf(w);
    const val = idx >= 0 ? finalInventory[idx] : 0;
    const cls = val > 0 ? 'nonzero' : 'zero';
    return `<td class="${cls} latin-num">${val}</td>`;
  }).join('');
  const invTableHTML = `
    <table class="inventory-table">
      <thead><tr>${invHeader}</tr></thead>
      <tbody><tr>${invRow}</tr></tbody>
    </table>
  `;

  let reserveTableHTML = '';
  if (reserveUsage && reserveUsage.length > 0) {
    const sorted = [...reserveUsage].sort((a, b) => a.width - b.width);
    const resHeader = sorted.map(r => `<th class="latin-num">${r.width}</th>`).join('');
    const resData = sorted.map(r => `<td class="latin-num">${r.count}</td>`).join('');
    reserveTableHTML = `
      <h4 style="margin-top:18px; margin-bottom:8px;">استفاده از عرض‌های رزرو</h4>
      <table class="reserve-usage-table">
        <thead><tr>${resHeader}</tr></thead>
        <tbody><tr>${resData}</tr></tbody>
      </table>
    `;
  }

  const trashIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;
  const copyIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

  const section = document.createElement('div');
  section.id = cardId;
  section.className = 'glass';
   section.style.cssText = 'padding:20px; margin-bottom:30px; scroll-margin-top:120px;';
  section.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <h2 style="color:#3b82f6; font-size:1.2rem; margin:0;">
        ${planName} (${new Date(timestamp).toLocaleString('fa-IR')})
      </h2>
      <div style="display:flex; gap:10px;">
        <button onclick="copyResult(${index})" class="btn-delete-row" title="کپی اطلاعات">${copyIcon}</button>
        <button onclick="confirmDeleteResult(${index})" class="btn-delete-row" title="حذف این نتیجه">${trashIcon}</button>
      </div>
    </div>
    <p style="color:#aaa; font-size:0.9em;">موجودی باقی‌مانده کل: <span class="latin-num">${totalRemain}</span></p>
    <table>
      <thead><tr>${Array.from({ length: maxPcs }, (_, i) => `<th class="latin-num">${i + 1}</th>`).join('')}<th>Repeat</th><th>Total</th></tr></thead>
      <tbody>${comboRows}</tbody>
    </table>
    ${invTableHTML}
    ${reserveTableHTML}
  `;
  container.appendChild(section);
}

window.copyResult = function(index) {
  const res = state.resultsList[index];
  if (!res) return;
  const { selectedCombos } = res;
  const lines = [];
  selectedCombos.forEach(c => {
    const padded = [];
    for (let i = 0; i < 12; i++) {
      padded.push(c.combo[i] ?? '');
    }
    padded.push(Math.round(c.repeat * 100) / 100);
    lines.push(padded.join('\t'));
  });
  const text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(err => console.error(err));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    alert('اطلاعات کپی شد.');
  }
};

window.confirmDeleteResult = (index) => {
  window.showConfirm('آیا از حذف این نتیجه اطمینان دارید؟', () => deleteResult(index));
};

window.deleteResult = (index) => {
  state.resultsList.splice(index, 1);
  const area = document.getElementById('resultsArea');
  if (area) area.innerHTML = '';
  renderSummaryAndResults();
};

// =================== SUMMARY TABLE ===================
function renderSummaryAndResults() {
  const area = document.getElementById('resultsArea');
  if (!area) return;
  area.innerHTML = '';

  if (state.resultsList.length === 0) return;

  let summaryRows = state.resultsList.map((res, idx) => {
    const totalRemain = res.finalInventory.reduce((s, v) => s + v, 0);
    const totalRows = res.selectedCombos.length;
    const totalSet = res.selectedCombos.reduce((s, c) => s + Math.round(c.repeat), 0);
    const totalReserve = res.reserveUsage ? res.reserveUsage.reduce((s, r) => s + r.count, 0) : 0;
    const planLabel = `${res.planName} - ${new Date(res.timestamp).toLocaleString('fa-IR')}`;
    return `
      <tr class="summary-row" onclick="document.getElementById('resultCard_${idx}').scrollIntoView({ behavior: 'smooth' });" style="cursor:pointer;">
        <td>${planLabel}</td>
        <td class="latin-num">${totalRemain}</td>
        <td class="latin-num">${totalReserve}</td>
        <td class="latin-num">${totalRows}</td>
        <td class="latin-num">${totalSet}</td>
      </tr>
    `;
  }).join('');

  const summaryHTML = `
     <div class="glass" style="padding:20px; margin-bottom:30px; scroll-margin-top:120px;" id="summaryTable">
      <h2 style="color:#3b82f6; margin-bottom:16px;">خلاصه وضعیت طرح‌ها</h2>
      <table class="summary-table">
        <thead>
          <tr>
            <th>نام کامل طرح</th>
            <th>مجموع باقی‌مانده</th>
            <th>مجموع تعداد رزرو</th>
            <th>مجموع ردیف</th>
            <th>مجموع ست</th>
          </tr>
        </thead>
        <tbody>${summaryRows}</tbody>
      </table>
    </div>
  `;
  area.innerHTML = summaryHTML;

  state.resultsList.forEach((res, idx) => displayResultCard(res, idx));
}

// =================== OPTIMIZATION ===================
function runOptimization() {
  // جلوگیری از اجرای هم‌زمان
  if (state.isRunning) return;

  const error = validatePlans();
  if (error) { alert(error); return; }
  if (state.items.length === 0) { alert('حداقل یک قطعه وارد کنید.'); return; }

  if (state.resultsList.length > 0) {
    showClearOrAppendModal((choice) => {
      if (choice === 'clear') {
        state.resultsList = [];
        document.getElementById('resultsArea').innerHTML = '';
      }
      startCalculation();
    });
  } else {
    startCalculation();
  }
}

function startCalculation() {
  const validItems = state.items.filter(it => it.width && !isNaN(parseFloat(it.width)) && parseFloat(it.width) > 0);
  const widths = validItems.map(it => parseFloat(it.width));
  const weights = validItems.map(it => parseFloat(it.weight) || 0);
  const reservesArray = state.reserves.split('-').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));

  const p = state.params;
  const filmCoeff = p.filmType === 'pearl' ? 0.7 : 0.905;
  const factor = (filmCoeff * p.thickness * p.standardLength) / 1000000;

  state.isRunning = true;
  showLoadingPuzzle();

  const workerBlob = new Blob([WORKER_CODE], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(workerBlob));
  worker.onmessage = (e) => {
    const { type, planIndex, planName, result, error: errMsg } = e.data;
    if (type === 'plan_progress') {
      const plan = state.plans[planIndex];
      if (plan && result) {
        const timestamp = Date.now();

        const reserveUsageMap = new Map();
        reservesArray.forEach(r => reserveUsageMap.set(r, 0));

        result.selectedCombos.forEach(c => {
          const repeatCount = Math.round(c.repeat);
          c.combo.forEach(w => {
            if (reservesArray.includes(w)) {
              const prev = reserveUsageMap.get(w) || 0;
              reserveUsageMap.set(w, prev + repeatCount);
            }
          });
        });
        const reserveUsage = Array.from(reserveUsageMap.entries())
          .map(([width, count]) => ({ width, count }))
          .filter(r => r.count > 0);

        state.resultsList.push({
          planName: plan.name,
          timestamp,
          selectedCombos: result.selectedCombos,
          finalInventory: result.finalInventory,
          reserveUsage,
          itemWidths: widths.slice()
        });
        renderSummaryAndResults();
      }
    } else if (type === 'done') {
      state.isRunning = false;
      hideLoadingPuzzle();
      worker.terminate();
      document.getElementById('resultsArea')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  worker.onerror = (err) => {
    console.error(err);
    state.isRunning = false;
    hideLoadingPuzzle();
  };

  worker.postMessage({
    plans: state.plans,
    basePlan: state.basePlan,
    baseParams: {
      widths,
      weights,
      reserves: reservesArray,
      lowerLimit: p.lowerLimit,
      upperLimit: p.upperLimit,
      maxPieces: p.maxArms,
      timeoutSeconds: p.maxTime,
      maxResults: 50,
      replacementLowerDecrease: p.maxTrim,
      factor: factor
    }
  });
}