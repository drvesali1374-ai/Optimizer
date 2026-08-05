// =================== AUTH & USER MANAGEMENT ===================
function getUsers() {
  if (state.sharedData && state.sharedData.users) return state.sharedData.users;
  return [{ id: '1', username: 'admin', password: 'admin123', fullName: 'مدیر سیستم', role: 'ADMIN', gender: 'male', position: 'مدیر', createdAt: new Date().toISOString() }];
}

function scheduleSharedDBSave() {
  if (state.sharedDBLoaded && state.sharedData) SharedDB.scheduleSave(() => state.sharedData, 2000);
}

async function saveLocalSettings() {
  await LocalDB.saveLocalSettings({
    items: state.items,
    reserves: state.reserves,
    params: state.params,
    basePlan: state.basePlan,
    plans: state.plans,
    theme: state.theme,
    currentPlanPage: state.currentPlanPage
  });
}

// =================== LOGIN PAGE ===================
function renderLogin() {
  return `
    <div style="display:flex;justify-content:center;align-items:center;min-height:90vh;">
      <div class="glass" style="padding:40px;max-width:400px;width:100%;">
        <h2 style="text-align:center;color:#3b82f6;margin-bottom:30px;">ورود به سیستم</h2>
        <form id="loginForm">
          <div style="margin-bottom:20px;"><label style="display:block;margin-bottom:8px;">نام کاربری</label><input type="text" id="username" required style="width:100%;padding:12px;"></div>
          <div style="margin-bottom:20px;"><label style="display:block;margin-bottom:8px;">رمز عبور</label><input type="password" id="password" required style="width:100%;padding:12px;"></div>
          <div id="loginError" style="color:#f87171;margin-bottom:15px;"></div>
          <button type="submit" class="btn-primary" style="width:100%;padding:12px;">ورود</button>
        </form>
        <div style="margin-top:20px; text-align:center;">
          <button onclick="connectBeforeLogin()" class="btn-secondary" style="width:100%; padding:10px;">
            📁 اتصال به پایگاه داده
          </button>
          <p style="margin-top:8px; font-size:0.8em; color:#888;" id="dbStatus">
            وضعیت اتصال: ${state.sharedDBLoaded ? 'متصل' : 'قطع'}
          </p>
        </div>
      </div>
    </div>
  `;
}

window.connectBeforeLogin = async function() {
  await window.openSharedDBIfAvailable();
  const statusEl = document.getElementById('dbStatus');
  if (statusEl) statusEl.textContent = 'وضعیت اتصال: ' + (state.sharedDBLoaded ? 'متصل' : 'قطع');
};

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const user = getUsers().find(u => u.username === username && u.password === password);
  if (user) {
    state.currentUser = user;
    localStorage.setItem('pantoast_current_user', JSON.stringify(user));
    if (user.role === 'ADMIN' && !state.sharedDBLoaded) {
      setTimeout(() => {
        alert('برای مدیریت کاربران لازم است پایگاه داده را متصل کنید. از دکمه‌ی همگام‌سازی استفاده کنید.');
      }, 300);
    }
    renderApp();
  } else {
    document.getElementById('loginError').textContent = 'نام کاربری یا رمز عبور اشتباه است';
  }
}

// =================== EDIT PROFILE ===================
function renderEditProfile() {
  const user = state.currentUser;
  const isAdmin = user.role === 'ADMIN';

  // برای کاربران عادی فقط username و password
  const baseFields = `
    <input type="text" id="editUsername" placeholder="نام کاربری" value="${user.username}">
    <input type="password" id="editPassword" placeholder="رمز عبور جدید">
  `;

  // برای ادمین فیلدهای کامل
  const extraFields = isAdmin ? `
    <input type="text" id="editFullName" placeholder="نام کامل" value="${user.fullName}">
    <select id="editGender">
      <option value="male" ${user.gender=='male'?'selected':''}>آقا</option>
      <option value="female" ${user.gender=='female'?'selected':''}>خانم</option>
    </select>
    <input type="text" id="editPosition" placeholder="سمت" value="${user.position||''}">
    <select id="editRole">
      <option value="USER" ${user.role=='USER'?'selected':''}>کاربر</option>
      <option value="ADMIN" ${user.role=='ADMIN'?'selected':''}>ادمین</option>
    </select>
  ` : '';

  return `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;display:flex;align-items:center;justify-content:center;">
      <div class="glass-dark" style="padding:30px;max-width:500px;width:90%;">
        <h3 style="margin-bottom:20px;">ویرایش پروفایل</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
          ${baseFields}
          ${extraFields}
        </div>
        <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
          <button onclick="saveProfile()" class="btn-primary">ذخیره</button>
          <button onclick="state.showEditProfile=false;renderApp();" class="btn-secondary">انصراف</button>
        </div>
      </div>
    </div>`;
}

window.saveProfile = () => {
  const user = state.currentUser;
  const isAdmin = user.role === 'ADMIN';

  // بررسی اتصال به پایگاه داده اشتراکی
  if (!state.sharedDBLoaded || !state.sharedData) {
    alert('برای ذخیرهٔ تغییرات باید به پایگاه داده متصل باشید. لطفاً از دکمهٔ همگام‌سازی استفاده کنید.');
    return;
  }

  // فیلدهای مشترک برای همه
  const newUsername = document.getElementById('editUsername').value;
  const newPassword = document.getElementById('editPassword').value;

  // به‌روزرسانی کاربر در sharedData
  const idx = state.sharedData.users.findIndex(u => u.id === user.id);
  if (idx === -1) {
    alert('کاربر در پایگاه داده یافت نشد.');
    return;
  }

  state.sharedData.users[idx].username = newUsername;
  if (newPassword) state.sharedData.users[idx].password = newPassword;

  // اگر ادمین است فیلدهای اضافی را نیز به‌روز کن
  if (isAdmin) {
    state.sharedData.users[idx].fullName = document.getElementById('editFullName').value;
    state.sharedData.users[idx].gender = document.getElementById('editGender').value;
    state.sharedData.users[idx].position = document.getElementById('editPosition').value;
    state.sharedData.users[idx].role = document.getElementById('editRole').value;
  }

  // ذخیره در فایل اشتراکی
  scheduleSharedDBSave();

  // به‌روزرسانی state.currentUser و localStorage با داده‌های جدید (مهم برای نمایش فوری)
  const updatedUser = state.sharedData.users[idx];
  state.currentUser = updatedUser;
  localStorage.setItem('pantoast_current_user', JSON.stringify(updatedUser));

  state.showEditProfile = false;
  renderApp();
};

window.editProfile = () => { state.showUserMenu = false; state.showEditProfile = true; renderApp(); };

// =================== MISC ACTIONS ===================
window.toggleTheme = () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; state.showUserMenu = false; applyTheme(); saveLocalSettings(); renderApp(); };
window.logout = () => { state.currentUser = null; localStorage.removeItem('pantoast_current_user'); renderApp(); };

window.syncSharedDB = async () => {
  state.showUserMenu = false;
  await window.openSharedDBIfAvailable();
  renderApp();
};