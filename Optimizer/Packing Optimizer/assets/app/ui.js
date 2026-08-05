// =================== MAIN UI ===================
function renderMainLayout() {
  const isAdmin = state.currentUser.role === 'ADMIN';
  const user = state.currentUser;
  const profileImg = user.gender === 'female' ? 'female.png' : 'male.png';
  return `
    <div style="max-width:1400px;margin:0 auto;">
      <div class="main-header glass" style="padding:20px;margin-bottom:25px;display:flex;justify-content:space-between;align-items:center; position:sticky; top:0; z-index:500;">
        <!-- پروفایل سمت راست -->
        <div class="user-profile" id="userProfile" onclick="toggleUserMenu(event)">
          <img src="${profileImg}" class="profile-img">
          <div class="user-info" style="display:flex; flex-direction:column;">
            <span class="user-name">${user.fullName}</span>
            <span class="user-role">${user.position||''}</span>
          </div>
        </div>
        <!-- نام پروژه + دکمه شروع محاسبه + انیمیشن مینیاتوری -->
        <div style="display:flex; align-items:center; gap:20px;">
          <h1 style="color:#3b82f6;font-size:1.8rem; margin:0;">بهینه‌ساز هوشمند</h1>
          <div style="display:flex; align-items:center; gap:10px;">
            <button id="runBtn" class="btn-primary" style="font-size:1rem; padding:10px 24px;">شروع محاسبه</button>
            <span id="headerLoading"></span>
          </div>
        </div>
      </div>

      ${state.showAdmin ? renderAdminPanel() : ''}
      ${state.showEditProfile ? renderEditProfile() : ''}

      <div class="layout">
        <div style="display:flex;flex-direction:column;gap:20px;">
          ${renderItemsTable()}
          ${renderReserveInput()}
        </div>
        <div style="display:flex;flex-direction:column;gap:20px;">
          ${renderParams()}
          ${renderCalculationPlans()}
        </div>
      </div>

      <p id="progressText" style="text-align:center; margin-top:15px; color:#aaa;"></p>
      <div id="resultsArea"></div>

      <!-- دکمه شناور اسکرول به بالا (حالا در سمت راست) -->
      <div class="scroll-to-top" onclick="scrollToTop()" title="برو بالا">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </div>
    </div>
  `;
}

// =================== USER MENU (fixed position) ===================
window.toggleUserMenu = function(event) {
  event.stopPropagation();
  const existing = document.getElementById('userDropdownFixed');
  if (existing) {
    existing.remove();
    state.showUserMenu = false;
    return;
  }

  state.showUserMenu = true;
  const user = state.currentUser;
  const isAdmin = user.role === 'ADMIN';

  const menu = document.createElement('div');
  menu.id = 'userDropdownFixed';
  menu.className = 'user-dropdown-fixed';
  const editIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const adminIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  const themeIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
  const syncIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
  const logoutIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;

  menu.innerHTML = `
    <button onclick="editProfile(); removeFixedMenu();">${editIcon} ویرایش پروفایل</button>
    ${isAdmin ? `<button onclick="toggleAdminPanel(); removeFixedMenu();">${adminIcon} مدیریت کاربران</button>` : ''}
    <button onclick="toggleTheme(); removeFixedMenu();">${themeIcon} ${state.theme==='dark'?'☀️ روشن':'🌙 تیره'}</button>
    <button onclick="syncSharedDB(); removeFixedMenu();">${syncIcon} همگام‌سازی</button>
    <button onclick="logout(); removeFixedMenu();">${logoutIcon} خروج</button>
  `;

  const profileEl = document.getElementById('userProfile');
  if (profileEl) {
    const rect = profileEl.getBoundingClientRect();
    menu.style.top = rect.bottom + 8 + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
  }

  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener('click', closeFixedMenuOnClickOutside);
  }, 10);
};

function closeFixedMenuOnClickOutside(e) {
  const menu = document.getElementById('userDropdownFixed');
  const profile = document.getElementById('userProfile');
  if (menu && !menu.contains(e.target) && !profile.contains(e.target)) {
    removeFixedMenu();
  }
}

function removeFixedMenu() {
  const menu = document.getElementById('userDropdownFixed');
  if (menu) menu.remove();
  state.showUserMenu = false;
  document.removeEventListener('click', closeFixedMenuOnClickOutside);
}

// =================== SCROLL TO TOP (حالا راست) ===================
window.scrollToTop = function() {
  const summary = document.getElementById('summaryTable');
  if (summary) {
    summary.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// =================== ITEMS TABLE ===================
function renderItemsTable() {
  const validItems = state.items.filter(it => it.width && !isNaN(parseFloat(it.width)) && parseFloat(it.width) > 0);
  const widths = validItems.map(it => it.width);
  const duplicates = checkDuplicates(widths);
  const stats = calcItemsStats(validItems);

  let rows = state.items.map((item, idx) => {
    const isDup = duplicates.includes(item.width);
    return `
      <tr>
        <td style="width:40px;text-align:center;">
          <button onclick="removeItem(${idx})" class="btn-danger" style="font-size:0.8em;padding:4px 8px;" tabindex="-1">✕</button>
        </td>
        <td><input type="number" value="${item.width}" class="${isDup ? 'duplicate' : ''}" onchange="updateItem(${idx},'width',this.value)" id="width_${idx}"></td>
        <td><input type="number" value="${item.weight}" onchange="updateItem(${idx},'weight',this.value)" id="weight_${idx}"></td>
        <td style="width:40px;text-align:center;">
          <button onclick="addItemAt(${idx+1})" class="add-item-btn" tabindex="-1">+</button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="glass" style="padding:18px;">
      <h3 style="margin-bottom:12px;">قطعات (عرض / وزن)</h3>
      <div style="margin-bottom:10px;">
        <button onclick="showBulkImportModal()" class="btn-secondary">📥 ورود یکجای اطلاعات</button>
      </div>
      <table id="itemsTable">
        <thead><tr><th></th><th>عرض</th><th>وزن سفارش</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;" id="itemStatsRow">
        <div style="color:#aaa;font-size:0.9em;">
          تعداد کل: ${stats.count} | یکتا: ${stats.uniqueCount} | مجموع وزن: ${formatNumber(stats.totalWeight)}
        </div>
        <span id="mergeBtnWrapper">${duplicates.length > 0 ? `<button onclick="mergeDuplicates()" class="btn-danger">ادغام عرض‌های تکراری</button>` : ''}</span>
      </div>
      ${state.items.length === 0 ? '<button onclick="addItem()" class="btn-secondary" style="margin-top:10px;" tabindex="-1">+ افزودن قطعه</button>' : ''}
    </div>
  `;
}

function refreshItemsUI() {
  const validItems = state.items.filter(it => it.width && !isNaN(parseFloat(it.width)) && parseFloat(it.width) > 0);
  const widths = validItems.map(it => it.width);
  const duplicates = checkDuplicates(widths);
  const stats = calcItemsStats(validItems);

  const statsRow = document.getElementById('itemStatsRow');
  if (statsRow) {
    statsRow.innerHTML = `
      <div style="color:#aaa;font-size:0.9em;">
        تعداد کل: ${stats.count} | یکتا: ${stats.uniqueCount} | مجموع وزن: ${formatNumber(stats.totalWeight)}
      </div>
      <span id="mergeBtnWrapper">${duplicates.length > 0 ? `<button onclick="mergeDuplicates()" class="btn-danger">ادغام عرض‌های تکراری</button>` : ''}</span>
    `;
  }

  const rows = document.querySelectorAll('#itemsTable tbody tr');
  rows.forEach((row, idx) => {
    const item = state.items[idx];
    const isDup = item.width && duplicates.includes(item.width);
    const widthInput = row.querySelector('[id^="width"]');
    if (widthInput) widthInput.className = isDup ? 'duplicate' : '';
  });
}

function renderReserveInput() {
  return `
    <div class="glass" style="padding:18px;">
      <label style="display:block;margin-bottom:8px;">عرض‌های کمکی (با "-" از هم جدا شوند)</label>
      <input type="text" value="${state.reserves}" onchange="state.reserves=this.value;saveLocalSettings()">
    </div>
  `;
}

function renderParams() {
  const p = state.params;
  const isNonPearl = p.filmType === 'non-pearl';

  let presetOptions = '<option value="-1">-- انتخاب لیوت --</option>';
  const userId = state.currentUser?.id;
  if (state.sharedData && userId) {
    const presets = state.sharedData.userPresets?.[userId]?.params || [];
    presets.forEach((preset, idx) => {
      presetOptions += `<option value="${idx}">${preset.name}</option>`;
    });
  }

  return `
    <div class="glass" style="padding:18px;">
      <h3 style="margin-bottom:12px;">پارامترها</h3>
      <!-- مدیریت لیوت‌ها -->
      <div style="display:flex; gap:6px; align-items:center; margin-bottom:12px; flex-wrap:wrap;">
        <select id="paramPresetSelect" onchange="if(this.value!='-1') applyParamPreset(parseInt(this.value))" style="flex:1; min-width:140px;">
          ${presetOptions}
        </select>
        <button onclick="showDeleteParamPresetModal()" title="حذف لیوت" style="background:none; border:none; cursor:pointer; padding:4px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
        <button onclick="showEditParamPresetModal()" title="ویرایش لیوت" style="background:none; border:none; cursor:pointer; padding:4px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button onclick="saveParamPreset(prompt('نام لیوت جدید برای پارامترها:'))" class="btn-secondary" style="white-space:nowrap;">💾 ذخیره</button>
        <button onclick="exportParamPresets()" class="btn-secondary" style="white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="صدور لیوت‌ها">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          صدور
        </button>
        <button onclick="importParamPresets()" class="btn-secondary" style="white-space:nowrap; display:inline-flex; align-items:center; gap:4px;" title="وارد کردن لیوت‌ها">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          ورود
        </button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px; font-size:0.9em;">
        <label>جنس فیلم <select onchange="state.params.filmType=this.value;saveLocalSettings();renderApp();">
          <option value="non-pearl" ${isNonPearl?'selected':''}>غیر صدفی</option>
          <option value="pearl" ${!isNonPearl?'selected':''}>صدفی</option>
        </select></label>
        <label>ضخامت فیلم <input type="number" value="${p.thickness}" min="10" max="100" step="1" onchange="validateAndSet('thickness', this.value)"></label>
        <label>متراژ استاندارد <input type="number" value="${p.standardLength}" min="3000" max="50000" step="any" onchange="validateAndSet('standardLength', this.value)"></label>
        <label>حداقل طول <input type="number" value="${p.lowerLimit}" min="3000" max="10000" step="1" onchange="validateAndSet('lowerLimit', this.value)"></label>
        <label>حداکثر تریم مجاز <input type="number" value="${p.maxTrim}" min="0" max="8000" step="1" onchange="validateAndSet('maxTrim', this.value)"></label>
        <label>حداکثر طول <input type="number" value="${p.upperLimit}" min="3000" max="10000" step="1" onchange="validateAndSet('upperLimit', this.value)"></label>
        <label>حداکثر زمان جستجو <input type="number" value="${p.maxTime}" min="5" max="100" step="1" onchange="validateAndSet('maxTime', this.value)"></label>
        <label>حداکثر بازو <input type="number" value="${p.maxArms}" min="1" max="50" step="1" onchange="validateAndSet('maxArms', this.value)"></label>
      </div>
    </div>
  `;
}

window.validateAndSet = function(field, value) {
  const v = parseFloat(value);
  if (isNaN(v)) return;
  const p = state.params;
  switch (field) {
    case 'thickness': if (v >= 10 && v <= 100) p.thickness = Math.floor(v); break;
    case 'standardLength': if (v >= 3000 && v <= 50000) p.standardLength = v; break;
    case 'lowerLimit': if (v >= 3000 && v <= 10000 && v < p.upperLimit) p.lowerLimit = Math.floor(v); break;
    case 'upperLimit': if (v >= 3000 && v <= 10000 && v > p.lowerLimit) p.upperLimit = Math.floor(v); break;
    case 'maxArms': if (v >= 1 && v <= 50) p.maxArms = Math.floor(v); break;
    case 'maxTrim': if (v >= 0 && v <= 8000) p.maxTrim = Math.floor(v); break;
    case 'maxTime': if (v >= 5 && v <= 100) p.maxTime = Math.floor(v); break;
  }
  saveLocalSettings();
  renderApp();
};

// =================== BULK IMPORT MODAL ===================
window.showBulkImportModal = function() {
  // بستن مودال قبلی
  const prev = document.querySelector('.modal-overlay');
  if (prev) prev.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="glass-dark" style="padding:25px; max-width:700px; width:90%; position:relative;">
      <button id="closeBulkModal" type="button" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#aaa; font-size:1.5rem; cursor:pointer;">&times;</button>
      <h3 style="margin-bottom:15px;">ورود یکجای اطلاعات قطعات</h3>
      <p style="font-size:0.9em; margin-bottom:10px; color:#ccc;">اطلاعات را از فایل یا متن خود کپی کرده و در کادر زیر بچسبانید. ستون‌های «عرض» و «مقدار سفارش» به صورت خودکار استخراج می‌شوند.</p>
      <textarea id="bulkTextarea" style="width:100%; height:250px; font-family: 'Calibri','Vazirmatn',sans-serif; font-size:0.85em; direction:rtl; text-align:right;" placeholder="متن خود را اینجا بچسبانید..."></textarea>
      <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:55px;">
        <button id="processBulkBtn" class="btn-primary">پردازش و جایگزینی</button>
        <button id="cancelBulkBtn" class="btn-secondary">انصراف</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function closeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.removeEventListener('keydown', handleKey);
  }

  const handleKey = function(e) {
    if (e.key === 'Escape') {
      closeOverlay();
    }
  };
  document.addEventListener('keydown', handleKey);

  overlay.querySelector('#closeBulkModal').onclick = closeOverlay;
  overlay.querySelector('#cancelBulkBtn').onclick = closeOverlay;

  overlay.querySelector('#processBulkBtn').onclick = () => {
    const raw = document.getElementById('bulkTextarea').value.trim();
    if (!raw) {
      alert('متنی وارد نشده است.');
      return;
    }
    const parsed = parseBulkItems(raw);
    if (parsed.length === 0) {
      alert('هیچ ردیف معتبری با عرض و وزن عددی یافت نشد.');
      return;
    }
    // جایگزینی کامل items
    state.items = parsed;
    saveLocalSettings();
    closeOverlay();
    renderApp(); // رفرش کامل
  };
};

/**
 * تحلیل متن ورودی و استخراج لیست {width, weight}
 * تنها ردیف‌هایی پذیرفته می‌شوند که حداقل دو ستون عددی معتبر (عرض>0، وزن>0) داشته باشند.
 */
function parseBulkItems(text) {
  const lines = text.split(/\r?\n/);
  const items = [];
  for (let line of lines) {
    line = line.trim();
    if (line.length === 0) continue; // خط خالی
    // جدا کردن با tab یا فاصله‌های متعدد (تطبیق با داده‌های تب‌دار)
    const tokens = line.split(/\t/);
    
    // حذف ستون‌های خالی دو طرف
    while (tokens.length && tokens[0] === '') tokens.shift();
    while (tokens.length && tokens[tokens.length-1] === '') tokens.pop();
    
    if (tokens.length < 2) continue;
    
    // سعی می‌کنیم یک عرض و یک وزن از میان توکن‌ها بیابیم.
    // الگوریتم: اولین عدد > 0 به عنوان عرض و دومین عدد > 0 به عنوان وزن در نظر گرفته شود.
    let width = null, weight = null;
    for (let tok of tokens) {
      const num = parseFloat(tok);
      if (!isNaN(num) && num > 0) {
        if (width === null) {
          width = num;
        } else if (weight === null) {
          weight = num;
          break;
        }
      }
    }
    if (width !== null && weight !== null) {
      items.push({ width: String(width), weight: String(weight) });
    }
  }
  return items;
}