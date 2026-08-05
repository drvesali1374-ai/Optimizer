// =================== APP INITIALIZATION ===================
async function initApp() {
  try {
    const local = await LocalDB.getLocalSettings();
    if (local) {
      state.items = local.items || [];
      state.reserves = local.reserves || '';
      state.params = { ...state.params, ...local.params };
      state.basePlan = local.basePlan || state.basePlan;
      state.plans = local.plans || [];
      state.theme = local.theme || 'dark';
      state.currentPlanPage = local.currentPlanPage || 0;
    } else {
      state.items = [
        { width: 1200, weight: 500 },
        { width: 1000, weight: 420 },
        { width: 800, weight: 300 },
        { width: 600, weight: 200 }
      ];
      state.reserves = '900,700';
      await saveLocalSettings();   // اگر ذخیره نشد مهم نیست
    }
  } catch (err) {
    console.warn('خطا در بارگذاری تنظیمات محلی:', err);
    // در صورت خطا از مقادیر پیش‌فرض استفاده کن
    state.items = [
      { width: 1200, weight: 500 },
      { width: 1000, weight: 420 },
      { width: 800, weight: 300 },
      { width: 600, weight: 200 }
    ];
    state.reserves = '900,700';
    state.theme = 'dark';
  }

  applyTheme();

  try {
    await tryAutoConnect();        // ممکن است شکست بخورد – مشکلی نیست
  } catch (e) {
    console.warn('اتصال خودکار به پایگاه داده ممکن نشد:', e);
  }

  renderApp();  // همیشه رندر می‌شود
}

function renderApp() {
  const app = document.getElementById('app');
  if (!state.dbConnected) {
    app.innerHTML = renderConnectScreen();
    document.getElementById('connectBtn')?.addEventListener('click', handleConnect);
  } else if (!state.currentUser) {
    app.innerHTML = renderLogin();
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  } else {
    app.innerHTML = renderMainLayout();
    bindMainEvents();
    initCriteriaDragDrop();
    renderSummaryAndResults();
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-profile')) {
        state.showUserMenu = false;
        const dd = document.getElementById('userDropdown');
        if (dd) dd.classList.remove('show');
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(ov => ov.remove());
      }
    });
  }
}

// =================== START ===================
initApp();