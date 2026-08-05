// =================== ADMIN PANEL ===================
window.toggleAdminPanel = () => { state.showUserMenu = false; state.showAdmin = !state.showAdmin; renderApp(); };

function renderAdminPanel() {
  const dbConnected = state.sharedDBLoaded && state.sharedData;
  const users = getUsers();

  let rows = users.map(u => `
    <tr>
      <td><input type="text" value="${u.username}" onchange="updateUserField('${u.id}','username',this.value)" ${!dbConnected ? 'disabled' : ''}></td>
      <td><input type="password" value="${u.password}" onchange="updateUserField('${u.id}','password',this.value)" ${!dbConnected ? 'disabled' : ''}></td>
      <td><input type="text" value="${u.fullName}" onchange="updateUserField('${u.id}','fullName',this.value)" ${!dbConnected ? 'disabled' : ''}></td>
      <td><select onchange="updateUserField('${u.id}','role',this.value)" ${!dbConnected ? 'disabled' : ''}><option value="USER" ${u.role=='USER'?'selected':''}>کاربر</option><option value="ADMIN" ${u.role=='ADMIN'?'selected':''}>ادمین</option></select></td>
      <td><select onchange="updateUserField('${u.id}','gender',this.value)" ${!dbConnected ? 'disabled' : ''}><option value="male" ${u.gender=='male'?'selected':''}>آقا</option><option value="female" ${u.gender=='female'?'selected':''}>خانم</option></select></td>
      <td><input type="text" value="${u.position||''}" onchange="updateUserField('${u.id}','position',this.value)" ${!dbConnected ? 'disabled' : ''}></td>
      <td>${new Date(u.createdAt).toLocaleDateString('fa-IR')}</td>
      <td>${u.id !== state.currentUser.id && dbConnected ? `<button onclick="deleteUser('${u.id}')" class="btn-danger">حذف</button>` : ''}</td>
    </tr>`).join('');

  const addUserSection = dbConnected ? `
    <div style="margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <input type="text" id="newUsername" placeholder="نام کاربری" required>
      <input type="password" id="newPassword" placeholder="رمز عبور" required>
      <input type="text" id="newFullName" placeholder="نام کامل" required>
      <select id="newRole"><option value="USER">کاربر</option><option value="ADMIN">ادمین</option></select>
      <select id="newGender"><option value="male">آقا</option><option value="female">خانم</option></select>
      <input type="text" id="newPosition" placeholder="سمت">
      <button type="button" onclick="addUser()" class="btn-primary" style="grid-column:span 2;">افزودن کاربر</button>
    </div>
  ` : `
    <div style="margin-bottom:20px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px; text-align:center;">
      <p style="margin-bottom:10px;">برای مدیریت کاربران باید به پایگاه داده متصل شوید.</p>
      <button onclick="connectAndRefreshAdmin()" class="btn-primary">📁 اتصال به پایگاه داده</button>
    </div>
  `;

  return `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:100;display:flex;align-items:center;justify-content:center;">
      <div class="glass-dark" style="padding:30px;max-width:950px;width:95%;max-height:85vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
          <h2>مدیریت کاربران</h2>
          <button onclick="toggleAdminPanel()" class="btn-secondary">✕</button>
        </div>
        ${addUserSection}
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th>نام کاربری</th><th>رمز عبور</th><th>نام کامل</th><th>نقش</th><th>جنسیت</th><th>سمت</th><th>تاریخ</th><th>عملیات</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:20px; text-align:center; ${dbConnected ? '' : 'display:none'}">
          <button onclick="saveSharedDataToFile()" class="btn-secondary">💾 ذخیره فایل دیتابیس</button>
        </div>
      </div>
    </div>`;
}

window.connectAndRefreshAdmin = async function() {
  await window.openSharedDBIfAvailable();
  renderApp();
};

window.addUser = function() {
  if (!state.sharedData) {
    alert('اتصال به پایگاه داده قطع شده است. لطفاً ابتدا متصل شوید.');
    return;
  }
  const newUser = {
    id: Date.now().toString(),
    username: document.getElementById('newUsername').value,
    password: document.getElementById('newPassword').value,
    fullName: document.getElementById('newFullName').value,
    role: document.getElementById('newRole').value,
    gender: document.getElementById('newGender').value,
    position: document.getElementById('newPosition').value,
    createdAt: new Date().toISOString()
  };
  state.sharedData.users.push(newUser);
  scheduleSharedDBSave();
  renderApp();
};

window.updateUserField = (userId, field, value) => {
  if (!state.sharedData) return;
  const user = state.sharedData.users.find(u => u.id === userId);
  if (user) {
    user[field] = value;
    scheduleSharedDBSave();
  }
  if (state.currentUser && state.currentUser.id === userId) {
    state.currentUser[field] = value;
    localStorage.setItem('pantoast_current_user', JSON.stringify(state.currentUser));
  }
};

window.deleteUser = (userId) => {
  if (!state.sharedData) return;
  state.sharedData.users = state.sharedData.users.filter(u => u.id !== userId);
  scheduleSharedDBSave();
  renderApp();
};