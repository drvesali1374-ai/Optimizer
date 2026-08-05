// =================== UTILITY FUNCTIONS ===================
function checkDuplicates(widths) {
  const dup = [];
  const seen = {};
  widths.forEach(w => {
    if (seen[w]) { if (!dup.includes(w)) dup.push(w); }
    else seen[w] = true;
  });
  return dup;
}

function calcItemsStats(validItems) {
  const count = validItems.length;
  const unique = new Set(validItems.map(it => it.width)).size;
  const totalWeight = validItems.reduce((sum, it) => sum + (parseFloat(it.weight) || 0), 0);
  return { count, uniqueCount: unique, totalWeight };
}

function formatNumber(num) {
  const n = Math.round(num);
  return n.toLocaleString('en-US').replace(/,/g, '.');
}

function applyTheme() {
  document.body.className = state.theme === 'light' ? 'light-theme' : '';
}