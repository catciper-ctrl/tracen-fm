/* Full-world ranch affiliations, persistent record identity and reversible memorial removal. */
(function(root){function install(E){
const old={newGame:E.newGame,resume:E.resume,makeRunner:E.makeRunner,sign:E.sign};
const farmNames=[
 '노던 레이크','와타나베','치바 샤다이','베르사이유','히다카 포레스트','오가와','선다운','아사히카와 힐스',
 '미나미노','브라이들 크릭','도카치 평원','후지모토','화이트펜스','시라카바','카시마','오션뷰',
 '나카무라','윈드밀','사쿠라가오카','카네코','웨스트필드','우라카와 하버','오쿠무라','애시우드',
 '유키노하라','마쓰다','그린패덕','니시하라','스톤브리지','오비히로','하세가와','메이플 그로브',
 '아오바','시마자키','오크 밸리','키타카미','호시노','페어웨이','고마가타케','이시카와',
 '레드윌로','미야자키 해안','가와무라','블루헤런','하코다테 곶','나가세','실버브룩','사토야마',
 '다카하시','브램블우드','기리시마','세키구치','폭스홀로','아키야마','레이븐힐','스즈카 고원',
 '우에다','허니메도','미카사','오노데라','크로스윈드','이즈미','하버리지','나카노'
];
function farmName(S,id){
 const used=new Set(S.teams.map(t=>t.name));
 for(let i=id-1;;i++){
  const areas=['하야키타','신히다카','무카와','니캇푸','비라토리','도마코마이'];
  const base=farmNames[i%farmNames.length];
  const region=i<farmNames.length?'':areas[Math.floor(i/farmNames.length-1)%areas.length]+' '+('동부 '.repeat(Math.floor((i-farmNames.length)/(farmNames.length*areas.length))));
  const name=region+base+' 학원';
  if(!used.has(name))return name;
 }
}
function addFarm(S){const id=S.teams.length,t={id,name:farmName(S,id),funds:180000,points:0,awards:[],fac:{training:3,medical:1,scout:1},external:false,archived:false};S.teams.push(t);return t}
function prepareFarms(S){while(S.teams.length<25)addFarm(S);S.teams[0].name=S.club;const seen=new Set([S.club]);for(const t of S.teams.slice(1)){if(!t.name||seen.has(t.name)||/JRA 외부 등록|\d|기록실/.test(t.name))t.name=farmName(S,t.id);seen.add(t.name);t.external=false;t.archived=false;t.awards??=[];t.fac??={training:3,medical:1,scout:1}}}
E.farmAffiliation=(S,u)=>{if(!u||u.mob)return null;const t=S.teams[u.team];if(t){u.farmAffiliation={team:t.id,name:t.name};return u.farmAffiliation}return u.farmAffiliation||null};
const themedFarms=[
 {key:'mejiro',name:'메지로 학원',theme:'메지로 가문',members:['메지로 라모누','메지로 아르당','메지로 파머','메지로 맥퀸','메지로 라이언','메지로 브라이트','메지로 도베르']},
 {key:'student-council',name:'학생회 학원',theme:'트레센 학생회',members:['심볼리 루돌프','에어 그루브','나리타 브라이언']}
];
function assignThemedFarms(S){
 if(S.pendingTurn)return;
 for(const spec of themedFarms){
  let farm=S.teams.find(t=>t.themeKey===spec.key);
  if(!farm){
   farm=addFarm(S);
   farm.themeKey=spec.key;
   farm.name=S.club===spec.name?spec.name+' (NPC)':spec.name;
   farm.theme=spec.theme;
  }
  const members=S.runners.filter(u=>u.team>0&&!u.mob&&!u.guest&&!u.retired&&spec.members.includes(E.o(u)?.characterKo));
  const current=new Set(E.team(S,farm.id).map(u=>u.id));
  for(const u of members){
   if(current.size>=4)break;
   if(current.has(u.id))continue;
   for(const h of u.history||[])h.team??=u.team;
   u.team=farm.id;
   current.add(u.id);
   E.farmAffiliation(S,u);
   if(!S.pendingTurn){S.raceFields={};S.g1SeasonPlan=null;}
  }
 }
}
E.normalizeFarms=S=>{prepareFarms(S);const counts=new Map(),migrating=S.farmsVersion!==21,legacy=migrating?S.externalRegistryTeam:null;for(const u of S.runners.filter(u=>!u.mob)){if(u.team===0){u.playerOwned=true;E.farmAffiliation(S,u);continue}let t=S.teams[u.team];if(!t||!u.retired&&(counts.get(t.id)||0)>=4){t=S.teams.slice(1).find(t=>!t.themeKey&&(counts.get(t.id)||0)<4)||addFarm(S);u.team=t.id}if(!u.retired)counts.set(t.id,(counts.get(t.id)||0)+1);E.farmAffiliation(S,u);if(legacy!=null)for(const h of u.history||[])if(h.team===legacy)h.team=u.team}for(const u of E.recordRoomRunners(S)){if(u.team===0)u.playerOwned=true;if(S.teams[u.team])E.farmAffiliation(S,u)}if(migrating&&!S.pendingTurn){S.raceFields={};S.activityPlannedAt=null;S.aiPlannedAt=null;S.g1SeasonPlan=null}assignThemedFarms(S);S.farmsVersion=21;return S};
E.enforceFarmCapacity=E.normalizeFarms;
E.makeRunner=(S,outfit,team=0,...args)=>{if(team>0){prepareFarms(S);if(!S.teams[team]||S.teams[team].themeKey||E.team(S,team).length>=4)team=(S.teams.slice(1).find(t=>!t.themeKey&&E.team(S,t.id).length<4)||addFarm(S)).id}const u=old.makeRunner(S,outfit,team,...args);if(team===0)u.playerOwned=true;return u};
E.wasPlayerOwned=u=>!!u&&(u.playerOwned||u.team===0||(u.history||[]).some(h=>h.team===0));
E.academyNeedsEnrollment=S=>S.turn===0&&E.own(S).some(u=>u.status==='undebuted');
E.factorSourceUsed=(u,f)=>!!u&&(u.usedFactors||[]).includes(f.source??f.outfit);
E.hideRetiredRunner=(S,id)=>{const u=S.runners.find(u=>u.id===id);if(!u||u.team!==0||!u.retired||u.released)return {error:'전당의 은퇴 우마무스메만 삭제할 수 있습니다.'};S.memorialHiddenIds??=[];if(S.memorialHiddenIds.includes(id))return {error:'이미 전당에서 삭제된 우마무스메입니다.'};S.recordArchive??={};S.recordArchive[id]=structuredClone(u);S.memorialHiddenIds.push(id);(S.memorialRemovalLog??=[]).unshift({runner:id,name:E.o(u).characterKo,at:E.abs(S),action:'hide'});return {ok:true,message:'전당에서 삭제했습니다. 인자와 기록실 데이터는 보존됩니다.'}};
E.restoreRetiredRunner=(S,id)=>{if(!(S.memorialHiddenIds||[]).includes(id))return {error:'삭제 기록을 확인하세요.'};S.memorialHiddenIds=S.memorialHiddenIds.filter(x=>x!==id);const u=E.recordRoomRunners(S).find(u=>u.id===id);(S.memorialRemovalLog??=[]).unshift({runner:id,name:u?E.o(u).characterKo:'우마무스메',at:E.abs(S),action:'restore'});return {ok:true,message:'전당 목록에 복원했습니다.'}};
E.farmRanking=(S,allTime=false)=>{const histories=new Map(S.teams.map(t=>[t.id,[]])),active=new Map();for(const u of E.recordRoomRunners(S)){if(!u.retired&&!u.mob)active.set(u.team,(active.get(u.team)||0)+1);for(const h of u.history||[])if(allTime||(h.year??2027+Math.floor(h.at/24))===E.calendarYear(S))histories.get(h.team??u.team)?.push(h)}return S.teams.map(team=>{const rows=histories.get(team.id),wins=rows.filter(h=>h.pos===1);return {team,points:Math.round(E.liveRating(rows)*10)/10,starts:rows.length,wins:wins.length,g1:wins.filter(h=>h.grade===100).length,g2:wins.filter(h=>h.grade===200).length,g3:wins.filter(h=>h.grade===300).length,prize:rows.reduce((n,h)=>n+(h.prize||0),0),active:active.get(team.id)||0}}).sort((a,b)=>b.points-a.points||b.g1-a.g1||b.wins-a.wins||a.team.id-b.team.id)};
E.sign=(S,...args)=>{const r=old.sign(S,...args);if(r.ok)for(const u of E.own(S))u.playerOwned=true;return r};
function init(S){S.memorialHiddenIds??=[];S.memorialRemovalLog??=[];E.normalizeFarms(S);return S}
E.planStartingFarms=(S,total)=>{
 for(const farm of S.teams.slice(1))if(!farm.themeKey)farm.name=farmName(S,farm.id);
 prepareFarms(S);
 const farms=S.teams.filter(t=>t.id>0&&!t.themeKey);
 while(farms.length*4<total)farms.push(addFarm(S));
 return Array.from({length:total},(_,index)=>farms[index%farms.length].id);
};
E.farmG1Contributors=(S,team,allTime)=>E.recordRoomRunners(S).flatMap(u=>{
 const wins=(u.history||[]).filter(h=>(h.team??u.team)===team&&h.grade===100&&h.pos===1
  &&(allTime||(h.year??2027+Math.floor(h.at/24))===E.calendarYear(S)));
 return wins.length?[{runner:u,wins}]:[];
}).sort((a,b)=>b.wins.length-a.wins.length);

function seedHistoricG1(S){
 S.recordArchive??={};
 S.g1Archive??=[];
 E.withRng(S,'ai',()=>{
  for(let year=2022;year<=2026;year++){
   const candidates=S.runners.filter(u=>u.team>0&&!u.mob&&!u.guest&&E.o(u));
   const past=new Map();
   const seen=new Set();
   for(let turn=0;turn<24;turn++)for(const race of E.racesAt(S,turn)){
    if(race.grade!==100||race.arc||seen.has(race.key))continue;
    seen.add(race.key);
    const pool=candidates.filter(u=>u.apt[race.terrain-1]>=5);
    if(!pool.length)continue;
    const source=E.pick(S,pool);
    let winner=past.get(source.id);
    if(!winner){
     winner={...structuredClone(source),id:S.nextId++,retired:true,status:'retired',history:[],titles:[],awards:[],starts:0,wins:0,g1wins:0};
     past.set(source.id,winner);
     S.recordArchive[winner.id]=winner;
    }
    const at=(year-2027)*24+turn;
    winner.history.unshift({at,year,team:winner.team,key:race.key,race:race.name,grade:100,pos:1,entries:race.entries,terrain:race.terrain,distance:race.distance});
    winner.starts++;winner.wins++;winner.g1wins++;
    S.g1Archive.push({id:S.nextId++,at,race:{...race},winner:{runner:winner.id,outfit:winner.outfit,team:winner.team,name:E.o(winner).characterKo},participants:[]});
   }
  }
 });
}
// Prefer the published historical result over independently seeded career wins.
function reconcileHistoricG1(S){
 const official=new Map(),seen=new Set();
 const raceKeys=new Map();
 for(let turn=0;turn<24;turn++)for(const race of E.racesAt(S,turn)){
  if(race.grade===100)raceKeys.set(race.name,race.key);
 }
 const key=(at,name,id)=>Math.floor(at/24)+'|'+(id??raceKeys.get(name)??name);
 for(const row of S.g1Archive||[]){
  if(row.at>=-120&&row.at<0&&row.race?.grade===100){
   official.set(key(row.at,row.race.name,row.race.key),row.winner.runner);
  }
 }
 const runners=E.recordRoomRunners(S).sort((a,b)=>a.id-b.id);
 for(const u of runners){
  u.history=(u.history||[]).filter(h=>{
   if(!(h.at>=-120&&h.at<0)||h.grade!==100||h.pos!==1)return true;
   const k=key(h.at,h.race,h.key);
   if(!seen.has(k)&&(!official.has(k)||official.get(k)===u.id)){
    seen.add(k);
    return true;
   }
   for(const stat of ['starts','wins','g1wins'])u[stat]=Math.max(0,(u[stat]||0)-1);
   u.points=Math.max(0,(u.points||0)-(h.points||0));
   if(h.stage){
    for(const bucket of [u.records?.[h.stage],u.yearRecords?.[h.year]?.data]){
     for(const discipline of ['all',E.discipline(h)]){
      const record=bucket?.[discipline];
      if(!record)continue;
      for(const stat of ['starts','wins','g1'])record[stat]=Math.max(0,record[stat]-1);
      record.points-=h.points||0;
      for(const field of ['titles','recent'])record[field]=(record[field]||[]).filter(r=>r.at!==h.at||r.race!==h.race);
     }
    }
   }
   return false;
  });
 }
}
E.newGame=(...args)=>{const S=init(old.newGame(...args));seedHistoricG1(S);reconcileHistoricG1(S);return S};
E.resume=S=>{S=init(old.resume(S));reconcileHistoricG1(S);return S};return E}
root.UmaFarmsV21={install};if(typeof module!=='undefined')module.exports={install}})(typeof window!=='undefined'?window:globalThis);
