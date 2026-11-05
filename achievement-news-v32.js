/* Dedicated, idempotent achievement headlines, separate from routine race digests. */
(function(root){function install(E){
const old={applyResult:E.applyResult,flushBulletins:E.flushBulletins,announceAwards:E.announceAwards,resume:E.resume,newGame:E.newGame};
const clean=s=>String(s||'').replace(/\s*·\s*(클래식|시니어)$/,'').replace(/\s/g,''),yearOf=h=>h.year??2027+Math.floor(h.at/24),eligible=u=>u&&!u.mob&&!u.guest&&!u.released;
const milestones=[1,3,5,10,15,20,25,30,40,50],streakMark=n=>n===3||n===5||n>=10&&n%5===0;
const name=u=>E.o(u).characterKo,farm=(S,u)=>E.farmAffiliation(S,u)?.name||S.teams[u.team]?.name||'소속 학원';
const subject=u=>{const n=name(u),c=n.charCodeAt(n.length-1);return n+(c>=44032&&c<=55203&&(c-44032)%28?'이':'가')};
const priority={'봄·가을 6관':6,'삼관 달성':5,'JRA 현창':5,'JRA 연도대표':4,'통산 GⅠ 다승':2,'연승 기록':1};
const stage=(u,h)=>E.tripleRaceStage(h)||(h.age===1?'junior':h.age===2?'classic':h.age>=3?'senior':yearOf(h)-(2026+u.debutYear)+1===2?'classic':'senior');
E.sortAchievementNews=S=>S.news.sort((a,b)=>b.at-a.at||Number(!!b.majorAchievement)-Number(!!a.majorAchievement)||(priority[b.achievementLabel]||0)-(priority[a.achievementLabel]||0)||b.id-a.id);
function links(S,u,rows){return rows.flatMap(h=>{const r=S.results.find(r=>r.at===h.at&&clean(r.race.name)===clean(h.race)&&r.rows.some(x=>x.runner===u.id&&x.pos===1));return r?[{result:r.id,race:r.race.name}]:[]})}
E.publishAchievementNews=(S,a)=>{
 S.majorAchievementKeys??={};if(S.majorAchievementKeys[a.achievementKey]||S.news.some(n=>n.achievementKey===a.achievementKey))return null;
 const n=E.publishArticle(S,{bulletin:true,achievement:true,important:true,majorAchievement:true,kind:'achievement',...a});
 if(n)S.majorAchievementKeys[a.achievementKey]=true;return n;
};
function publish(S,u,type,key,title,text,at,rows=[],recovered=false,extra={}){
 return E.publishAchievementNews(S,{achievementKey:key,achievementLabel:type,title,text,at:Number.isInteger(at)?Math.min(at,E.abs(S)):E.abs(S),runner:u.id,team:u.team,image:E.o(u).image,achievementLinks:links(S,u,rows),recovered,...extra});
}
E.reportTripleAchievements=(S,u,{recovered=false}={})=>{
 if(!eligible(u))return;
 const histories=(u.history||[]).filter(h=>h.pos===1&&h.grade===100&&h.at<=E.abs(S)),years=new Set(histories.map(yearOf));
 for(const t of u.titles||[]){const m=t.name.match(/^(20\d{2})\s+(.+)$/);if(m&&E.tripleSeries.some(([n])=>clean(n)===clean(m[2])))years.add(+m[1])}
 for(const year of years){if(year>E.calendarYear(S))continue;const sets=[];
  E.tripleSeries.forEach(([label,races,expected],index)=>{
   const wins=races.map(r=>histories.filter(h=>yearOf(h)===year&&stage(u,h)===expected&&clean(h.race)===clean(r)).sort((a,b)=>a.at-b.at)[0]),full=wins.every(Boolean),official=(u.titles||[]).find(t=>t.name===year+' '+label);
   const conflicting=histories.some(h=>yearOf(h)===year&&stage(u,h)!==expected&&races.some(r=>clean(h.race)===clean(r)));
   if(!full&&(!official||conflicting))return;
   const at=full?Math.max(...wins.map(h=>h.at)):Number.isInteger(official.at)&&2027+Math.floor(official.at/24)===year?official.at:E.abs(S),rows=full?wins:[],history=(u.history||[]).filter(h=>h.at<=at),unbeaten=full&&(u.history||[]).length===u.starts&&history.length>0&&history.every(h=>h.pos===1),title=name(u)+', '+(unbeaten?'무패로 ':'')+label+' 완성';
   publish(S,u,'삼관 달성','triple:'+u.id+':'+year+':'+index,title,year+'년 '+races.join(' → ')+'을 모두 제패했다. '+farm(S,u)+' 소속 '+subject(u)+' '+label+' 우마무스메로 이름을 남겼다.'+(full?'':' 공식 삼관 칭호 기록을 바탕으로 복원한 소식이다.'),at,rows,recovered,{achievementYear:year,tripleSeries:label});
   sets.push({index,at,rows});
  });
  if(sets.some(x=>x.index===2)&&sets.some(x=>x.index===3)){const both=sets.filter(x=>x.index===2||x.index===3),rows=both.flatMap(x=>x.rows);publish(S,u,'봄·가을 6관','senior-six:'+u.id+':'+year,name(u)+', 시니어 봄·가을 6관 석권',year+'년 오사카배·텐노상 (봄)·타카라즈카 기념에 이어 텐노상 (가을)·재팬컵·아리마 기념까지 우승했다. '+farm(S,u)+'가 한 해 시니어 GⅠ 6관을 모두 품었다.',Math.max(...both.map(x=>x.at)),rows,recovered,{achievementYear:year})}
 }
 // Triple completions have their own articles; prevent the old digest from hiding or repeating them.
 S.majorBulletins=(S.majorBulletins||[]).filter(a=>!String(a.key).startsWith('triple-'+u.id+'-'));
};
function g1News(S,u,n,h,recovered=false){return publish(S,u,'통산 GⅠ 다승','career-g1:'+u.id+':'+n,name(u)+(n===1?', 첫 GⅠ 우승':', 통산 GⅠ '+n+'승 달성'),farm(S,u)+'의 '+subject(u)+' '+h.race+' 우승으로 '+(n===1?'첫 GⅠ 타이틀을 획득했다.':'커리어 GⅠ '+n+'승 고지에 올랐다.'),h.at,[h],recovered)}
function streakNews(S,u,n,h,recovered=false){return publish(S,u,'연승 기록','streak:'+u.id+':'+h.at+':'+n,name(u)+', '+n+'연승 달성',h.race+' 우승으로 공식전 '+n+'연승을 기록했다. '+farm(S,u)+'의 상승세가 이어지고 있다.',h.at,[h],recovered)}
function watched(S,u){return u.team===0||(S.turnRivals||[]).includes(u.id)||(E.active(S)||[]).some(p=>(p.rivalIds||[]).includes(u.id))}
E.reportAwardAchievements=(S,ceremony,recovered=false)=>{for(const a of ceremony?.items||[]){if(!['year','honor'].includes(a.key))continue;const u=E.recordRoomRunners(S).find(u=>u.id===a.runner);if(!eligible(u))continue;const honor=a.key==='honor',r=a.record||{},title=honor?name(u)+', JRA 현창 우마무스메 선정':a.year+' JRA 연도대표, '+name(u),text=honor?farm(S,u)+' 소속 '+subject(u)+' 커리어 GⅠ '+(r.g1??u.g1wins)+'승, '+(r.starts??u.starts)+'전 '+(r.wins??u.wins)+'승의 업적으로 현창 우마무스메에 선정됐다.':farm(S,u)+'의 '+subject(u)+' '+a.year+'년을 대표하는 우마무스메로 선정됐다. 당해 GⅠ '+(r.g1||0)+'승 · '+(r.starts||0)+'전 '+(r.wins||0)+'승.';publish(S,u,honor?'JRA 현창':'JRA 연도대표','award:'+a.key+':'+a.year+':'+u.id,title,text,(a.year-2027)*24+23,[],recovered,{awardYear:a.year})}};
E.reportRaceUpsets=(S,result)=>{
 const entries=result.rows.length;
 const events=result.rows.filter(row=>{
  const u=S.runners.find(u=>u.id===row.runner);
  return eligible(u)&&row.team===0&&
   ((row.popularity===1&&row.pos>entries/2&&E.performance(result.race,row.pos,entries)<0)||
    (row.pos===1&&row.popularity>entries/2));
 });
 if(!events.length)return;
 const headlines=events.map(row=>row.pos===1?row.name+' 인기 '+row.popularity+'위로 깜짝 우승':row.name+' 1번 인기에도 '+row.pos+'착');
 E.publishAchievementNews(S,{achievementKey:'upset:'+result.id,achievementLabel:'레이스 이변',title:result.race.name+' · '+headlines.join(' / '),text:events.map(row=>row.name+' · '+entries+'명 출전, 인기 '+row.popularity+'위 → '+row.pos+'착.').join(' '),at:result.at,runner:events[0].runner,team:events[0].team,result:result.id,race:structuredClone(result.race)});
};
E.applyResult=(S,result)=>{
 const before=new Map(result.rows.map(row=>[row.runner,S.runners.find(u=>u.id===row.runner)?.g1wins||0]));
 const r=old.applyResult(S,result);if(r?.error)return r;
 for(const row of result.rows){const u=S.runners.find(u=>u.id===row.runner);if(!eligible(u)||row.pos!==1)continue;E.reportTripleAchievements(S,u);
  const h=u.history.find(h=>h.at===result.at&&clean(h.race)===clean(result.race.name));if(!h)continue;
  if(result.race.grade===100)for(const n of milestones)if(before.get(u.id)<n&&u.g1wins>=n&&(n>=5||watched(S,u)))g1News(S,u,n,h);
  if(watched(S,u)){let n=0;for(const x of u.history.slice().sort((a,b)=>b.at-a.at)){if(x.pos!==1)break;n++}if(streakMark(n))streakNews(S,u,n,h)}
 }
 E.reportRaceUpsets(S,result);E.sortAchievementNews(S);return r;
};
E.flushBulletins=S=>{const r=old.flushBulletins(S);E.sortAchievementNews(S);return r};
E.announceAwards=(S,...args)=>{const c=old.announceAwards(S,...args);E.reportAwardAchievements(S,c);E.sortAchievementNews(S);return c};
const annualFarmWin=h=>String(h.key||'').startsWith('farm-g1-');
function cleanLegacyRaceNews(S){
 if(S.raceNewsPolicyVersion===1)return;
 S.majorBulletins=(S.majorBulletins||[]).filter(h=>!annualFarmWin(h));
 const rebuild=[];
 S.news=S.news.filter(n=>{
  if(n.achievementLabel==='레이스 이변'){
   if(n.team===0&&!n.text.includes(' / '))return true;
   const result=S.results.find(r=>r.id===n.result);
   if(result){delete S.majorAchievementKeys?.[n.achievementKey];rebuild.push(result)}
   return false;
  }
  if(!n.highlights?.some(annualFarmWin))return !/ · 올해 GⅠ \d+승 달성$/.test(n.title);
  const highlights=n.highlights.filter(h=>!annualFarmWin(h));
  if(!highlights.length)return false;
  const first=highlights[0];
  Object.assign(n,{highlights,title:first.text,text:highlights.map(h=>h.text).join(' · '),
   runner:first.runner,team:first.team,result:first.result,playerRelated:first.team===0,
   entrantIds:[...new Set(highlights.map(h=>h.runner).filter(Boolean))]});
  const runner=E.recordRoomRunners(S).find(u=>u.id===first.runner);
  n.image=runner?E.o(runner)?.image:undefined;
  return true;
 });
 rebuild.forEach(result=>E.reportRaceUpsets(S,result));
 S.raceNewsPolicyVersion=1;
}
E.restoreAchievementNews=S=>{
 cleanLegacyRaceNews(S);
 for(const u of E.recordRoomRunners(S))for(const title of u.titles||[]){
  if(/연도대표/.test(title.name))title.grade=E.titleGrade(title.name);
 }
 if(S.achievementNewsVersion>=32){E.sortAchievementNews(S);return S;}
 for(const u of E.recordRoomRunners(S)){if(!eligible(u))continue;E.reportTripleAchievements(S,u,{recovered:true});
  const history=(u.history||[]).filter(h=>Number.isInteger(h.at)&&h.at<=E.abs(S)).sort((a,b)=>a.at-b.at),wins=history.filter(h=>h.grade===100&&h.pos===1),marks=milestones.filter(n=>n<=wins.length&&(n>=5||watched(S,u)));
  // Only date a career milestone when the complete GⅠ win history is retained.
  if(wins.length===u.g1wins&&marks.length){const n=marks.at(-1);g1News(S,u,n,wins[n-1],true)}
  if(watched(S,u)&&history.length===u.starts){let run=0,last=null;for(const h of history){run=h.pos===1?run+1:0;if(streakMark(run))last={n:run,h}}if(last)streakNews(S,u,last.n,last.h,true)}
 }
 for(const c of S.awards||[])E.reportAwardAchievements(S,c,true);
 E.sortAchievementNews(S);S.achievementNewsVersion=32;return S;
};
E.resume=S=>E.restoreAchievementNews(old.resume(S));
E.newGame=(...args)=>{const S=old.newGame(...args);S.majorAchievementKeys={};S.achievementNewsVersion=32;return S};
return E}root.UmaAchievementNewsV32={install};if(typeof module!=='undefined')module.exports={install}})(typeof window!=='undefined'?window:globalThis);
