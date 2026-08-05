// =================== ITEM CRUD ACTIONS ===================
window.addItem = () => { state.items.push({ width: '', weight: '' }); saveLocalSettings(); renderApp(); };
window.addItemAt = (index) => { state.items.splice(index, 0, { width: '', weight: '' }); saveLocalSettings(); renderApp(); };
window.removeItem = (idx) => { state.items.splice(idx, 1); saveLocalSettings(); renderApp(); };
window.updateItem = (idx, field, val) => { state.items[idx][field] = val; saveLocalSettings(); refreshItemsUI(); };
window.mergeDuplicates = () => {
  state.items = state.items.filter(item => item.width && !isNaN(parseFloat(item.width)) && parseFloat(item.width) > 0);
  const merged = {};
  state.items.forEach(item => { const w = parseFloat(item.width); const wt = parseFloat(item.weight) || 0; merged[w] = (merged[w] || 0) + wt; });
  state.items = Object.entries(merged).map(([w, wt]) => ({ width: w, weight: wt }));
  saveLocalSettings(); renderApp();
};