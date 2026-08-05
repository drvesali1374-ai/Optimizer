var WORKER_CODE = `
const EPS = 1e-12;
function isOddByIntPart(x) {
  if (!Number.isFinite(x)) return false;
  const intPart = Math.floor(x + EPS);
  return Math.abs(intPart) % 2 === 1;
}
function nearestEven(x, tieRoundUp = true) {
  if (!Number.isFinite(x)) return 0;
  if (x <= 0) return 0;
  const f = 2 * Math.floor(x/2), c = 2 * Math.ceil(x/2);
  const df = Math.abs(x-f), dc = Math.abs(c-x);
  if (df < dc) return f; if (dc < df) return c;
  return tieRoundUp ? c : f;
}
function findAllCombinationsGivenItems(items, lMin, lMax, maxPieces, timeoutSec) {
  const n = items.length; if (n===0) return new Set();
  const widths = items.map(it=>it.width);
  const minW = Math.min(...widths), maxW = Math.max(...widths);
  let minCount = Math.ceil(lMin / maxW), maxCount = Math.min(Math.floor(lMax / minW), maxPieces);
  if (minCount<1) minCount=1; if (minCount>maxCount) return new Set();
  const res = new Set(), start = Date.now(); let iters=0;
  function dfs(idx, counts, sum, cnt) {
    iters++; if ((iters&1023)===0 && (Date.now()-start)/1000>timeoutSec) throw new Error('__TIMEOUT__');
    if (sum>lMax||cnt>maxCount) return;
    if (idx===n) {
      if (minCount<=cnt && cnt<=maxCount && lMin<=sum && sum<=lMax) {
        const expanded=[]; for(let i=0;i<items.length;i++){const c=counts[i]||0;for(let k=0;k<c;k++) expanded.push(items[i].width);}
        expanded.sort((a,b)=>a-b); res.add(JSON.stringify(expanded));
      }
      return;
    }
    const it=items[idx]; const w=it.width; const inv=it.inventory;
    const maxBySum=Math.floor((lMax-sum)/w), maxByPieces=maxCount-cnt;
    let maxCnt=Math.min(maxBySum,maxByPieces);
    if(inv===0) maxCnt=0;
    for(let c=0;c<=maxCnt;c++){
      const newSum=sum+c*w, newCnt=cnt+c;
      if(newSum>lMax) break;
      const need=Math.max(0,minCount-newCnt); if(newSum+need*minW>lMax) break;
      const rem=maxCount-newCnt; if(newSum+rem*maxW<lMin) continue;
      counts.push(c); dfs(idx+1,counts,newSum,newCnt); counts.pop();
    }
  }
  try{dfs(0,[],0,0);}catch(e){if(!e.message||e.message.indexOf('__TIMEOUT__')===-1) throw e;}
  return res;
}
function computeMetrics(resultsSet, invMap, ignoreZero) {
  const out=[];
  for(const cStr of resultsSet){
    const combo=JSON.parse(cStr);
    const total=combo.reduce((a,b)=>a+b,0);
    const cnts={}; combo.forEach(w=>cnts[w]=(cnts[w]||0)+1);
    const totalCount=Object.values(cnts).reduce((a,c)=>a+c,0);
    const uniqueCount=Object.keys(cnts).length;
    const repVals=[];
    for(const w in cnts){
      const n=Number(w); const cnt=cnts[w];
      const inv=invMap[n]||0;
      if(ignoreZero){if(inv>0) repVals.push(inv/cnt);}
      else repVals.push(inv===0?0:inv/cnt);
    }
    const repeat=repVals.length?Math.min(...repVals):0;
    out.push({combo,total,repeat,totalCount,uniqueCount,comboStr:combo.join(',')});
  }
  return out;
}

// تابع رتبه‌بندی و انتخاب بر اساس طرح
function selectComboByPlan(metrics, planPriority, selectedRank, fallbackPriority) {
  let priority = (planPriority && planPriority.length > 0) ? planPriority : fallbackPriority;
  
  metrics.sort((a,b)=>{
    for(let rule of priority){
      let va=a[rule.field], vb=b[rule.field];
      if(rule.field==='comboStr'){va=a.comboStr; vb=b.comboStr;}
      if(va!==vb) return rule.dir==='asc'?va-vb:vb-va;
    }
    return a.comboStr < b.comboStr ? -1 : a.comboStr > b.comboStr ? 1 : 0;
  });

  if (metrics.length === 0) return null;

  const firstField = priority[0].field;
  const firstDir = priority[0].dir;
  const values = metrics.map(m => m[firstField]);
  
  let ranks = [];
  if (firstDir === 'desc') {
    let currentRank = 1;
    let lastVal = values[0];
    ranks.push(1);
    for (let i = 1; i < metrics.length; i++) {
      if (values[i] !== lastVal) {
        currentRank = i + 1;
      }
      ranks.push(currentRank);
      lastVal = values[i];
    }
  } else {
    let currentRank = 1;
    let lastVal = values[0];
    ranks.push(1);
    for (let i = 1; i < metrics.length; i++) {
      if (values[i] !== lastVal) {
        currentRank = i + 1;
      }
      ranks.push(currentRank);
      lastVal = values[i];
    }
  }

  let filtered = [];
  for (let i = 0; i < metrics.length; i++) {
    if (ranks[i] >= selectedRank) {
      filtered.push(metrics[i]);
      if (filtered.length === 1) break;
    }
  }

  if (filtered.length === 0) return metrics[0];
  return filtered[0];
}

function positiveWInfoNumArray(invArr, widths){ return widths.filter((w,i)=>(invArr[i]||0)>0);}
function resetSmallRemnants(inv, widths, originalDemands){
  for(let i=0;i<widths.length;i++){
    const orig=originalDemands[i]||0;
    if(orig>0&&inv[i]<orig&&(inv[i]/orig)<0.05) inv[i]=0;
  }
}

function runGreedyWithPlan(plan, basePlan, widths, weights, reserves, lowerLimit, upperLimit, maxPieces, timeoutSeconds, maxResults, replacementLowerDecrease, factor) {
  const planMap = new Map();
  if (plan && plan.rows) {
    for (let row of plan.rows) {
      planMap.set(row.step, { priority: row.criteria, selectedRank: row.selectedRank });
    }
  }
  const basePriority = basePlan.criteria;
  const baseSelectedRank = basePlan.selectedRank;

  const demands=[], originalDemands=[];
  for(let i=0;i<widths.length;i++){
    const w=widths[i],wt=weights[i];
    if(w===null||isNaN(w)||w===0||wt===null||isNaN(wt)){demands.push(0);originalDemands.push(0);continue;}
    const val=wt/(w*factor);
    if(!Number.isFinite(val)){demands.push(0);originalDemands.push(0);continue;}
    const intVal=Math.floor(val+EPS);
    let frac=val-intVal; frac=Math.abs(frac)<EPS?0:frac;
    let demand;
    if(isOddByIntPart(val)) demand=intVal+1;
    else if(frac<0.5-EPS) demand=intVal;
    else demand=intVal<6?intVal:intVal+2;
    demand=Math.max(0,Math.floor(demand));
    demands.push(demand); originalDemands.push(demand);
  }
  let inventory=[...demands];
  const selectedCombos=[];
  const widthToIndex={};
  for(let i=0;i<widths.length;i++) if(widths[i]!==null&&!isNaN(widths[i])) widthToIndex[widths[i]]=i;

  let stepCounter = 1;
  while(true){
    const pairs=widths.map((w,i)=>[w,inventory[i]]); pairs.sort((a,b)=>b[0]-a[0]);
    const widthsSorted=pairs.map(p=>p[0]), inventorySorted=pairs.map(p=>p[1]);
    if(inventorySorted.every(v=>v===0)) break;
    const itemsForSearch=[];
    for(let i=0;i<widthsSorted.length;i++) itemsForSearch.push({width:widthsSorted[i],inventory:inventorySorted[i]||0});
    let resultsSet;
    try{resultsSet=findAllCombinationsGivenItems(itemsForSearch,lowerLimit,upperLimit,maxPieces,timeoutSeconds);}
    catch(e){resultsSet=new Set();}
    if(!resultsSet||resultsSet.size===0) break;
    const invMap={}; widthsSorted.forEach((w,i)=>{invMap[w]=inventorySorted[i]||0;});
    let metrics=computeMetrics(resultsSet,invMap,true);

    let planRow = planMap.get(stepCounter);
    let priority = planRow ? planRow.priority : basePriority;
    let selectedRank = planRow ? planRow.selectedRank : baseSelectedRank;

    const top = selectComboByPlan(metrics, priority, selectedRank, basePriority);
    if (!top) break;

    const selectedCombo = [...top.combo];
    const selectedRepeat = top.repeat;
    const selCount = top.totalCount;
    const selUnique = top.uniqueCount;

    const cntsInSel={}; selectedCombo.forEach(w=>cntsInSel[w]=(cntsInSel[w]||0)+1);
    const repeatEven = nearestEven(selectedRepeat, true);
    if (repeatEven < 1) {
      break;
    }

    const invBefore=[...inventory];
    const invCopy=[...invBefore];
    for(const wStr in cntsInSel){
      const cnt=cntsInSel[wStr]; const num=Number(wStr);
      if(widthToIndex.hasOwnProperty(num)){
        const idx=widthToIndex[num];
        invCopy[idx]=Math.max(0,(invCopy[idx]||0)-repeatEven*cnt);
      }
    }
    resetSmallRemnants(invCopy,widths,originalDemands);
    const positiveAfter=positiveWInfoNumArray(invCopy,widths);
    const doReplacement=(selectedRepeat<2)&&(positiveAfter.length>0)&&(reserves.length>0);
    if(doReplacement){
      const combinedSet={}; widths.forEach(w=>{if(w!==null&&!isNaN(w)) combinedSet[w]=true;});
      reserves.forEach(rv=>{if(rv!==null&&!isNaN(rv)) combinedSet[rv]=true;});
      const combinedNums=Object.keys(combinedSet).map(Number).sort((a,b)=>b-a);
      const itemsForComb=combinedNums.map(num=>{
        const idx=widthToIndex.hasOwnProperty(num)?widthToIndex[num]:-1;
        let invVal=idx>=0?(invBefore[idx]||0):0;
        if(reserves.includes(num)) invVal=Math.floor(upperLimit/num)+maxPieces;
        return {width:num,inventory:invVal};
      });
      const branchLower=Math.max(0,lowerLimit-replacementLowerDecrease);
      let combResSet;
      try{combResSet=findAllCombinationsGivenItems(itemsForComb,branchLower,upperLimit,maxPieces,timeoutSeconds);}
      catch(e){combResSet=new Set();}
      if(combResSet&&combResSet.size>0){
        const invMapComb={}; itemsForComb.forEach(it=>invMapComb[it.width]=it.inventory);
        let combMetrics=computeMetrics(combResSet,invMapComb,true);
        const posSet=new Set(positiveAfter);
        const enriched=combMetrics.map(cand=>{
          const cnts={}; cand.combo.forEach(n=>cnts[n]=(cnts[n]||0)+1);
          let variety=0; for(const k in cnts){if(posSet.has(Number(k))) variety++;}
          let maxRepeatVal=0;
          for(const k in cnts){
            const num=Number(k);
            if(posSet.has(num)){
              const idx=widthToIndex.hasOwnProperty(num)?widthToIndex[num]:-1;
              const rem=idx>=0?(invBefore[idx]||0):0;
              const ratio=cnts[k]>0?rem/cnts[k]:0;
              if(ratio>maxRepeatVal) maxRepeatVal=ratio;
            }
          }
          return {cand,cnts,variety,MaxRepeat:maxRepeatVal};
        });
        enriched.sort((a,b)=>{
          if(b.variety!==a.variety)return b.variety-a.variety;
          if(a.MaxRepeat!==b.MaxRepeat)return a.MaxRepeat-b.MaxRepeat;
          if(b.cand.total!==a.cand.total)return b.cand.total-a.cand.total;
          if(b.cand.repeat!==a.cand.repeat)return b.cand.repeat-a.cand.repeat;
          return 0;
        });
        const best=enriched[0]; if(best){
          const tempInv=[...invBefore];
          const bestCnts=best.cnts; const bmr=best.MaxRepeat;
          const brepEven=nearestEven(bmr,true);
          if (brepEven >= 1) {
            for(const k in bestCnts){
              const cntk=bestCnts[k]; const numk=Number(k);
              if(widthToIndex.hasOwnProperty(numk)){
                const idxk=widthToIndex[numk];
                tempInv[idxk]=Math.max(0,(tempInv[idxk]||0)-brepEven*cntk);
              }
            }
            resetSmallRemnants(tempInv,widths,originalDemands);
            inventory=tempInv;
            selectedCombos.push({combo:[...best.cand.combo],total:best.cand.total,repeat:bmr,count:best.cand.totalCount,unique:best.cand.uniqueCount});
            stepCounter++;
            continue;
          }
        }
      }
    }
    for(const lbl in cntsInSel){
      const cntlbl=cntsInSel[lbl]; const numlbl=Number(lbl);
      if(widthToIndex.hasOwnProperty(numlbl)){
        const idxlbl=widthToIndex[numlbl];
        inventory[idxlbl]=Math.max(0,(inventory[idxlbl]||0)-repeatEven*cntlbl);
      }
    }
    resetSmallRemnants(inventory,widths,originalDemands);
    selectedCombos.push({combo:[...selectedCombo],total:top.total,repeat:selectedRepeat,count:selCount,unique:selUnique});
    stepCounter++;
  }
  return {selectedCombos, finalInventory: inventory};
}

self.onmessage = function(e) {
  const { plans, basePlan, baseParams } = e.data;
  const factor = baseParams.factor || 0.362;
  const results = {};

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    try {
      const res = runGreedyWithPlan(plan, basePlan, baseParams.widths, baseParams.weights, baseParams.reserves, baseParams.lowerLimit, baseParams.upperLimit, baseParams.maxPieces, baseParams.timeoutSeconds, baseParams.maxResults, baseParams.replacementLowerDecrease, factor);
      results[plan.id] = res;
      self.postMessage({ type: 'plan_progress', planIndex: i, planName: plan.name, result: res });
    } catch (err) {
      self.postMessage({ type: 'plan_error', planIndex: i, planName: plan.name, error: err.message });
    }
  }
  self.postMessage({ type: 'done', results });
};
`;