// =================== DATABASE CONNECTION ===================
async function tryAutoConnect() {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    await autoConnectViaHttp();
    return;
  }

  try {
    const result = await SharedDB.openSharedDB();
    if (result && result.handle) {
      if (result.handle.name && result.handle.name !== state.dbFileName) {
        console.warn('فایل ذخیره‌شده نامعتبر است.');
        await LocalDB.saveFileHandle(null);
        return;
      }
      state.sharedData = result.data;
      state.sharedDBLoaded = true;
      state.dbConnected = true;
      startAutoRefresh();
    }
  } catch (e) {}
}

async function autoConnectViaHttp() {
  try {
    const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const url = basePath + state.dbFolder + state.dbFileName;
    const response = await fetch(url);
    if (!response.ok) throw new Error('فایل یافت نشد');
    const data = await response.json();
    state.sharedData = data;
    state.sharedDBLoaded = true;
    state.dbConnected = true;
    startHttpAutoRefresh(url);
  } catch (e) {
    console.warn('بارگیری خودکار از HTTP ممکن نشد:', e);
  }
}

function startHttpAutoRefresh(url) {
  setInterval(async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const newData = await response.json();
      if (newData.version !== state.sharedData.version) {
        state.sharedData = newData;
        state.dbConnected = true;
        if (state.currentUser) {
          const stillExists = newData.users.find(u => u.id === state.currentUser.id);
          if (!stillExists) {
            state.currentUser = null;
            localStorage.removeItem('pantoast_current_user');
          } else {
            state.currentUser = stillExists;
          }
        }
        renderApp();
      }
    } catch (e) {}
  }, 10000);
}

function startAutoRefresh() {
  SharedDB.startAutoRefresh(10000, (newData, error) => {
    if (error) {
      state.dbConnected = false;
      state.sharedDBLoaded = false;
      renderApp();
      return;
    }
    state.sharedData = newData;
    state.dbConnected = true;
    if (state.currentUser) {
      const stillExists = newData.users.find(u => u.id === state.currentUser.id);
      if (!stillExists) {
        state.currentUser = null;
        localStorage.removeItem('pantoast_current_user');
      } else {
        state.currentUser = stillExists;
      }
    }
    renderApp();
  });
}

function renderConnectScreen() {
  let basePath = window.location.href;
  basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);
  const dbFolderPath = state.dbFolder;

  return `
    <div style="display:flex;justify-content:center;align-items:center;min-height:90vh; font-family:'Vazirmatn','BNazanin','Calibri',sans-serif;">
      <div class="glass" style="padding:40px;max-width:550px;width:100%;text-align:center;">
        <h2 style="color:#3b82f6;margin-bottom:20px;">اتصال به پایگاه داده</h2>
        <p style="color:#aaa;margin-bottom:20px;">
          برای ادامه، باید فایل <b>${state.dbFileName}</b> را انتخاب کنید.<br>
          مسیر پیشنهادی پوشهٔ فایل:
        </p>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:20px; justify-content:center;">
          <input type="text" id="suggestedPath" value="${dbFolderPath}" readonly
                 style="width:70%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.2); color:#ccc; border-radius:4px; font-family:'Calibri','Vazirmatn',sans-serif; direction:ltr;">
          <button onclick="copyPath()" class="btn-secondary" style="padding:8px 12px;">📋 کپی</button>
        </div>
        <button id="connectBtn" class="btn-primary" style="padding:14px 40px;font-size:1.1rem;">📁 انتخاب فایل دیتابیس</button>
        <p id="connectError" style="color:#f87171;margin-top:20px;"></p>
      </div>
    </div>
  `;
}

window.copyPath = function() {
  const input = document.getElementById('suggestedPath');
  if (!input) return;
  input.select();
  input.setSelectionRange(0, 99999);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(input.value).catch(() => { document.execCommand('copy'); });
    } else {
      document.execCommand('copy');
    }
  } catch (err) {}
};

async function handleConnect() {
  const errorEl = document.getElementById('connectError');
  errorEl.textContent = '';
  try {
    const result = await SharedDB.openSharedDB();
    if (!result || !result.handle) throw new Error('اتصال به فایل ممکن نشد.');
    if (result.handle.name !== state.dbFileName) {
      errorEl.textContent = `فایل انتخاب‌شده باید "${state.dbFileName}" باشد.`;
      return;
    }
    state.sharedData = result.data;
    state.sharedDBLoaded = true;
    state.dbConnected = true;
    startAutoRefresh();
    renderApp();
  } catch (err) {
    errorEl.textContent = err.name === 'AbortError' ? 'انتخاب فایل لغو شد.' : 'خطا: ' + err.message;
  }
}

// =================== تابع اصلی اتصال (با fallback) ===================
window.openSharedDBIfAvailable = async function() {
  if (state.sharedDBLoaded && state.sharedData) return true;

  if (window.showOpenFilePicker) {
    try {
      const result = await SharedDB.openSharedDB();
      state.sharedData = result.data;
      state.sharedDBLoaded = true;
      state.dbConnected = true;

      SharedDB.startAutoRefresh(10000, (newData, error) => {
        if (error) {
          state.dbConnected = false;
          state.sharedDBLoaded = false;
          renderApp();
          return;
        }
        state.sharedData = newData;
        state.dbConnected = true;
        const storedUser = localStorage.getItem('pantoast_current_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const stillExists = state.sharedData?.users?.find(u => u.id === user.id);
          if (!stillExists) {
            state.currentUser = null;
            localStorage.removeItem('pantoast_current_user');
          } else {
            state.currentUser = stillExists;
          }
        }
        renderApp();
      });

      alert('اتصال به پایگاه داده با موفقیت انجام شد.');
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
      alert(err.message || 'خطا در اتصال به پایگاه داده');
      return false;
    }
  }

  // fallback با <input type="file">
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
      const file = e.target.files[0];
      document.body.removeChild(input);
      if (!file) {
        resolve(false);
        return;
      }
      try {
        const text = await file.text();
        const decrypted = await decryptData(text.trim());
        state.sharedData = JSON.parse(decrypted);
        state.sharedDBLoaded = true;
        state.dbConnected = true;
        alert('فایل با موفقیت بارگذاری شد. (ذخیره‌سازی خودکار غیرفعال است – لطفاً بعد از تغییرات از دکمه «ذخیره فایل» استفاده کنید)');
        resolve(true);
      } catch (err) {
        alert('خطا در خواندن فایل: ' + err.message);
        resolve(false);
      }
    };

    input.click();
  });
};

// ذخیره دستی فایل (با رعایت نام فایل مرکزی)
window.saveSharedDataToFile = function() {
  if (!state.sharedData) {
    alert('داده‌ای برای ذخیره وجود ندارد.');
    return;
  }
  state.sharedData.version = (state.sharedData.version || 0) + 1;
  const plain = JSON.stringify(state.sharedData, null, 2);
  encryptData(plain).then(enc => {
    const blob = new Blob([enc], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.dbFileName;   // <-- از ثابت مرکزی استفاده می‌کند
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
};