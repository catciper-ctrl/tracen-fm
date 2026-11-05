/* Field interactions. Empirical duel/spot-struggle rules: uma.moe research, audited 2026-11-02.
 * Physical lane choice/blocking is the FM full-field adaptation, kept separate from stat equations.
 */
(function(root){'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const LABELS={finished:'완주',paceDown:'페이스 조절',paceUp:'선두 위치 확보',spot:'초반 선두 경합',duel:'최종 직선 접전',blocked:'앞이 막힘',overtake:'추월 준비',spurt:'라스트 스퍼트',exhausted:'지구력 소진',downhill:'내리막 모드',rushed:'흥분',cruise:'페이스 유지'};
function init(x){x.field??={spot:false,spotUntil:0,spotExited:false,duel:false,duelUsed:false,near:new Map(),blocking:null,lastMode:'cruise'};x.diagnostics??={startDelay:x.delay,blockedSeconds:0,blockingIncidents:0,spotSeconds:0,duelSeconds:0,paceDownSeconds:0,paceUpSeconds:0,overtakes:0,spurtAt:null,exhaustedAt:null,extraDistance:0,splits:[]};return x.field}
function update(rows,ctx){const {time:t,dt,distance:d,course,physics:P,emit=()=>{}}=ctx,width=24,live=rows.filter(x=>x.finish===null),leaders=live.slice().sort((a,b)=>b.m-a.m||a.index-b.index),lead=leaders[0];if(!lead)return;
for(const x of rows){init(x);x.field.spotSpeed=x.field.duelSpeed=x.field.duelAccel=0}
const state=ctx.state;
// Spot struggle is one shared trigger for ordinary front runners; runaway is not part of this game.
const front=leaders.filter(x=>x.u.style===0),anchor=front[0];if(!state.spotTriggered&&lead.m>=150&&anchor){const group=front.filter(x=>anchor.m-x.m<3.75&&Math.abs(anchor.lane-x.lane)<.165);if(group.length>=2&&group.some(x=>x.m<=d*6/24)){state.spotTriggered=true;state.spotGroup=group.map(x=>x.u.id);for(const x of group){const guts=x.modified?.[3]||x.stats[3]*12,fit=P.styleFit[x.u.apt[6]];x.field.spot=true;x.field.spotUntil=t+Math.sqrt(700*guts)*.012*fit;emit({type:'spot',runner:x.u.id,t,distance:x.m,action:'start',text:'초반 선두 경합 시작'})}}}
const spotRows=rows.filter(x=>state.spotGroup?.includes(x.u.id));for(const x of spotRows){const f=x.field;if(!f.spot)continue;let why='';if(t>=f.spotUntil||x.m>=d*9/24||x.finish!==null)why='경합 구간 종료';else{const other=spotRows.filter(y=>y!==x&&!y.field.spotExited);if(other.length&&other.every(y=>y.m-x.m>=5||Math.abs(y.lane-x.lane)>=.416)){why='경합 상대와 거리 벌어짐';f.spotExited=true}}if(why){f.spot=false;emit({type:'spot',runner:x.u.id,t,distance:x.m,action:'end',text:why})}else{f.spotSpeed=Math.pow(500*(x.modified?.[3]||x.stats[3]*12),.6)*.0001;x.diagnostics.spotSeconds+=dt}}
if(spotRows.length&&spotRows.filter(x=>!x.field.spotExited).length===1&&spotRows.some(x=>x.field.spotExited)){const last=spotRows.find(x=>!x.field.spotExited);if(last.field.spot){last.field.spot=false;last.field.spotExited=true;emit({type:'spot',runner:last.u.id,t,distance:last.m,action:'end',text:'경합 상대 이탈'})}}
// Duel proximity must persist 2s; HP/speed/order are checked only on the entry frame.
const finalStart=course.straights.at(-1)?.start??d*.8;
for(let i=0;i<live.length;i++)for(let j=i+1;j<live.length;j++){const a=live[i],b=live[j],af=a.field,bf=b.field,close=Math.abs(a.m-b.m)<=3&&Math.abs(a.lane-b.lane)<=.25&&Math.min(a.m,b.m)>=finalStart,near=close?(af.near.get(b.u.id)||0)+dt:0;af.near.set(b.u.id,near);bf.near.set(a.u.id,near);if(near+1e-8<2||(af.duelUsed&&!af.duel)||(bf.duelUsed&&!bf.duel)||(af.duelUsed&&bf.duelUsed)||Math.abs(a.v-b.v)>.6||Math.min(a.hp/a.maxHp,b.hp/b.maxHp)<.15||Math.min(a.rank,b.rank)>rows.length*.5)continue;for(const x of [a,b]){if(x.field.duelUsed)continue;x.field.duel=x.field.duelUsed=true;x.duels=(x.duels||0)+1;emit({type:'duel',runner:x.u.id,t,distance:x.m,action:'start',text:'최종 직선 접전 시작'})}}
const duelers=rows.filter(x=>x.field.duelUsed);for(const x of duelers){const f=x.field;if(!f.duel)continue;const other=duelers.filter(y=>y!==x),why=x.hp/x.maxHp<.05?'HP 5% 미만':x.finish!==null?'결승선 통과':other.length&&other.every(y=>Math.abs(y.m-x.m)>=5)?'접전 상대와 5m 이상 분리':'';if(why){f.duel=false;emit({type:'duel',runner:x.u.id,t,distance:x.m,action:'end',text:why})}else{const guts=x.modified?.[3]||x.stats[3]*12;f.duelSpeed=Math.pow(200*guts,.708)*.0001;f.duelAccel=Math.pow(160*guts,.59)*.0001;x.diagnostics.duelSeconds+=dt}}
for(const x of live){const f=x.field,same=y=>Math.abs(y.lane-x.lane)*width<.50,front=live.filter(y=>y!==x&&y.m>x.m&&y.m-x.m<4&&same(y)).sort((a,b)=>a.m-b.m)[0],was=f.blocking;f.blocking=front?.u.id??null;x.block=front?x.block+dt:0;x.sideBlock=live.some(y=>y!==x&&Math.abs(y.m-x.m)<2&&Math.abs(y.lane-x.lane)*width<1.5)?x.sideBlock+dt:0;
if(front){x.diagnostics.blockedSeconds+=dt;if(!was){x.diagnostics.blockingIncidents++;emit({type:'blocked',runner:x.u.id,target:front.u.id,t,distance:x.m,action:'start',text:'앞 주자에게 막힘'})}}else if(was)emit({type:'blocked',runner:x.u.id,target:was,t,distance:x.m,action:'end',text:'진로 확보'});
// Keep the chosen physical lane clear. Passing requires lateral travel rather than a rank-slot jump.
if(t>=x.nextDecision){
 x.nextDecision=t+.5;
 const corner=course.corners.some(c=>x.m>=c.start&&x.m<c.start+c.length);
 const opening=!x.dash&&x.m<(course.corners[0]?.start??0);
 const lanes=Array.from({length:24},(_,i)=>(i+.5)/24);
 const free=lanes.filter(l=>!live.some(y=>y!==x&&Math.abs(y.m-x.m)<3&&Math.abs(y.lane-l)*width<.62));
 if(opening&&!front){
  const inside=free.filter(l=>l<x.lane).reverse().find(l=>!live.some(y=>y!==x&&
   Math.abs(y.m-x.m)<4&&Math.max(l-y.lane,y.lane-x.lane)*width<.62));
  x.targetLane=inside??x.lane;
 }else if(free.length){
  free.sort((a,b)=>(Math.abs(a-x.lane)*(corner?.2:1)+(corner?a:0))-(Math.abs(b-x.lane)*(corner?.2:1)+(corner?b:0)));
  if(front||corner&&free[0]<x.lane)x.targetLane=free[0];
 }
}
const lateralSpeed=.02*ctx.base+.001*Math.sqrt(500*(x.modified?.[2]||x.stats[2]*12));x.lane=clamp(x.lane+clamp(x.targetLane-x.lane,-dt*lateralSpeed/width,dt*lateralSpeed/width),.02,.98);f.front=front?{m:front.m,v:front.v,lane:front.lane,finish:front.finish}:null;}
}
function constrain(x,speed,ctx){const front=x.field.front;if(!front||front.finish!==null||Math.abs(front.lane-x.lane)*24>=.50)return speed;const room=Math.max(0,front.m-x.m-1.2),limit=front.v+room/Math.max(ctx.dt,.01);return Math.min(speed,Math.max(3,limit))}
function mode(x,t){return x.finish!==null?'finished':x.hp<=0?'exhausted':x.field.duel?'duel':x.field.spot?'spot':x.block>0?'blocked':x.spurt?'spurt':t<x.temptedUntil?'rushed':x.paceDown?'paceDown':x.paceUp?'paceUp':x.downhill?'downhill':Math.abs(x.targetLane-x.lane)>.015?'overtake':'cruise'}
function checkpoint(x,t,emit){const next=mode(x,t);if(next!==x.field.lastMode){emit({type:next,runner:x.u.id,t,distance:x.m,action:'state',text:LABELS[next]});x.field.lastMode=next}const z=x.diagnostics;if(x.spurt&&z.spurtAt===null){z.spurtAt={t,distance:x.m,hp:x.hp/x.maxHp*100};emit({type:'spurt',runner:x.u.id,t,distance:x.m,action:'start',text:'라스트 스퍼트 시작'})}if(x.hp<=0&&z.exhaustedAt===null)z.exhaustedAt={t,distance:x.m};}
const api={init,update,constrain,mode,checkpoint,LABELS};root.UmaRaceMechanics=api;if(typeof module!=='undefined')module.exports=api;})(typeof window!=='undefined'?window:globalThis);
