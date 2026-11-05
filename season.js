/* Season systems: durable reservations, awards, cohort rivals and reward receipts. */
(function(root){'use strict';function install(E,db){
const removedSkill=202051;db.skills=db.skills.filter(s=>s.id!==removedSkill);E.skills.delete(removedSkill);for(const o of db.outfits)for(const key of ['nativeSkills','goldSkills','uniqueSkills'])if(o[key])o[key]=o[key].filter(id=>id!==removedSkill);for(const c of db.supports)c.skills=c.skills.filter(id=>id!==removedSkill);const allSkills=E.allSkills;E.allSkills=u=>allSkills(u).filter(id=>id!==removedSkill);
const old={newGame:E.newGame,resume:E.resume,populateWorld:E.populateWorld,advance:E.advance,finishTurn:E.finishTurn,applyResult:E.applyResult,value:E.value};
E.raceReadiness=(S,u,r)=>{const P=E.referencePhysics,raw=Array.from({length:5},(_,i)=>E.value(S,u,i)),v=P.stats(raw,[0,0,0,0,0],u.fitness??100,r.terrain,1,u.apt[6+u.style],E.courseFor(r).courseSetStatus||[]),base=P.base(r.distance),hp=P.hp(r.distance,v[1],u.style),fit=u.apt[E.distType(r)+2],max=P.maxSpurt(base,u.style,v[0],v[3],fit),varia=P.variation(v[4],.5),steps=120;let needed=0;for(let n=0;n<steps;n++){const m=(n+.5)/steps*r.distance,ph=m<r.distance/6?0:m<r.distance*2/3?1:2,speed=ph===2?max:P.normalTarget(base,ph,u.style,v[0],v[3],fit,varia);needed+=P.consume(base,speed,ph,v[3],r.terrain,1)*(r.distance/steps)/Math.max(1,speed)}return {hp:Math.round(hp),needed:Math.round(needed),margin:Math.round(hp-needed),ratio:Math.round(hp/Math.max(1,needed)*100),spurtSpeed:max,estimated:true}};
E.raceTickets=(r,pos)=>({100:[3,2,1],200:[2,1,1],300:[1]}[r.grade]?.[pos-1]||0);
E.skillPrice=(u,id)=>{const base=E.skills.get(id)?.cost??180,innate=new Set(E.o(u).nativeSkills.flatMap(k=>[k,...E.ancestors(k)]));let discount=0;if(!innate.has(id))for(const ref of u.supportCards||[]){const c=E.supports.get(ref.card);if(c?.skills.some(k=>k===id||E.ancestors(k).has(id)))discount=Math.max(discount,({SSR:30,SR:20,R:10}[c.rarity]||0))}return {base,discount,cost:Math.ceil(base*(100-discount)/100)}};
E.difficulty=(S,u)=>1.10*(E.age(S,u)<=2?1.20:1.07);
E.value=(S,u,i)=>{const v=old.value(S,u,i);return u.team>0||u.mob?Math.min(100,Math.max(1,Math.round(v*E.difficulty(S,u)))):v};
E.enforceFarmCapacity=S=>{for(const farm of S.teams.slice(1)){const active=S.runners.filter(u=>u.team===farm.id&&!u.retired);for(const u of active.slice(4)){let next=S.teams.slice(1).find(t=>S.runners.filter(v=>v.team===t.id&&!v.retired).length<4);if(!next){const id=S.teams.length;next={id,name:'트레센 제'+id+' 학원',funds:180000,points:0,awards:[],fac:{training:3,medical:1,scout:1}};S.teams.push(next)}u.team=next.id}}};
E.populateWorld=(S,...args)=>{const r=old.populateWorld(S,...args);E.enforceFarmCapacity(S);return r};
const cohort=(S,u)=>u.status==='undebuted'?S.year:u.debutYear;
E.nearbyRivals=(S,u)=>{const ranked=E.overallRanking(S),at=ranked.findIndex(x=>x.runner.id===u.id),eligible=v=>v.team>0&&v.id!==u.id&&cohort(S,v)===cohort(S,u);u.rivalIds=(u.rivalIds||[]).filter(id=>{const v=S.runners.find(x=>x.id===id);return v&&!v.retired&&eligible(v)});const candidates=ranked.map((x,i)=>({...x,rank:i+1,gap:Math.abs(i-at)})).filter(x=>eligible(x.runner)).sort((a,b)=>a.gap-b.gap||a.rank-b.rank);for(const x of candidates)if(u.rivalIds.length<6&&!u.rivalIds.includes(x.runner.id))u.rivalIds.push(x.runner.id);return u.rivalIds.map(id=>{const i=ranked.findIndex(x=>x.runner.id===id);return {...ranked[i],rank:i+1}})};
E.rivalSchedule=(S,u)=>{E.prepareRaceDay(S);const planned=Object.entries(S.g1SeasonPlan?.days||{}).flatMap(([t,races])=>Object.entries(races).filter(([,ids])=>ids.includes(u.id)).map(([key])=>({at:(S.year-1)*24+Number(t),race:E.racesAt(S,Number(t)).find(r=>r.key===key),planned:true}))).filter(x=>x.race&&x.at>=E.abs(S));if(u.entry){const race=E.racesAt(S).find(r=>r.key===u.entry);if(race&&!planned.some(x=>x.at===E.abs(S)&&x.race.key===race.key))planned.unshift({at:E.abs(S),race,planned:false})}return planned.sort((a,b)=>a.at-b.at).slice(0,6)};
E.projectRace=(S,u,r,at)=>{const future={...S,year:Math.floor(at/24)+1,turn:at%24},runner={...u};if(at>E.abs(S)){runner.injury=0;runner.medical=null;runner.recoveryUntil=0;runner.fitness=100;runner.entry=null;runner.activityAt=null}const q=E.raceEligibility(future,runner,r),fit=E.aptWarnings(runner,r);return {...q,ok:q.ok&&!fit.length,why:!q.ok?q.why:fit.length?'적성 C 이하: '+fit.join(', '):'출전 조건 · 적성 통과'}};
E.raceReservations=(S,u)=>(u.reservations||[]).filter(x=>x.at>=E.abs(S)&&Math.floor(x.at/24)===S.year-1);
E.dueRaceReservation=(S,u)=>u?.team===0&&u.activityAt!==E.abs(S)&&E.raceReservations(S,u).find(x=>x.at===E.abs(S));
E.reserve=(S,u,key,at)=>{
  if(S.pendingTurn||u?.team!==0||u.status!=='active'||u.retired)return {error:'현역 우마무스메만 예약할 수 있습니다.'};
  if(!Number.isInteger(at)||at<E.abs(S)||Math.floor(at/24)!==S.year-1)return {error:'올해 12월 후반까지 남은 경주를 선택하세요.'};
  if(at===E.abs(S)&&!E.canAct(S,u))return {error:'이번 턴 활동을 마쳤습니다.'};
  const race=E.racesAt(S,at%24).find(r=>r.key===key);
  if(!race)return {error:'경주가 없습니다.'};
  if(E.age(S,u)===1&&at%24===10&&!u.starts&&race.grade!==900)return {error:'6월 전반에는 신마전만 예약할 수 있습니다.'};
  const reservations=E.raceReservations(S,u);
  if(reservations.some(x=>x.at===at))return {error:'같은 턴에는 한 경주만 예약할 수 있습니다.'};
  u.reservations=[...reservations,{key,at,name:race.name}].sort((a,b)=>a.at-b.at);
  return {ok:true,message:race.name+' 예약 완료 · 출전 자격은 당일 확인합니다.'};
};
E.cancelReservation=(S,u,at)=>{
  if(S.pendingTurn||u?.team!==0)return {error:'현재 예약을 취소할 수 없습니다.'};
  u.reservations=E.raceReservations(S,u).filter(x=>x.at!==at);
  return {ok:true};
};
const newsAllowed=E.newsAllowed;E.newsAllowed=(S,a)=>a.achievement||newsAllowed(S,a);

E.titleGrade=title=>{
 if(/특별상|^GⅠ \d+승 우마무스메$/.test(title))return null;
 if(/현창|3관|트리플 티아라/.test(title))return 'SSR';
 if(/연도대표|최우수/.test(title))return 'SR';
 return / 우승$/.test(title)?'R':null;
};
E.grantTitle=(S,u,title,at=E.abs(S))=>{
 const grade=E.titleGrade(title);
 u.titles??=[];
 if(!grade||u.titles.some(t=>t.name===title))return;
 u.titles.push({name:title,at,grade});
 return title;
};
const triples=[['클래식 3관',['사츠키상','도쿄 우준 (일본 더비)','국화상'],'classic'],['트리플 티아라',['벚꽃상','오크스','추화상'],'classic'],['시니어 봄 3관',['오사카배','텐노상 (봄)','타카라즈카 기념'],'senior'],['시니어 가을 3관',['텐노상 (가을)','재팬컵','아리마 기념'],'senior']];
triples.push(...triples.slice(2).map(([title,races])=>[title.replace('시니어','클래식급'),races,'classic']));
E.tripleSeries=triples;
E.tripleRaceStage=h=>h.race?.endsWith(" · 클래식")?"classic":h.race?.endsWith(" · 시니어")?"senior":h.stage;
E.checkTitles=(S,u)=>{const added=[];for(const [title,names,stage] of triples){const years=[...new Set(u.history.filter(h=>E.tripleRaceStage(h)===stage&&h.pos===1&&h.grade===100).map(h=>h.year))];for(const year of years){const wins=u.history.filter(h=>E.tripleRaceStage(h)===stage&&h.year===year&&h.pos===1&&h.grade===100).map(h=>h.race.replace(/ · (클래식|시니어)$/,'').replace(/\s/g,''));if(names.every(n=>wins.includes(n.replace(/\s/g,'')))){const t=E.grantTitle(S,u,year+' '+title);if(t)added.push(t)}}}return added};
E.applyResult=(S,result)=>{const rivals=new Map(E.own(S).map(u=>[u.id,new Set(E.nearbyRivals(S,u).map(x=>x.runner.id))])),before=new Map(S.runners.map(u=>[u.id,u.sp]));const r=old.applyResult(S,result);for(const row of result.rows){const u=S.runners.find(u=>u.id===row.runner);if(!u)continue;const beaten=result.rows.filter(x=>rivals.get(u.id)?.has(x.runner)&&x.pos>row.pos),bonus=beaten.length*15;if(bonus){u.sp+=bonus;row.rewards.rivalPoints=bonus}if(row.rewards)row.rewards.skillPoints=u.sp-(before.get(u.id)||0);row.newTitles=E.checkTitles(S,u);const streak=u.history.findIndex(h=>h.pos!==1),wins=streak<0?u.history.length:streak;if(row.pos===1&&(wins>=3||row.newTitles.some(t=>t.includes('3관')||t.includes('티아라'))))E.publishArticle(S,{kind:'race',runner:u.id,team:u.team,race:structuredClone(result.race),result:result.id,achievement:true,title:E.o(u).characterKo+' · '+(wins>=3?wins+'연승 달성!':'3관 달성!'),text:row.newTitles.join(' · ')+' '+result.race.name+'에서 1착, '+u.starts+'전 '+u.wins+'승을 기록했다.'})}return r};
E.announceAwards=(S,year=E.calendarYear(S))=>{S.awardYears??=[];if(S.awardYears.includes(year))return null;S.awardYears.push(year);const eligible=S.runners.filter(u=>!u.guest&&!u.mob&&u.yearRecords?.[year]?.data.all.starts>0),items=[],cats=[['year','연도대표 우마무스메',null,'all'],['junior','최우수 주니어 우마무스메','junior','all'],['classic','최우수 클래식 우마무스메','classic','all'],['senior','최우수 시니어 우마무스메','senior','all'],['sprint','최우수 스프린터 우마무스메',null,'sprint'],['mile','최우수 마일 우마무스메',null,'mile'],['middle','최우수 중거리 우마무스메',null,'middle'],['long','최우수 장거리 우마무스메',null,'long'],['dirt','최우수 더트 우마무스메',null,'dirt']];
for(const [key,title,stage,disc] of cats){const rows=eligible.filter(u=>(!stage||u.yearRecords[year].stage===stage)&&u.yearRecords[year].data[disc]?.starts>0).sort((a,b)=>E.awardScore(b.yearRecords[year].data[disc])-E.awardScore(a.yearRecords[year].data[disc])||a.id-b.id),u=rows[0];if(!u)continue;const prize=key==='year'?100000:50000,skillPoints=key==='year'?150:80,fans=Math.min(E.fanCap-u.fans,key==='year'?5000:2500),a={year,key,title,runner:u.id,name:E.o(u).characterKo,outfit:u.outfit,team:u.team,record:structuredClone(u.yearRecords[year].data[disc]),prize,skillPoints,fans};u.awards.push(a);S.teams[u.team].awards??=[];S.teams[u.team].awards.push(structuredClone(a));u.sp+=skillPoints;if(!u.retired)u.fans+=fans;if(u.team===0)E.cash(S,prize,year+' JRA '+title);else S.teams[u.team].funds+=prize;E.grantTitle(S,u,'JRA '+year+'년 '+title);items.push(a);E.publishArticle(S,{kind:'awards',bulletin:true,titleGrade:E.titleGrade(title),runner:u.id,team:u.team,awardYear:year,title:year+' JRA '+title+' · '+a.name,text:S.teams[u.team].name+'의 '+a.name+' 수상! 상금 '+prize.toLocaleString()+'원 · 스킬 Pt +'+skillPoints+' · 팬 +'+fans})}
const ceremony={year,items};S.awards??=[];S.awards.unshift(ceremony);S.ceremonyPending=year;return ceremony};
E.finishTurn=S=>{const r=old.finishTurn(S);if(r.ok){S.financeHistory??=[];S.financeHistory.push({at:E.abs(S)-1,balance:S.funds,...S.lastReport.cashflow});S.financeHistory=S.financeHistory.slice(-240);E.enforceFarmCapacity(S)}return r};
function init(S){if(!S.financeHistory){let balance=S.funds;const byTurn=new Map();for(const l of S.ledger){const row=byTurn.get(l.at)||{at:l.at,balance,income:0,expense:0,net:0};row.income+=Math.max(0,l.amount);row.expense+=Math.max(0,-l.amount);row.net+=l.amount;byTurn.set(l.at,row);balance-=l.amount}S.financeHistory=[...byTurn.values()].sort((a,b)=>a.at-b.at);if(!S.financeHistory.length)S.financeHistory=[{at:E.abs(S),balance:S.funds,income:0,expense:0,net:0}]} for(const u of S.runners){for(const key of ['known','learned','equipped','innate','masteredSkills'])if(u[key])u[key]=u[key].filter(id=>id!==removedSkill);u.reservations??=[];E.checkTitles(S,u)}E.enforceFarmCapacity(S);S.seasonVersion=8;return S}
E.newGame=(...args)=>init(old.newGame(...args));E.resume=S=>init(old.resume(S));return E}
root.UmaSeason={install};if(typeof module!=='undefined')module.exports={install};})(typeof window!=='undefined'?window:globalThis);
