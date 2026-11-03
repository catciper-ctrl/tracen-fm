/* Full-world ranch affiliations, persistent record identity and reversible memorial removal. */
(function(root){function install(E){
const old={newGame:E.newGame,resume:E.resume,makeRunner:E.makeRunner,sign:E.sign};
const bases=['스피카','리길','카노푸스','시리우스','솔스티스','아스테르','루미에르','에클립스','크레센트','아르카디아','벨로체','노바','페가수스','아틀라스','세레네','미라지','폴라리스','플뢰르','오로라','라피스','아이리스','프리즘','스텔라','아카시아','로렐','올리브','릴리','클로버','아이비','루나','메이플','블룸'],prefixes=['로즈','에메랄드','크리스탈','라벤더','실버','골든','블루','화이트','루비','앰버','사파이어','제이드','코랄','오팔','벨벳','플래티넘'];
function farmName(S,id){const used=new Set(S.teams.map(t=>t.name));for(let i=id-1;;i++){const base=bases[i%bases.length],cycle=Math.floor(i/bases.length),name=(cycle?prefixes[(cycle-1)%prefixes.length]+' '+('별빛 '.repeat(Math.floor((cycle-1)/prefixes.length))):'')+base+' 목장';if(!used.has(name))return name}}
function addFarm(S){const id=S.teams.length,t={id,name:farmName(S,id),funds:180000,points:0,awards:[],fac:{training:3,medical:1,scout:1},external:false,archived:false};S.teams.push(t);return t}
function prepareFarms(S){while(S.teams.length<25)addFarm(S);S.teams[0].name=S.club;const seen=new Set([S.club]);for(const t of S.teams.slice(1)){if(!t.name||seen.has(t.name)||/JRA 외부 등록|\d|기록실/.test(t.name))t.name=farmName(S,t.id);seen.add(t.name);t.external=false;t.archived=false;t.awards??=[];t.fac??={training:3,medical:1,scout:1}}}
E.farmAffiliation=(S,u)=>{if(!u||u.mob)return null;const t=S.teams[u.team];if(t){u.farmAffiliation={team:t.id,name:t.name};return u.farmAffiliation}return u.farmAffiliation||null};
const themedFarms=[
 {key:'mejiro',name:'메지로 목장',theme:'메지로 가문',members:['메지로 라모누','메지로 아르당','메지로 파머','메지로 맥퀸','메지로 라이언','메지로 브라이트','메지로 도베르']},
 {key:'student-council',name:'학생회 목장',theme:'트레센 학생회',members:['심볼리 루돌프','에어 그루브','나리타 브라이언']}
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
function seedHistoricG1(S){
 S.recordArchive??={};
 S.g1Archive??=[];
 E.withRng(S,'ai',()=>{
  for(let year=2022;year<=2026;year++){
   const candidates=S.runners.filter(u=>u.team>0&&!u.mob&&!u.guest&&E.o(u));
   const past=new Map();
   const seen=new Set();
   for(let turn=0;turn<24;turn++)for(const race of E.racesAt(S,turn)){
    if(race.grade!==100||race.arc||seen.has(race.name))continue;
    seen.add(race.name);
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
    winner.history.unshift({at,year,team:winner.team,race:race.name,grade:100,pos:1,entries:race.entries,terrain:race.terrain,distance:race.distance});
    winner.starts++;winner.wins++;winner.g1wins++;
    S.g1Archive.push({id:S.nextId++,at,race:{...race},winner:{runner:winner.id,outfit:winner.outfit,team:winner.team,name:E.o(winner).characterKo},participants:[]});
   }
  }
 });
}
E.newGame=(...args)=>{const S=init(old.newGame(...args));seedHistoricG1(S);return S};E.resume=S=>init(old.resume(S));return E}
root.UmaFarmsV21={install};if(typeof module!=='undefined')module.exports={install}})(typeof window!=='undefined'?window:globalThis);
