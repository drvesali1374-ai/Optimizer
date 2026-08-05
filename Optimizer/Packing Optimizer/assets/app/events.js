// =================== EVENT BINDING ===================
window._mainEventsBound = false;

function bindMainEvents() {
  if (window._mainEventsBound) return;
  window._mainEventsBound = true;

  // Tab navigation via delegation
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    const target = e.target;
    if (!target.closest('#itemsTable input')) return;
    handleItemTab(e);
  });

  // run button via delegation
  document.addEventListener('click', function (e) {
    if (e.target.id === 'runBtn' || e.target.closest('#runBtn')) {
      e.stopPropagation();
      e.preventDefault();
      runOptimization();
    }
  });

  // دیگر نیازی به bind کردن addUserForm نیست
}

function handleItemTab(e) {
  if (window._addingRow) { e.preventDefault(); return; }

  const target = e.target;
  const row = target.closest('tr');
  if (!row) return;

  const rows = [...document.querySelectorAll('#itemsTable tbody tr')];
  const currentIndex = rows.indexOf(row);
  if (currentIndex === -1) return;

  const isWidth = target.id.startsWith('width');
  const idx = currentIndex;

  // ذخیره مقدار فعلی
  if (isWidth) {
    state.items[idx].width = target.value;
  } else {
    state.items[idx].weight = target.value;
  }
  saveLocalSettings();
  refreshItemsUI();

  if (isWidth) {
    e.preventDefault();
    const weightInput = row.querySelector('[id^="weight"]');
    if (weightInput) weightInput.focus();
  } else {
    if (currentIndex === rows.length - 1) {
      e.preventDefault();
      e.stopImmediatePropagation();
      window._addingRow = true;

      state.items.push({ width: '', weight: '' });
      saveLocalSettings();
      setTimeout(() => {
        window._addingRow = false;
        renderApp();
        setTimeout(() => {
          const newRow = document.querySelector('#itemsTable tbody tr:last-child');
          const newWidth = newRow?.querySelector('[id^="width"]');
          if (newWidth) newWidth.focus();
        }, 30);
      }, 0);
    }
  }
}