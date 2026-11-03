/* Ranch rules v2. Local decision logic and independent saved random streams. */
(function(root){'use strict';
const Base=typeof module!=='undefined'?require('./engine.js'):root.UmaFM;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),sum=a=>a.reduce((x,y)=>x+y,0),copy=x=>JSON.parse(JSON.stringify(x));
const NAMES=['트레센 목장','스피카 목장','리길 목장','카노푸스 목장','시리우스 목장','솔스티스 목장','아스테르 목장','루미에르 목장','에클립스 목장','오리온 목장','크레센트 목장','아르카디아 목장','벨로체 목장','노바 목장','페가수스 목장','아틀라스 목장','플뢰르 목장','세레네 목장','미라지 목장','폴라리스 목장'];
function init(db){const E=Base.init(db),oldResume=E.resume,oldNew=E.newGame,originalRaces=E.racesAt;
const originalGradeName=E.gradeName;E.gradeName=r=>r.grade===900?'신마':originalGradeName(r);
E.age=(S,u)=>u.status==='undebuted'?0:(u.retired?u.retiredYear:S.year)-(u.debutYear??S.year)+1;
E.ageName=(S,u)=>u.retired?'은퇴':u.status==='undebuted'?'미데뷔':E.age(S,u)===1?'주니어':E.age(S,u)===2?'클래식':`시니어 ${E.age(S,u)-2}년차`;
E.decline=(S,u)=>u.team===0?1-Math.min(3,Math.max(0,E.age(S,u)-3))*.05:1;
E.own=S=>S.runners.filter(u=>u.team===0&&!u.retired);
E.active=S=>E.own(S).filter(u=>u.status==='active');
E.supportBonus=u=>{const b=[0,0,0,0,0];for(const x of u.supportCards||[]){const c=db.supports.find(c=>c.gameId===x.card);if(!c)continue;const k=Base.TYPES[c.type];if(k==null)b.forEach((v,i)=>b[i]+=({SSR:5,SR:2,R:1}[c.rarity]));else b[k]+=({SSR:15,SR:8,R:5}[c.rarity])}return b};
E.baseStats=u=>(u.iv||[24,24,24,24,24]).map((v,i)=>clamp(v+(u.ev?.[i]||0)+(u.factorBonus?.[i]||0)+E.supportBonus(u)[i],1,100));
E.sync=u=>(u.stats=E.baseStats(u));
E.value=(S,u,i)=>clamp(Math.floor(E.baseStats(u)[i]*E.decline(S,u)),1,100);
E.effective=E.value;E.ability=(S,u)=>sum(E.baseStats(u))/5*E.decline(S,u);
E.makeRunner=(S,outfit,team=0,age=0,iv)=>{const o=E.outfits.get(outfit);const u={id:S.nextId++,outfit,team,status:age?'active':'undebuted',debutYear:age?S.year-age+1:null,scoutedAt:E.abs(S),iv:iv?iv.slice():Array.from({length:5},()=>E.int(S,18,30)),ev:[0,0,0,0,0],evPlan:[60,40,40,20,40],factorBonus:[0,0,0,0,0],supportCards:[],apt:o.aptitudes.map(a=>Base.APT.indexOf(a)),fitness:100,fatigue:0,injury:0,plan:'train',focus:0,sp:80,known:[],learned:[],equipped:[],inheritKnown:[],inheritLearned:[],inheritEquipped:[],innate:[],evolved:[],usedFactors:[],factorWindows:[],entry:null,history:[],wins:0,points:0,seasonPoints:0,starts:0,training:0,g1wins:0,best:99,retired:false,fans:0};u.style=E.bestStyle(u);if(age>1){const target=Math.min(200,(age-1)*55);for(let n=0;n<target;n++)u.ev[n%5]++;u.starts=(age-1)*5;u.wins=age-1;u.points=(age-1)*35;u.training=(age-1)*12;u.fans=(age-1)*1200;u.innate=o.goldSkills.slice(0,2);u.learned=u.innate.slice();u.equipped=u.learned.slice()}E.sync(u);return u};
E.ivStars=iv=>clamp(1+Math.floor((sum(iv)/5-18)/2.5),1,5);
E.refreshScout=S=>{const pool=E.availableOutfits(S).slice();S.scouts=[];for(let i=0;i<3+Math.floor(S.fac.scout/2)&&pool.length;i++){const o=pool.splice(E.int(S,0,pool.length-1),1)[0],iv=Array.from({length:5},()=>E.int(S,18,30));S.scouts.push({id:S.nextId++,outfit:o.gameId,iv,stars:E.ivStars(iv),cost:Math.round((22000+E.int(S,0,18000)+sum(iv)*100)*(1-S.fac.scout*.025)/500)*500,expires:E.abs(S)+4})}};
E.newGame=(name,seed)=>{const S=oldNew(name||'트레센 목장',seed);S.rulesVersion=2;S.club=name||'트레센 목장';S.teams.forEach((t,i)=>t.name=i?NAMES[i]:S.club);S.runners=S.runners.filter(u=>u.team!==0);S.ledger=[];S.news=[];S.results=[];S.hall=[];S.raceFields={};S.pendingTurn=null;S.startup=true;const pool=E.availableOutfits(S).slice();S.starterChoices=[];for(let i=0;i<3;i++){const o=pool.splice(E.int(S,0,pool.length-1),1)[0];S.starterChoices.push(o.gameId);for(let j=pool.length-1;j>=0;j--)if(pool[j].character===o.character)pool.splice(j,1)};const cards=db.supports.filter(c=>c.rarity==='SSR').slice();S.starterSupports=[];for(let i=0;i<5;i++)S.starterSupports.push(cards.splice(E.int(S,0,cards.length-1),1)[0].gameId);E.log(S,'목장 운영의 첫 페이지','미데뷔 우마무스메 1명과 SSR 서포트 1장을 선택하세요.');return S};
E.chooseStarter=(S,outfit,card)=>{if(!S.startup||!S.starterChoices.includes(outfit)||!S.starterSupports.includes(card))return {error:'제시된 스타팅 후보와 SSR을 선택하세요.'};const u=E.makeRunner(S,outfit,0,0,[24,24,24,24,24]);S.runners.push(u);S.supports[card]=(S.supports[card]||0)+1;E.attachSupport(S,u.id,card);S.startup=false;E.refreshScout(S);E.log(S,'새 목장 개장',`${E.o(u).characterKo} 합류 · 모든 개체값 24. 6월 신마전을 준비하세요.`,'scout');return {ok:true}};
E.sign=(S,id)=>{const c=S.scouts.find(x=>x.id===id);if(!c||c.expires<E.abs(S))return {error:'보고서가 만료되었습니다.'};if(E.rosterCount(S)>=10)return {error:'목장 정원은 10명입니다. 전당에서 자리를 확보한 후 영입하세요.'};if(S.funds<c.cost)return {error:'스카우트 자금이 부족합니다.'};const u=E.makeRunner(S,c.outfit,0,0,c.iv);S.runners.push(u);S.scouts=S.scouts.filter(x=>x.id!==id);E.cash(S,-c.cost,'미데뷔 우마무스메 스카우트');E.log(S,`${E.o(u).characterKo} 목장 합류`,'미데뷔 · 6월 신마전 출전 전까지 노력치 훈련 제한','scout');return {ok:true,runner:u.id}};
E.supportWindow=(S,u)=>u.retired?null:u.status==='undebuted'?'predebut':E.age(S,u)===2?'classic':E.age(S,u)===3?'senior':null;
E.supportSlots=(S,u)=>{const window=E.supportWindow(S,u);return {window,used:(u.supportCards||[]).filter(c=>c.window===window).length,total:(u.supportCards||[]).length}};
E.attachSupport=(S,id,cid)=>{const u=S.runners.find(u=>u.id===id&&u.team===0&&!u.retired),c=db.supports.find(c=>c.gameId===cid);if(!u||!c||!S.supports[cid])return {error:'장착 대상과 보유 카드를 확인하세요.'};const slot=E.supportSlots(S,u);if(!slot.window||slot.used>=2||slot.total>=6)return {error:'미데뷔·클래식·시니어 1년차에 각각 2장씩만 등록할 수 있습니다.'};if(u.supportCards.some(x=>x.card===cid))return {error:'동일한 카드는 중복 장착할 수 없습니다.'};S.supports[cid]--;u.supportCards.push({card:cid,window:slot.window});for(const id of c.skills){const sk=E.skills.get(id);if(sk&&!sk.inheritedSkill&&[1,2].includes(sk.rarity))E.unlockSkill(u,id);if(E.o(u).goldSkills.includes(id)&&!u.innate.includes(id))u.innate.push(id)}E.sync(u);return {ok:true,message:'영구 장착 완료 · 능력치 보너스와 카드 스킬을 등록했습니다.'}};
E.useSupport=E.attachSupport;
E.fuse=(S,rarity,ids)=>{const next={R:'SR',SR:'SSR'}[rarity],cost={R:6000,SR:18000}[rarity];if(!next)return {error:'R 또는 SR만 합성할 수 있습니다.'};if(!Array.isArray(ids)||ids.length!==3)return {error:'같은 등급 카드 3장을 선택하세요.'};const needs={};for(const id of ids){if(db.supports.find(c=>c.gameId===id)?.rarity!==rarity)return {error:'같은 등급만 합성할 수 있습니다.'};needs[id]=(needs[id]||0)+1}if(Object.entries(needs).some(([id,n])=>(S.supports[id]||0)<n))return {error:'재료 카드가 부족합니다.'};if(S.funds<cost)return {error:'합성 비용이 부족합니다.'};E.cash(S,-cost,'서포트 카드 합성');for(const [id,n] of Object.entries(needs))S.supports[id]-=n;const success=E.rnd(S)<(rarity==='R'?.65:.45),c=E.pick(S,db.supports.filter(c=>c.rarity===(success?next:rarity)));S.supports[c.gameId]=(S.supports[c.gameId]||0)+1;return {ok:true,card:c.gameId,success,message:success?`${next} 승급 합성 성공!`:`승급 실패 · 같은 등급 ${rarity} 카드 1장 획득`}};
E.setEVPlan=(S,u,plan)=>{if(u.retired||u.team!==0)return {error:'소속 우마무스메만 설정할 수 있습니다.'};if(!Array.isArray(plan)||plan.length!==5||plan.some(n=>!Number.isInteger(n)||n<0||n>100)||sum(plan)>200)return {error:'노력치 목표는 능력치별 0~100, 합계 200 이하로 설정하세요.'};if(plan.some((n,i)=>n<u.ev[i]))return {error:'이미 얻은 노력치보다 목표를 낮출 수 없습니다.'};u.evPlan=plan.slice();return {ok:true,message:'자동 노력치 훈련 계획을 저장했습니다.'}};
E.train=(S,u)=>{if(u.status!=='active'||u.retired||u.injury||sum(u.ev)>=200)return 0;let gained=0;for(let n=0;n<S.fac.training+1&&sum(u.ev)<200;n++){const choices=u.evPlan.flatMap((target,i)=>u.ev[i]<target?[i]:[]);if(!choices.length)break;choices.sort((a,b)=>(u.ev[b]/Math.max(1,u.evPlan[b]))-(u.ev[a]/Math.max(1,u.evPlan[a])));const k=choices.at(-1);u.ev[k]++;gained++}u.training++;u.sp+=5;u.fitness=clamp(u.fitness-2,0,100);u.fatigue=clamp(u.fatigue+2,0,100);E.sync(u);return gained};
const oldLearn=E.learn,oldUnlock=E.unlockInnate,oldEvolve=E.evolve;
E.learn=(S,u,id,inherit=false)=>{if(u.retired)return {error:'은퇴 후에는 스킬을 획득할 수 없습니다.'};if(inherit){const k=u.inheritKnown.find(x=>x.id===id);if(!k||u.inheritLearned.includes(id))return {error:'획득 가능한 계승기가 아닙니다.'};if(u.inheritLearned.length>=6)return {error:'계승기는 최대 6개 획득할 수 있습니다.'};if(u.sp<k.cost)return {error:'스킬 Pt가 부족합니다.'};u.sp-=k.cost;u.inheritKnown=u.inheritKnown.filter(x=>x.id!==id);u.inheritLearned.push(id);if(u.inheritEquipped.length<3)u.inheritEquipped.push(id);return {ok:true}}return oldLearn(S,u,id,false)};
E.equipInherited=(u,id)=>{if(!u.inheritLearned.includes(id))return {error:'획득한 계승기만 장착할 수 있습니다.'};if(u.inheritEquipped.includes(id))u.inheritEquipped=u.inheritEquipped.filter(x=>x!==id);else if(u.inheritEquipped.length<3)u.inheritEquipped.push(id);else return {error:'계승기는 3개까지 장착할 수 있습니다.'};return {ok:true}};
E.unlockInnate=(S,u,id)=>u.status!=='active'?{error:'데뷔 후 육성 행동으로 해금할 수 있습니다.'}:oldUnlock(S,u,id);
E.evolve=(S,u,id)=>u.status!=='active'?{error:'현역 우마무스메만 진화할 수 있습니다.'}:oldEvolve(S,u,id);
E.factorWindow=(S,u)=>{if(u.retired)return null;const a=E.age(S,u),k=u.status==='undebuted'||a===1?'junior':a===2?'classic':a===3?'senior':null;return k&&!u.factorWindows.includes(k)?k:null};
E.createFactor=(S,u,rental=false)=>{const stats=E.baseStats(u),b=E.int(S,0,stats.length-1),redMax=Math.max(...u.apt),reds=u.apt.flatMap((v,i)=>v===redMax?[i]:[]),stars=v=>{const p=E.rnd(S);return p<.1+v/200?3:p<.5+v/250?2:1},unique=E.skills.get(E.o(u).uniqueSkills.at(-1)),pool=[...new Set(u.learned.flatMap(id=>{const sk=E.skills.get(id);return sk?.rarity===1&&!sk.inheritedSkill?[id]:(sk?.treeFamily||[]).filter(id=>E.skills.get(id)?.rarity===1&&!E.skills.get(id)?.inheritedSkill).slice(0,1)}))];for(let i=pool.length-1;i>0;i--){const j=E.int(S,0,i);[pool[i],pool[j]]=[pool[j],pool[i]]}const f={id:S.nextId++,outfit:u.outfit,name:E.o(u).characterKo,source:u.id,blue:{stat:b,stars:stars(stats[b])},red:{apt:E.pick(S,reds),stars:stars(redMax/7*100)},green:{skill:unique?.inherited||null},white:pool.filter(()=>E.rnd(S)<.65).slice(0,6),rental,used:false};S.factors.push(f);return f};
E.applyFactor=(S,u,id)=>{const f=S.factors.find(x=>x.id===id),window=E.factorWindow(S,u);if(!f||f.used||f.rental&&!f.ownedRental)return {error:'사용 가능한 인자가 없습니다.'};if(!window)return {error:'주니어·클래식·시니어 1년차에 각각 한 번 사용할 수 있습니다.'};if(u.usedFactors.includes(f.source??f.outfit))return {error:'같은 우마무스메에게 이미 사용한 인자입니다.'};const text=[],bonus=[0,3,6,10][f.blue.stars];u.factorBonus[f.blue.stat]+=bonus;text.push(`${Base.STATS[f.blue.stat]} 청인자 +${bonus}`);if(u.apt[f.red.apt]<7&&E.rnd(S)<[0,.2,.4,.6][f.red.stars]){u.apt[f.red.apt]++;text.push('적인자 적성 상승')}if(f.green.skill&&u.inheritKnown.length+u.inheritLearned.length<6&&!u.inheritLearned.includes(f.green.skill)&&!u.inheritKnown.some(x=>x.id===f.green.skill)){u.inheritKnown.push({id:f.green.skill,cost:150});text.push('계승 고유기 해금')}for(const skill of f.white)if(E.rnd(S)<.25)E.unlockSkill(u,skill);u.usedFactors.push(f.source??f.outfit);u.factorWindows.push(window);if(f.rental)f.used=true;E.sync(u);E.log(S,`${E.o(u).characterKo} · 인자 계승`,text.join(' · '),'factor');return {ok:true,message:text.join(' · ')}};
E.canRetire=(S,u)=>u.status==='active'&&E.age(S,u)>=4;
E.retire=(S,u,forced=false)=>{if(u.retired||!forced&&!E.canRetire(S,u))return {error:'시니어 1년차 종료 후 은퇴할 수 있습니다.'};u.retiredYear=S.year-(forced&&E.age(S,u)>6?1:0);u.retired=true;u.status='retired';u.entry=null;u.fansAtRetirement=u.fans;u.fans=0;const f=E.createFactor(S,u,u.team!==0);if(u.team===0){S.hall.push({runner:copy(u),factor:f.id,year:S.year});E.log(S,`${E.o(u).characterKo} 은퇴`,'명예의 전당 · 영구 인자 등록. 팬 수익 종료.','hall')}return {ok:true}};
E.settleAuctions=S=>{for(const a of S.auctions){if(a.ends>E.abs(S)+1)continue;let rival=null;for(const team of S.teams.slice(1)){const max=Math.min(team.funds*.22,a.interest*(.65+E.rnd(S)*.55));if(max>(a.bid||a.price)&&E.rnd(S)<.18&&(!rival||max>rival.max))rival={team,max:Math.floor(max/2000)*2000}}if(a.bidder===0&&!rival){if(a.kind==='support')S.supports[a.item]=(S.supports[a.item]||0)+1;else S.factors.find(f=>f.id===a.item).ownedRental=true;E.log(S,'경매 낙찰',a.kind==='support'?'보유 서포트 카드 추가':'1회 대여 인자 확보','auction')}else if(rival){rival.team.funds-=Math.max(a.price,Math.min(rival.max,(a.bid||a.price)+2000));if(a.kind==='support'){rival.team.cards??={};rival.team.cards[a.item]=(rival.team.cards[a.item]||0)+1}else{const f=S.factors.find(f=>f.id===a.item),u=E.team(S,rival.team.id).find(u=>E.factorWindow(S,u));if(u){f.ownedRental=true;E.applyFactor(S,u,f.id);f.ownedRental=false}}if(a.bidder===0){E.cash(S,a.bid,'경매 유찰 예치금 반환');E.log(S,rival.team.name+' 경매 낙찰','입찰 예치금을 반환했습니다.','auction')}}}S.auctions=[]};
E.racesAt=(S,t=S.turn)=>{let races=originalRaces(S,t).map(r=>({...r,name:r.grade===900?r.name.replace(/데뷔전|데뷔/g,'신마전'):r.name}));if(t===10){const june=originalRaces(S,11).filter(r=>r.grade===900);races.push(...june.map(r=>({...r,month:6,half:1,name:r.name.replace(/데뷔전|데뷔/g,'신마전')})))}return races.map(r=>({...r,key:[r.name,r.trackId,r.distance,r.terrain].join('|')}))};
E.aptWarnings=(u,r,style=u.style)=>[E.groundIndex(r),E.distType(r)+2,style+6].filter(i=>u.apt[i]<=4).map(i=>`${Base.APTN[i]} ${Base.APT[u.apt[i]]}`);
E.aiFits=(u,r)=>u.apt[E.groundIndex(r)]>=5&&u.apt[E.distType(r)+2]>=5&&u.apt[6+u.style]>=5;
E.raceEligibility=(S,u,r)=>{if(u.retired)return {ok:false,why:'은퇴'};if(u.injury)return {ok:false,why:'부상 치료 중'};if(u.fitness<30)return {ok:false,why:'컨디션 30 미만'};if(u.status==='undebuted')return r.grade===900&&r.month===6?{ok:true,why:'6월 신마전 · 참가 시 데뷔'}:{ok:false,why:'먼저 6월 신마전에 참가하세요.'};const a=E.age(S,u),stage=a===1?1:a===2?2:3;if(!r.ages.includes(stage))return {ok:false,why:'연차 자격 없음'};if(r.grade===900)return {ok:false,why:'이미 데뷔했습니다.'};if(r.grade===800&&u.wins)return {ok:false,why:'미승리전은 0승만 가능'};const seed=u.history.some(h=>E.abs(S)-h.at<=8&&h.pos<=3&&h.terrain===r.terrain&&Math.abs(h.distance-r.distance)<=600&&h.grade<=300);const min=r.grade===100?60:r.grade===200?22:0;return min&&u.points<min&&!seed?{ok:false,why:`출전 심사: 전초전 3위 또는 ${min}점 필요`}:{ok:true,seed,why:seed?'전초전 시드':'출전 자격 충족'}};
E.aiEntry=(S,u,races)=>{if(u.injury||u.fitness<58||u.starts&&E.rnd(S)<.32)return null;const options=races.filter(r=>E.aiFits(u,r)&&E.raceEligibility(S,u,r).ok);return options.map(r=>({r,score:E.fit(S,u,r)*80+(500-r.grade)*.035+E.rnd(S)*12})).sort((a,b)=>b.score-a.score)[0]?.r.key||null};
E.raceRating=(S,u,r)=>{const [sp,st,pw,gu,wi]=Array.from({length:5},(_,i)=>E.value(S,u,i)),need=r.distance<=1400?22:r.distance<=1800?32:r.distance<=2400?48:68;return (sp*.60+pw*.14+gu*.10+wi*.08+Math.min(st,need)*.08)*E.fit(S,u,r)*(st+gu*.22<need?.58:1)};
E.mobRunner=(S,r,used)=>{const surface=r.terrain===2?'dirt':'turf',distance=['short','mile','medium','long'][E.distType(r)],pool=(db.mobs||[]).filter(m=>!used.has(m.id)&&m.courses.some(c=>c.surface===surface&&c.distance===distance));if(!pool.length)throw Error('적성에 맞는 모브 데이터가 없습니다: '+surface+'/'+distance);const m=E.pick(S,pool);used.add(m.id);const u=E.makeRunner(S,db.outfits[0].gameId,-1,r.ages.includes(3)?3:r.ages.includes(2)?2:1);u.id='mob-'+E.abs(S)+'-'+S.nextId++;u.mobId=m.id;u.mobName=m.name;u.mobOriginal=m.original;u.mobImage=m.image;u.mob=true;u.guest=true;u.apt=Array(10).fill(4);u.apt[E.groundIndex(r)]=6;u.apt[2+E.distType(r)]=6;u.style=E.int(S,0,3);u.apt[6+u.style]=6;u.learned=[];u.equipped=[];u.innate=[];u.iv=Array.from({length:5},()=>E.int(S,18,30));u.ev=[0,0,0,0,0];const level=r.grade===100?48:r.grade===200?39:r.grade===300?31:r.grade<=700?23:r.grade===800?13:5;u.ev=u.ev.map(()=>clamp(level+E.int(S,-5,5),0,70));if(sum(u.ev)>200){const scale=200/sum(u.ev);u.ev=u.ev.map(v=>Math.floor(v*scale))}E.sync(u);return u};
E.raceField=(S,r)=>{const key=E.abs(S)+'|'+r.key;S.raceFields??={};if(!S.raceFields[key]){const used=new Set(),named=[],existing=S.runners.filter(u=>u.team>0&&!u.retired&&E.aiFits(u,r)&&E.raceEligibility(S,u,r).ok).sort((a,b)=>E.raceRating(S,b,r)-E.raceRating(S,a,r));const target=Math.round(r.entries*(r.grade===100?.85:r.grade===200?.5:r.grade===300?.3:.15));for(const u of existing){if(named.length>=target)break;named.push(copy(u));used.add(u.outfit)}const outfits=db.outfits.filter(o=>!used.has(o.gameId)&&!E.own(S).some(u=>u.outfit===o.gameId)&&Base.APT.indexOf(o.aptitudes[E.groundIndex(r)])>=5&&Base.APT.indexOf(o.aptitudes[E.distType(r)+2])>=5);while(named.length<target&&outfits.length){const o=outfits.splice(E.int(S,0,outfits.length-1),1)[0],u=E.makeRunner(S,o.gameId,1+E.int(S,0,18),r.grade===900?0:r.ages.includes(3)?3:r.ages.includes(2)?2:1);u.id='invite-'+E.abs(S)+'-'+S.nextId++;u.guest=true;u.evPlan=[60,40,40,20,40];const total=r.grade===100?200:r.grade===200?165:r.grade===300?135:r.grade<=700?100:r.grade===800?55:0;u.ev=u.evPlan.map(v=>Math.floor(v*total/200));E.sync(u);named.push(u)}const mobs=[],mobUsed=new Set();while(named.length+mobs.length<r.entries)mobs.push(E.mobRunner(S,r,mobUsed));S.raceFields[key]=[...named,...mobs]}
const own=E.own(S).filter(u=>u.entry===r.key).map(copy),ids=new Set(own.map(u=>u.outfit)),others=S.raceFields[key].filter(u=>!ids.has(u.outfit)||u.mob);return [...own,...others.slice(0,r.entries-own.length)].sort((a,b)=>E.raceRating(S,b,r)-E.raceRating(S,a,r)).map((u,i)=>({...u,popularity:i+1}))};
E.enter=(S,u,key,style)=>{if(S.pendingTurn)return {error:'먼저 레이스 결과를 확인하고 다음 턴으로 이동하세요.'};const r=E.racesAt(S).find(r=>r.key===key);if(!r)return {error:'이번 턴의 레이스가 아닙니다.'};const q=E.raceEligibility(S,u,r);if(!q.ok)return {error:q.why};u.entry=key;u.style=clamp(Number(style),0,3);const field=E.raceField(S,r),popular=field.find(x=>x.id===u.id)?.popularity;return {ok:true,message:`출전 등록 · 예상 인기 ${popular}번`,popularity:popular}};
E.allSkills=u=>u.mob?[]:[...new Set([...E.o(u).uniqueSkills.slice(-1),...u.equipped,...u.inheritEquipped])];
E.fanCap=50000;E.fanMonthly=S=>E.active(S).reduce((n,u)=>n+Math.floor(u.fans*.8),0);
E.applyResult=(S,result)=>{const r=result.race;for(const row of result.rows){const u=S.runners.find(u=>u.id===row.runner);if(!u)continue;if(u.status==='undebuted'){u.status='active';u.debutYear=S.year;E.log(S,`${E.o(u).characterKo} 데뷔`,'신마전 참가 · 주니어 현역 전환 · 자동 노력치 훈련 해금','race')}
u.starts++;const won=row.pos===1,points=Math.max(0,({100:100,200:55,300:30,400:14,700:9,800:7,900:7}[r.grade]||10)-(row.pos-1)*({100:10,200:7,300:5}[r.grade]||3));u.points+=points;u.seasonPoints+=points;S.teams[u.team].points+=points;u.best=Math.min(u.best,row.pos);if(won){u.wins++;if(r.grade===100)u.g1wins++}u.sp+=E.int(S,15,25)+Math.max(0,15-row.pos);u.fitness=clamp(u.fitness-E.int(S,10,17),10,100);u.fatigue=clamp(u.fatigue+E.int(S,6,12),0,100);if(E.rnd(S)<clamp(.02+u.fatigue*.0004-S.fac.medical*.002,.003,.10))u.injury=E.int(S,1,3);
const age=E.age(S,u),base={100:7000,200:3000,300:1600,400:800,700:500,800:300,900:250}[r.grade]||400;
if(row.pos<=5){const gain=Math.round(base*([1,.6,.4,.2,.1][row.pos-1])*(age>=5?.03:1)*(1-u.fans/E.fanCap));u.fans=clamp(u.fans+gain,0,E.fanCap)}else u.fans=Math.max(0,u.fans-Math.ceil(u.fans*(row.pos>10?.10:.05)));
u.history.unshift({at:result.at,race:r.name,grade:r.grade,pos:row.pos,terrain:r.terrain,distance:r.distance,points});u.history=u.history.slice(0,180);
if(u.team===0){S.missions.starts++;if(won)S.missions.wins++;const prize=Math.round(E.price(r)*([1,.60,.4,.25,.15][row.pos-1]??.05));if(prize)E.cash(S,prize,r.name+' レ이스 상금'.replace('レース','레이스'));const tickets=won?r.grade===100?5:r.grade<=300?3:2:row.pos<=3?1:0;S.tickets+=tickets;S.fame+=won?2:0;E.log(S,`${r.name} · ${E.o(u).characterKo} ${row.pos}위`,`${prize.toLocaleString()}원 · 팬 ${u.fans.toLocaleString()}명 · +${tickets}티켓`,won?'win':'race')}}S.results.unshift(result);let ownResults=0,worldResults=0;S.results=S.results.filter(r=>r.rows.some(x=>x.team===0)?++ownResults<=120:++worldResults<=12)};
// Resolve a turn first. Date/income rollover waits for the explicit result acknowledgement.
E.advance=S=>{if(S.startup)return {error:'먼저 스타팅 우마무스메와 SSR을 선택하세요.'};if(S.pendingTurn)return S.pendingTurn;const now=E.abs(S),races=E.racesAt(S),report={at:now,races:[],growth:[],retired:[],balance:S.funds,needsAcknowledgement:true};E.settleAuctions(S);
for(const u of S.runners.filter(u=>!u.retired)){if(u.injury){u.injury--;u.fitness=clamp(u.fitness+10+S.fac.medical*2,0,100);u.entry=null;continue}if(u.team!==0){E.withRng(S,'ai',()=>{const bag=S.teams[u.team].cards||{},slot=E.supportSlots(S,u);if(slot.window&&slot.used<2&&slot.total<6){const cid=Object.keys(bag).map(Number).find(id=>bag[id]>0&&!u.supportCards.some(x=>x.card===id));if(cid){bag[cid]--;u.supportCards.push({card:cid,window:slot.window});for(const id of db.supports.find(c=>c.gameId===cid).skills)E.unlockSkill(u,id);E.sync(u)}}u.style=E.bestStyle(u);u.entry=E.aiEntry(S,u,races);u.plan=u.fitness<60||u.fatigue>70?'rest':'train';if(u.sp>=200)for(const id of u.known.slice()){if(u.equipped.length>=8)break;E.learn(S,u,id)}})}if(u.status==='undebuted')continue;if(u.plan==='rest'){u.fitness=clamp(u.fitness+20+S.fac.medical*2,0,100);u.fatigue=clamp(u.fatigue-25,0,100)}else if(u.plan==='medical'){if(u.team===0&&S.funds>=2500){E.cash(S,-2500,'메디컬 케어');u.fitness=clamp(u.fitness+35,0,100);u.fatigue=clamp(u.fatigue-35,0,100)}}else if(!u.entry){const gained=E.train(S,u);if(gained&&u.team===0)report.growth.push({id:u.id,gained})}}
const raced=new Set();for(const r of races){const registered=S.runners.filter(u=>!u.retired&&u.entry===r.key&&!raced.has(u.id)&&E.raceEligibility(S,u,r).ok);if(!registered.length)continue;let field=E.raceField(S,r).filter(u=>!raced.has(u.id));if(field.length<r.entries){const used=new Set(field.filter(u=>u.mob).map(u=>u.mobId));while(field.length<r.entries)field.push(E.mobRunner(S,r,used))}field.sort((a,b)=>E.raceRating(S,b,r)-E.raceRating(S,a,r));field.forEach((u,i)=>u.popularity=i+1);field.forEach(u=>raced.add(u.id));const result=E.simulateRace(S,r,field);E.applyResult(S,result);if(result.rows.some(x=>x.team===0))report.races.push(result.id)}
for(const u of S.runners)u.entry=null;report.balance=S.funds-report.balance;S.pendingTurn=report;S.lastReport=report;return report};
E.finishTurn=S=>{const report=S.pendingTurn;if(!report)return {error:'종료할 턴이 없습니다.'};const before=S.funds;if(S.turn%2===1){const revenue=E.fanMonthly(S);if(revenue)E.cash(S,revenue,'현역 팬 월 수익')}
const upkeep=E.own(S).reduce((n,u)=>n+(u.status==='active'?1600:600),0)+Object.values(S.fac).reduce((n,l)=>n+l*l*250,0);E.cash(S,-upkeep,'목장 생활비·시설 유지비');if(S.funds<0)E.cash(S,-Math.ceil(-S.funds*.01),'차입 이자');S.missions.turns++;S.turn++;
if(S.turn>=24){S.history.unshift({year:S.year,teams:copy(S.teams).sort((a,b)=>b.points-a.points),balance:S.funds});S.year++;S.turn=0;S.teams.forEach(t=>t.points=0);for(const u of S.runners.filter(u=>!u.retired)){u.seasonPoints=0;if(E.age(S,u)>6){E.retire(S,u,true);if(u.team===0)report.retired.push(u.id)}}}
E.withRng(S,'ai',()=>{for(let t=1;t<S.teams.length;t++){const team=S.teams[t];if(E.team(S,t).length<4){const pool=E.availableOutfits(S);if(pool.length)S.runners.push(E.makeRunner(S,E.pick(S,pool).gameId,t,0))}}});
if(S.turn%4===0||!S.scouts.length)E.refreshScout(S);if(!S.auctions.length)E.refreshAuctions(S);report.balance+=S.funds-before;report.needsAcknowledgement=false;S.pendingTurn=null;S.raceFields={};S.savedAt=Date.now();return {ok:true}};
E.missionClaim=(S,key)=>{const conditions={start3:[S.missions.starts>=3,3],win1:[S.missions.wins>=1,5],turn6:[S.missions.turns>=6,4],squad4:[E.own(S).length>=4,5]},m=conditions[key];if(!m||!m[0]||S.missions.claims.includes(key))return {error:'미션 조건을 확인하세요.'};S.missions.claims.push(key);S.tickets+=m[1];return {ok:true,message:`뽑기권 ${m[1]}장 획득`}};
E.resume=S=>{oldResume(S);if(S.rulesVersion!==2){for(const u of S.runners){const old=u.stats||[4,4,4,4,4];u.status=u.retired?'retired':u.starts?'active':'undebuted';if(u.status==='undebuted')u.debutYear=null;u.iv=[24,24,24,24,24];u.ev=old.map(v=>Math.max(0,Math.round(v/21*76)-24));if(sum(u.ev)>200){const scale=200/sum(u.ev);u.ev=u.ev.map(v=>Math.floor(v*scale))}u.evPlan=u.ev.map((v,i)=>Math.max(v,[60,40,40,20,40][i]));if(sum(u.evPlan)>200)u.evPlan=u.ev.slice();u.factorBonus=[0,0,0,0,0];u.supportCards=[];u.inheritEquipped=(u.inheritLearned||[]).slice(0,3);u.factorWindows=(u.factorWindows||[]).map(k=>k==='debut'?'junior':k);u.fans=u.retired?0:Math.min(E.fanCap,(u.wins||0)*1000+(u.starts||0)*100);E.sync(u)}for(const f of S.factors){delete f.green.stars}S.rulesVersion=2;S.raceFields={};S.pendingTurn=null;S.startup=false;S.teams.forEach((t,i)=>t.name=i?NAMES[i]:S.club);E.log(S,'목장 운영 규칙으로 전환','기존 커리어·카드·기록·자금을 보존했습니다. 등급 능력치는 새 노력치 모델로 변환했습니다. 서포트는 새로 영구 장착할 수 있습니다.','club')}S.raceFields??={};return S};
for(const [domain,names] of Object.entries({scouting:['chooseStarter','refreshScout','sign'],training:['attachSupport','useSupport','train'],draws:['fuse'],races:['raceField','mobRunner','enter','simulateRace','applyResult','advance'],ai:['aiEntry'],auctions:['settleAuctions'],factors:['createFactor','applyFactor']}))for(const name of names){const fn=E[name];E[name]=(S,...args)=>E.withRng(S,domain,()=>fn(S,...args))}
const raceEngine=typeof module!=='undefined'?require('./race.js'):root.UmaRaceEngine;raceEngine.install(E,db);
const applyResult=E.applyResult;E.applyResult=(S,result)=>{applyResult(S,result);let traces=0;for(const stored of S.results)if(stored.trace&&++traces>4)delete stored.trace};
const management=typeof module!=='undefined'?require('./management.js'):root.UmaManagement;management.install(E,db);
const progression=typeof module!=='undefined'?require('./progression.js'):root.UmaProgression;progression.install(E,db);
const league=typeof module!=='undefined'?require('./league.js'):root.UmaLeague;league.install(E,db);
const season=typeof module!=='undefined'?require('./season.js'):root.UmaSeason;season.install(E,db);
const economy=typeof module!=='undefined'?require('./economy.js'):root.UmaEconomy;economy.install(E,db);
const championship=typeof module!=='undefined'?require('./championship.js'):root.UmaChampionship;championship.install(E,db);
const courseGuide=typeof module!=='undefined'?require('./course-guide.js'):root.UmaCourseGuide;courseGuide.install(E,db);
const activities=typeof module!=='undefined'?require('./activities.js'):root.UmaActivities;activities.install(E,db);
const refinements=typeof module!=='undefined'?require('./refinements.js'):root.UmaRefinements;refinements.install(E,db);
const balance=typeof module!=='undefined'?require('./balance.js'):root.UmaBalance;balance.install(E,db);
const worldV15=typeof module!=='undefined'?require('./world-v15.js'):root.UmaWorldV15;worldV15.install(E,db);
const experienceV17=typeof module!=='undefined'?require('./experience-v17.js'):root.UmaExperienceV17;experienceV17.install(E,db);
const capsAwardsV18=typeof module!=='undefined'?require('./caps-awards-v18.js'):root.UmaCapsAwardsV18;capsAwardsV18.install(E,db);
const seasonV19=typeof module!=='undefined'?require('./season-v19.js'):root.UmaSeasonV19;seasonV19.install(E,db);
const farmsV21=typeof module!=='undefined'?require('./farms-v21.js'):root.UmaFarmsV21;farmsV21.install(E,db);
const honorV29=typeof module!=='undefined'?require('./honor-v29.js'):root.UmaHonorV29;honorV29.install(E,db);
const skillsV31=typeof module!=='undefined'?require('./skills-v31.js'):root.UmaSkillsV31;skillsV31.install(E,db);
const newsV32=typeof module!=='undefined'?require('./achievement-news-v32.js'):root.UmaAchievementNewsV32;newsV32.install(E,db);
// The Arc shares Longchamp's existing geometry and has its own exhibition field.
const arcName='개선문상',arcTitle='개선문 우마무스메';
const arcRace={id:'fm-arc',name:arcName,original:"Prix de l’Arc de Triomphe",year:3,month:10,half:1,grade:100,terrain:1,distance:2400,track:'롱샹',trackId:10201,direction:1,season:3,time:2,entries:20,arc:true};
const internationalNames=['Secretariat','Frankel','Winx','Black Caviar','Sea The Stars','Enable','Treve','Zarkava','Dancing Brave','Mill Reef','Ribot','Tiznow','Zenyatta','American Pharoah','Flightline','Makybe Diva','Verry Elleegant','Golden Sixty','Romantic Warrior'];
const racesBeforeArc=E.racesAt;
E.racesAt=(S,t=S.turn)=>t===18?[...racesBeforeArc(S,t),{...arcRace,ages:[3],key:'fm-arc'}]:racesBeforeArc(S,t);
const arcWon=u=>(u?.titles||[]).some(t=>t.name===arcTitle)||(u?.history||[]).some(h=>h.race===arcName&&h.pos===1);
E.arcWon=arcWon;
const eligibilityBeforeArc=E.raceEligibility, fansBeforeArc=E.requiredFans, priceBeforeArc=E.price;
E.requiredFans=r=>r.arc?0:fansBeforeArc(r);
E.price=r=>r.arc?250000:priceBeforeArc(r);
E.raceEligibility=(S,u,r)=>{
 if(!r.arc)return eligibilityBeforeArc(S,u,r);
 const wins=['니엘상','푸아상'].filter(name=>(u?.history||[]).some(h=>h.race===name&&h.pos===1));
 if(u?.team!==0||wins.length<2)return {ok:false,why:'니엘상과 푸아상에서 각각 1착 기록이 필요합니다.'};
 return eligibilityBeforeArc(S,u,r);
};
const fieldBeforeArc=E.raceField, skillsBeforeArc=E.allSkills, valueBeforeArc=E.value;
E.allSkills=u=>u.arcSkills||skillsBeforeArc(u);
E.value=(S,u,i)=>u.arcSkills?Math.round(Math.min(100,u.iv[i]+E.npcProjection(S,{...u,mob:false})[i])*E.moodRace(u)):valueBeforeArc(S,u,i);
E.raceField=(S,r)=>{
 if(!r.arc)return fieldBeforeArc(S,r);
 const player=S.runners.find(u=>u.id===r.activityRunner);
 if(player?.team!==0||!E.raceEligibility(S,player,r).ok)return [];
 const course=E.courseFor(r),used=new Set(),pools=new Map();
 const choose=(rows,index,from=0)=>rows.length?rows[from+index%(rows.length-from)]?.id:undefined;
 const rivals=internationalNames.map((mobName,index)=>{
  const u=E.mobRunner(S,r,used);
  u.id='arc-'+E.abs(S)+'-'+index;
  u.mobName=mobName;
  u.style=index%4;
  u.mood=4;
  u.apt[6+u.style]=6;
  if(!pools.has(u.style)){
   const profile=E.courseSkillProfile(course,{style:u.style,season:r.season,time:r.time});
   const rare=rows=>rows.filter(x=>E.skills.get(x.id)?.rarity===2);
   const active=rare(profile.ranked).filter(x=>!x.heal&&['A','B'].includes(x.tier));
   const backup=rare(profile.ranked).filter(x=>!x.heal&&!active.includes(x));
   const passive=profile.passive.filter(x=>!x.conditional&&!x.conditions.some(c=>/weather|ground_condition/.test(c)));
   const recovery=rare(profile.recovery);
   const ranked=[...profile.recommendations.values()].sort((a,b)=>b.score-a.score);
   const middle=rows=>rows.slice(Math.floor(rows.length*.1),Math.max(1,Math.ceil(rows.length*.35)));
   const unique=middle(ranked.filter(x=>[3,4,5].includes(E.skills.get(x.id)?.rarity)));
   const inherited=middle(ranked.filter(x=>E.skills.get(x.id)?.inheritedSkill));
   pools.set(u.style,{active,backup,passive,recovery,unique,inherited});
  }
  const {active,backup,passive,recovery,unique,inherited}=pools.get(u.style);
  const rotation=active.length?index%active.length:0;
  u.arcSkills=[...[...active.slice(rotation),...active.slice(0,rotation),...backup].slice(0,6).map(x=>x.id),
   choose(passive,index),choose(recovery,index),choose(unique,index),choose(inherited,index)].filter(Boolean);
  return u;
 });
 return [player,...rivals].sort((a,b)=>E.raceRating(S,b,r)-E.raceRating(S,a,r)).map((u,i)=>({...u,popularity:i+1}));
};
const performanceBeforeArc=E.performance,titleBeforeArc=E.titleGrade,honorBeforeArc=E.honorEligibility;
E.performance=(r,...args)=>performanceBeforeArc(r,...args)*(r.arc||r.race===arcName?2:1);
E.titleGrade=title=>title===arcTitle||title===arcName+' 우승'?'SSR':titleBeforeArc(title);
E.honorEligibility=(S,u,year=E.calendarYear(S))=>{
 const result=honorBeforeArc(S,u,year);
 const retiredThisYear=u.retired&&!u.mob&&!u.guest&&!u.noviceFailed&&
  (u.retirementKind==='manual'||u.team>0&&u.retirementKind==='automatic')&&
  Number.isInteger(u.retiredAt)&&Math.floor(u.retiredAt/24)+2027===year;
 return {...result,eligible:result.eligible||retiredThisYear&&arcWon(u),reason:result.reason+' / 개선문상 우승'};
};
const resumeTitles=E.resume,newGameTitles=E.newGame;
E.newGame=(...args)=>{const S=newGameTitles(...args);S.rankedTitlesVersion=1;return S};
E.resume=S=>{
 if(S.rankedTitlesVersion!==1){
  const g1=new Set();
  for(let turn=0;turn<24;turn++)for(const race of E.racesAt(S,turn))if(race.grade===100)g1.add(race.name+' 우승');
  const runners=[...S.runners,...Object.values(S.recordArchive||{}),...(S.hall||[]).map(h=>h.runner).filter(Boolean)];
  const withoutSpecial=rows=>(rows||[]).filter(a=>a.key!=='special'&&a.title!=='특별상');
  for(const u of new Set(runners)){
   const wins=new Set((u.history||[]).filter(h=>h.grade===100&&h.pos===1).map(h=>h.race+' 우승'));
   u.titles=(u.titles||[]).flatMap(t=>{
    const grade=E.titleGrade(t.name);
    return grade&&(grade!=='R'||g1.has(t.name)||wins.has(t.name))?[{...t,grade}]:[];
   });
   u.awards=withoutSpecial(u.awards);
  }
  for(const team of S.teams||[])team.awards=withoutSpecial(team.awards);
  for(const ceremony of S.awards||[])ceremony.items=withoutSpecial(ceremony.items);
  S.news=(S.news||[]).filter(n=>!(n.kind==='awards'&&/JRA 특별상 ·/.test(n.title)));
  S.rankedTitlesVersion=1;
 }
 return resumeTitles(S);
};

E.rosterCount=S=>{
 const hidden=new Set(S.memorialHiddenIds||[]);
 return S.runners.filter(u=>u.team===0&&!u.released&&!hidden.has(u.id)).length;
};
const restoreRunner=E.restoreRetiredRunner;
E.restoreRetiredRunner=(S,id)=>E.rosterCount(S)>=10?{error:'목장 정원이 10명입니다.'}:restoreRunner(S,id);

const allOwnedFactors=E.ownedFactors;
E.ownedFactors=S=>allOwnedFactors(S).filter(f=>!(S.factorInbox||[]).includes(f.id));
E.pendingFactors=S=>(S.factorInbox||[]).map(id=>S.factors.find(f=>f.id===id)).filter(Boolean);
function queueOverflowFactors(S,alreadyOwned){
 const current=E.ownedFactors(S);
 const incoming=current.filter(f=>!alreadyOwned.has(f.id));
 const available=Math.max(0,20-(current.length-incoming.length));
 const overflow=incoming.slice(available);
 if(overflow.length)(S.factorInbox??=[]).push(...overflow.map(f=>f.id));
}
for(const method of ['retire','settleFactorAuctions','buyFactor']){
 const original=E[method];
 E[method]=(S,...args)=>{
  const before=new Set(E.ownedFactors(S).map(f=>f.id));
  const result=original(S,...args);
  queueOverflowFactors(S,before);
  return result;
 };
}
const resumeCapacity=E.resume;
E.resume=S=>{
 const state=resumeCapacity(S);
 queueOverflowFactors(state,new Set());
 return state;
};
const applyOwnedFactor=E.applyFactor;
E.applyFactor=(S,u,id)=> (S.factorInbox||[]).includes(id)?{error:'보유할 인자를 먼저 선택하세요.'}:applyOwnedFactor(S,u,id);
E.resolveFactorInbox=(S,id,discardId=null)=>{
 const incoming=E.pendingFactors(S)[0];
 if(incoming?.id!==id)return {error:'획득 대기 중인 인자를 확인하세요.'};
 const owned=E.ownedFactors(S);
 if(discardId===id)S.factors=S.factors.filter(f=>f.id!==id);
 else if(owned.length>=20){
  if(!owned.some(f=>f.id===discardId))return {error:'교체할 기존 인자를 선택하세요.'};
  S.factors=S.factors.filter(f=>f.id!==discardId);
 }
 S.factorInbox=S.factorInbox.filter(f=>f!==id);
 return {ok:true,message:discardId===id?'새 인자 획득을 포기했습니다.':'새 인자를 보유 목록에 넣었습니다.'};
};

const resumeBeforeArcCleanup=E.resume;
E.resume=S=>{
 S=resumeBeforeArcCleanup(S);
 for(const u of [...S.runners,...Object.values(S.recordArchive||{}),...(S.hall||[]).map(x=>x.runner)].filter(Boolean)){
  if(u.team===0||u.playerOwned)continue;
  const invalid=(u.history||[]).filter(h=>h.race===arcName&&h.team!==0);
  if(!invalid.length)continue;
  u.history=u.history.filter(h=>!invalid.includes(h));
  u.titles=(u.titles||[]).filter(t=>t.name!==arcTitle&&t.name!==arcName+' 우승');
  for(const h of invalid){
   u.starts=Math.max(0,(u.starts||0)-1);
   u.points=(u.points||0)-(h.points||0);
   if(h.pos===1){u.wins=Math.max(0,(u.wins||0)-1);u.g1wins=Math.max(0,(u.g1wins||0)-1);}
   for(const records of [u.records?.[h.stage],u.yearRecords?.[h.year]?.data]){
    if(!records)continue;
    for(const key of new Set(['all',E.discipline(h)])){
     const rec=records[key];
     if(!rec)continue;
     rec.starts=Math.max(0,(rec.starts||0)-1);
     rec.points=(rec.points||0)-(h.points||0);
     if(h.pos===1){rec.wins=Math.max(0,(rec.wins||0)-1);rec.g1=Math.max(0,(rec.g1||0)-1);}
     if(rec.titles)rec.titles=rec.titles.filter(t=>t.race!==arcName||t.at!==h.at);
    }
   }
  }
  u.lastRaceAt=u.history[0]?.at??null;
 }
 if(S.g1Archive)S.g1Archive=S.g1Archive.filter(r=>r.race?.name!==arcName||r.winner?.team===0||(r.participants||[]).length);
 return S;
};

return E}
root.UmaRanch={init};if(typeof module!=='undefined')module.exports={init};
})(typeof window!=='undefined'?window:globalThis);
