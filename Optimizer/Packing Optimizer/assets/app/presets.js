// =================== USER PRESETS ===================
function ensureUserPresets() {
  if (!state.sharedData) return;
  if (!state.sharedData.userPresets) state.sharedData.userPresets = {};
}

function getUserPresets(userId) {
  ensureUserPresets();
  if (!state.sharedData.userPresets[userId]) {
    state.sharedData.userPresets[userId] = { params: [], plans: [] };
  }
  return state.sharedData.userPresets[userId];
}

// ---------- پارامترها ----------
window.saveParamPreset = function(name) {
  if (!state.sharedData) {
    alert('پایگاه داده اشتراکی در دسترس نیست.');
    return;
  }
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId);
  if (presets.params.length >= 5) {
    alert('حداکثر ۵ لیوت برای پارامترها مجاز است.');
    return;
  }
  const presetData = JSON.parse(JSON.stringify(state.params));
  presets.params.push({ name: name || ('لیوت ' + (presets.params.length + 1)), data: presetData });
  scheduleSharedDBSave();
  renderApp();
};

window.applyParamPreset = function(index) {
  if (!state.sharedData) return;
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId);
  if (index >= 0 && index < presets.params.length) {
    state.params = JSON.parse(JSON.stringify(presets.params[index].data));
    saveLocalSettings();
    renderApp();
  }
};

window.showDeleteParamPresetModal = function() {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).params;
  if (presets.length === 0) {
    alert('هیچ لیوتی برای حذف وجود ندارد.');
    return;
  }

  const trashIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;

  let listHTML = presets.map((preset, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
      <span>${preset.name}</span>
      <button onclick="deleteParamPresetByIndex(${idx}); closeModal();" style="background:none; border:none; cursor:pointer;" title="حذف">${trashIcon}</button>
    </div>
  `).join('');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="glass-dark" style="padding:20px; max-width:400px; width:90%;">
      <h4 style="margin-bottom:15px;">حذف لیوت پارامترها</h4>
      <div style="max-height:300px; overflow-y:auto;">${listHTML}</div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary" style="margin-top:15px;">انصراف</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

window.deleteParamPresetByIndex = function(index) {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).params;
  if (index >= 0 && index < presets.length) {
    presets.splice(index, 1);
    scheduleSharedDBSave();
    renderApp();
  }
};

window.showEditParamPresetModal = function() {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).params;
  if (presets.length === 0) {
    alert('هیچ لیوتی برای ویرایش وجود ندارد.');
    return;
  }

  const editIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

  let listHTML = presets.map((preset, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
      <span>${preset.name}</span>
      <button onclick="updateParamPresetByIndex(${idx}); closeModal();" style="background:none; border:none; cursor:pointer;" title="ویرایش">${editIcon}</button>
    </div>
  `).join('');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="glass-dark" style="padding:20px; max-width:400px; width:90%;">
      <h4 style="margin-bottom:15px;">ویرایش لیوت پارامترها</h4>
      <p style="font-size:0.9em; margin-bottom:10px;">لیوت مورد نظر با مقادیر فعلی پارامترها جایگزین می‌شود.</p>
      <div style="max-height:300px; overflow-y:auto;">${listHTML}</div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary" style="margin-top:15px;">انصراف</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

window.updateParamPresetByIndex = function(index) {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).params;
  if (index >= 0 && index < presets.length) {
    presets[index].data = JSON.parse(JSON.stringify(state.params));
    scheduleSharedDBSave();
    renderApp();
  }
};

// ========== صدور و وارد کردن لیوت پارامترها ==========
window.exportParamPresets = function() {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).params;
  if (presets.length === 0) {
    alert('هیچ لیوتی برای صدور وجود ندارد.');
    return;
  }
  const exportData = presets.map(p => ({ name: p.name, data: p.data }));
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'param_presets.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

window.importParamPresets = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.onchange = (e) => {
    const file = e.target.files[0];
    document.body.removeChild(input);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const arr = JSON.parse(re.target.result);
        if (!Array.isArray(arr)) throw new Error('فرمت نامعتبر');
        // هر عضو باید name و data داشته باشد
        const userId = state.currentUser.id;
        const presets = getUserPresets(userId);
        const newList = [];
        for (let item of arr) {
          if (item.name && item.data && typeof item.data === 'object') {
            newList.push({ name: item.name, data: item.data });
          }
        }
        if (newList.length > 5) {
          alert('تعداد لیوت‌های وارد شده بیش از ۵ عدد است. فقط ۵ مورد اول ذخیره می‌شوند.');
          newList.splice(5);
        }
        presets.params = newList;
        scheduleSharedDBSave();
        renderApp();
        alert('لیوت‌های پارامترها با موفقیت وارد شدند.');
      } catch (err) {
        alert('خطا در خواندن فایل: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

// ---------- طرح‌ها ----------
window.savePlanPreset = function(name) {
  if (!state.sharedData) {
    alert('پایگاه داده اشتراکی در دسترس نیست.');
    return;
  }
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId);
  if (presets.plans.length >= 5) {
    alert('حداکثر ۵ لیوت برای طرح‌ها مجاز است.');
    return;
  }
  const presetData = {
    basePlan: JSON.parse(JSON.stringify(state.basePlan)),
    plans: JSON.parse(JSON.stringify(state.plans))
  };
  presets.plans.push({ name: name || ('لیوت ' + (presets.plans.length + 1)), data: presetData });
  scheduleSharedDBSave();
  renderApp();
};

window.applyPlanPreset = function(index) {
  if (!state.sharedData) return;
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId);
  if (index >= 0 && index < presets.plans.length) {
    const preset = presets.plans[index].data;
    state.basePlan = JSON.parse(JSON.stringify(preset.basePlan));
    state.plans = JSON.parse(JSON.stringify(preset.plans));
    state.currentPlanPage = 0;
    saveLocalSettings();
    renderApp();
  }
};

window.showDeletePlanPresetModal = function() {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).plans;
  if (presets.length === 0) {
    alert('هیچ لیوتی برای حذف وجود ندارد.');
    return;
  }

  const trashIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>`;

  let listHTML = presets.map((preset, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
      <span>${preset.name}</span>
      <button onclick="deletePlanPresetByIndex(${idx}); closeModal();" style="background:none; border:none; cursor:pointer;" title="حذف">${trashIcon}</button>
    </div>
  `).join('');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="glass-dark" style="padding:20px; max-width:400px; width:90%;">
      <h4 style="margin-bottom:15px;">حذف لیوت طرح‌ها</h4>
      <div style="max-height:300px; overflow-y:auto;">${listHTML}</div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary" style="margin-top:15px;">انصراف</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

window.deletePlanPresetByIndex = function(index) {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).plans;
  if (index >= 0 && index < presets.length) {
    presets.splice(index, 1);
    scheduleSharedDBSave();
    renderApp();
  }
};

window.showEditPlanPresetModal = function() {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).plans;
  if (presets.length === 0) {
    alert('هیچ لیوتی برای ویرایش وجود ندارد.');
    return;
  }

  const editIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

  let listHTML = presets.map((preset, idx) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1);">
      <span>${preset.name}</span>
      <button onclick="updatePlanPresetByIndex(${idx}); closeModal();" style="background:none; border:none; cursor:pointer;" title="ویرایش">${editIcon}</button>
    </div>
  `).join('');

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="glass-dark" style="padding:20px; max-width:400px; width:90%;">
      <h4 style="margin-bottom:15px;">ویرایش لیوت طرح‌ها</h4>
      <p style="font-size:0.9em; margin-bottom:10px;">لیوت مورد نظر با طرح‌های فعلی جایگزین می‌شود.</p>
      <div style="max-height:300px; overflow-y:auto;">${listHTML}</div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary" style="margin-top:15px;">انصراف</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

window.updatePlanPresetByIndex = function(index) {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).plans;
  if (index >= 0 && index < presets.length) {
    presets[index].data = {
      basePlan: JSON.parse(JSON.stringify(state.basePlan)),
      plans: JSON.parse(JSON.stringify(state.plans))
    };
    scheduleSharedDBSave();
    renderApp();
  }
};

// ========== صدور و وارد کردن لیوت طرح‌ها ==========
window.exportPlanPresets = function() {
  const userId = state.currentUser.id;
  const presets = getUserPresets(userId).plans;
  if (presets.length === 0) {
    alert('هیچ لیوتی برای صدور وجود ندارد.');
    return;
  }
  const exportData = presets.map(p => ({ name: p.name, data: p.data }));
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plan_presets.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

window.importPlanPresets = function() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.onchange = (e) => {
    const file = e.target.files[0];
    document.body.removeChild(input);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (re) => {
      try {
        const arr = JSON.parse(re.target.result);
        if (!Array.isArray(arr)) throw new Error('فرمت نامعتبر');
        const userId = state.currentUser.id;
        const presets = getUserPresets(userId);
        const newList = [];
        for (let item of arr) {
          if (item.name && item.data && typeof item.data === 'object') {
            newList.push({ name: item.name, data: item.data });
          }
        }
        if (newList.length > 5) {
          alert('تعداد لیوت‌های وارد شده بیش از ۵ عدد است. فقط ۵ مورد اول ذخیره می‌شوند.');
          newList.splice(5);
        }
        presets.plans = newList;
        scheduleSharedDBSave();
        renderApp();
        alert('لیوت‌های طرح‌ها با موفقیت وارد شدند.');
      } catch (err) {
        alert('خطا در خواندن فایل: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
};

window.closeModal = function() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
};