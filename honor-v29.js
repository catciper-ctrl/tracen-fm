/* Repair pre-v30 missed historical inductees independently of the one-winner annual ballot. No rewards replay. */
(function(root){function install(E){
const oldResume=E.resume,oldNew=E.newGame;
E.reconcileHistoricalHonors=S=>{
 if(S.honorCriteriaVersion>=30)return [];
 const runners=E.recordRoomRunners(S),allAwards=[...(S.awards||[]).flatMap(c=>c.items||[]),...runners.flatMap(u=>u.awards||[]),...(S.teams||[]).flatMap(t=>t.awards||[])],honoredIds=new Set(allAwards.filter(a=>a.key==='honor').map(a=>a.runner)),byYear=new Map(),added=[];
 for(const u of runners){
  if(!u.retired||u.released||honoredIds.has(u.id)||!E.outfits.has(u.outfit)||!S.teams[u.team])continue;
  // Older NPC rollover stored January's timestamp but the completed career year separately.
  const year=Number.isInteger(u.retiredYear)?2026+u.retiredYear:Number.isInteger(u.retiredAt)?2027+Math.floor(u.retiredAt/24):null;
  if(year===null||year<2027||year>E.calendarYear(S)||year===E.calendarYear(S)&&!(S.awardYears||[]).includes(year))continue;
  const candidate={...u,retiredAt:(year-2027)*24+23,retirementKind:u.retirementKind??(u.team>0?'automatic':null)};
  if(!E.honorEligibility(S,candidate,year).eligible)continue;
  if(!byYear.has(year))byYear.set(year,[]);byYear.get(year).push(u);
 }
 for(const [year,pool] of [...byYear].sort((a,b)=>a[0]-b[0])){
  for(const u of pool.sort(E.honorCandidateCompare)){const award={year,key:'honor',title:'현창 우마무스메',runner:u.id,name:E.o(u).characterKo,outfit:u.outfit,team:u.team,prize:0,skillPoints:0,fans:0,record:{g1:u.g1wins,wins:u.wins,starts:u.starts},historicalReassessment:true};
  Object.assign(award,E.awardProfile(S,award));
  let ceremony=(S.awards||[]).find(c=>c.year===year);
  if(!ceremony){S.awards??=[];ceremony={year,items:[],seen:true,historicalReassessment:true};S.awards.push(ceremony)}
  ceremony.items.push(structuredClone(award));
  (S.teams[u.team].awards??=[]).push(structuredClone(award));
  const copies=[u,...S.runners,...Object.values(S.recordArchive||{}),...(S.hall||[]).map(h=>h.runner)].filter(v=>v?.id===u.id);
  for(const v of new Set(copies)){v.awards??=[];if(!v.awards.some(a=>a.key==='honor'&&a.year===year))v.awards.push(structuredClone(award));v.titles??=[];const name='JRA '+year+'년 현창 우마무스메';if(!v.titles.some(t=>t.name===name))v.titles.push({name,at:(year-2027)*24+23})}
  S.awardYears??=[];if(!S.awardYears.includes(year))S.awardYears.push(year);
  added.push(award);
  }
 }
 S.honorCriteriaVersion=30;return added;
};
E.resume=S=>{const state=oldResume(S);E.reconcileHistoricalHonors(state);return state};
E.newGame=(...args)=>{const state=oldNew(...args);state.honorCriteriaVersion=30;return state};
return E}root.UmaHonorV29={install};if(typeof module!=='undefined')module.exports={install}})(typeof window!=='undefined'?window:globalThis);
