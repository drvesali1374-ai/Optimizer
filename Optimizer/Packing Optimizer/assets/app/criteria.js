// =================== CRITERIA LIST ===================
function renderCriteriaListEditor(containerId, criteria) {
  let items = criteria.map((item, idx) => {
    const dirClass = item.dir === 'asc' ? 'asc' : 'desc';
    const arrowSymbol = item.dir === 'asc' ? '▲' : '▼';
    return `
      <li class="criteria-item" draggable="true" data-index="${idx}" data-container="${containerId}">
        <span>${FIELD_LABELS[item.field]}</span>
        <button class="dir-toggle active ${dirClass}" onclick="toggleCriteriaDir('${containerId}', ${idx})">${arrowSymbol}</button>
      </li>
    `;
  }).join('');
  return `
    <div class="criteria-editor" data-container="${containerId}">
      <p style="font-size:0.8em;color:#aaa;margin-bottom:4px;">اولویت‌بندی (کشیدنی):</p>
      <ul class="sortable-list" id="criteriaList_${containerId}">${items}</ul>
    </div>
  `;
}

// =================== CRITERIA DRAG & DROP ===================
function initCriteriaDragDrop() {
  document.querySelectorAll('.sortable-list').forEach(ul => {
    let dragSrcIndex = null;
    ul.addEventListener('dragstart', e => {
      const li = e.target.closest('li');
      if (!li) return;
      dragSrcIndex = parseInt(li.dataset.index);
      li.classList.add('dragging');
    });
    ul.addEventListener('dragover', e => e.preventDefault());
    ul.addEventListener('drop', e => {
      e.preventDefault();
      const target = e.target.closest('li');
      if (!target || dragSrcIndex === null) return;
      const containerId = target.dataset.container;
      const targetIndex = parseInt(target.dataset.index);
      const criteriaArray = getCriteriaArrayById(containerId);
      if (!criteriaArray) return;
      const newCriteria = [...criteriaArray];
      const [moved] = newCriteria.splice(dragSrcIndex, 1);
      newCriteria.splice(targetIndex, 0, moved);
      setCriteriaArrayById(containerId, newCriteria);
      dragSrcIndex = null;
      saveLocalSettings();
      renderApp();
    });
    ul.addEventListener('dragend', e => { if (e.target.tagName === 'LI') e.target.classList.remove('dragging'); });
  });
}

function getCriteriaArrayById(id) {
  if (id === 'base') return state.basePlan.criteria;
  const parts = id.split('_');
  if (parts[0] === 'row') {
    const plan = state.plans.find(p => p.id === parts[1]);
    const row = plan?.rows.find(r => r.step === parseInt(parts[2]));
    return row?.criteria;
  }
  return null;
}

function setCriteriaArrayById(id, newArr) {
  if (id === 'base') { state.basePlan.criteria = newArr; return; }
  const parts = id.split('_');
  if (parts[0] === 'row') {
    const plan = state.plans.find(p => p.id === parts[1]);
    const row = plan?.rows.find(r => r.step === parseInt(parts[2]));
    if (row) row.criteria = newArr;
  }
}

window.toggleCriteriaDir = (containerId, idx) => {
  const arr = getCriteriaArrayById(containerId);
  if (arr) { arr[idx].dir = arr[idx].dir === 'asc' ? 'desc' : 'asc'; saveLocalSettings(); renderApp(); }
};