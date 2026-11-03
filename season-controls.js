/* Scout notifications and the race entry confirmation. */
function scoutAlertSettings(){
 const cfg=S.scoutAlertSettings??={four:false,five:false,ssr:false,watch:[]};
 if(!cfg.outfitWatch){
  cfg.watch=[...new Set((cfg.watch||[]).map(id=>E.outfits.get(Number(id))?.gameId??DB.outfits.find(o=>o.character===id)?.gameId).filter(Boolean))].slice(0,5);
  cfg.outfitWatch=true;
 }
 return cfg;
}
const previousScoutPage=scoutPage;
scoutPage=function(){
 if(scoutTab==='factor')return previousScoutPage();
 const cfg=scoutAlertSettings();
 const alertCard=(key,label,description)=>`<label class="scout-alert-card"><span><b>${label}</b><small>${description}</small></span><input type="checkbox" data-scout-alert="${key}" ${cfg[key]?'checked':''}></label>`;
 if(scoutTab==='support')return previousScoutPage(foldedSection('서포트 경매 알림',alertCard('ssr','SSR 서포트 카드','매월 전반 경매 목록에 SSR 카드가 등장하면 알려드립니다.'))+autoAuctionPanel());
 const watch=cfg.watch.map(id=>E.outfits.get(id)).filter(Boolean);
 const cards=watch.map(o=>`<button type="button" class="watch-outfit" data-action="dexItem" data-kind="outfits" data-id="${o.gameId}" aria-label="${esc(o.characterKo+' · '+o.ko+' 상세 보기')}">${image(o,'avatar')}<span><b>${esc(o.characterKo)}</b><small>${esc(o.ko)}</small></span></button>`).join('');
 return previousScoutPage(foldedSection('스카우트 알림',`<div class="scout-alert-layout"><section class="scout-rank-panel"><h3>성급 알림</h3><p>매월 전반 후보가 갱신될 때 알려드립니다.</p><div class="scout-rank-options">${alertCard('four','4성 이상','4성·5성 후보가 등장하면 알림')}${alertCard('five','5성만','5성 후보가 등장하면 알림')}</div></section><section class="scout-watch-panel"><header><h3>관심 의상 <small>${watch.length} / 5</small></h3>${button('육성 의상 도감 →','scoutWatchDex','','small')}</header><p class="note">도감에서 원하는 우마무스메의 육성 의상을 클릭한 뒤 <b>관심 설정</b>을 누르세요. 등록한 의상이 스카우트 후보에 등장하면 성급과 관계없이 알려드립니다.</p><div class="watch-tags">${cards||'<span class="note">등록한 관심 의상이 없습니다.</span>'}</div></section></div>`));
};
function watchOutfitButton(o){
 const watched=scoutAlertSettings().watch.includes(o.gameId);
 return button(watched?'★ 관심 해제':'☆ 관심 설정','watchOutfitToggle',`data-id="${o.gameId}" aria-pressed="${watched}"`,'small');
}
function showScoutArrival(){
 if(S.startup||S.turn%2!==0||S.scoutAlertSeenMonth===S.marketMonth)return;
 S.scoutAlertSeenMonth=S.marketMonth;
 const cfg=scoutAlertSettings();
 const umas=S.scouts.filter(c=>cfg.watch.includes(c.outfit)||cfg.four&&c.stars>=4||cfg.five&&c.stars===5);
 const cards=cfg.ssr?S.supportMarket.filter(a=>!a.sold&&E.supports.get(a.card)?.rarity==='SSR'):[];
 persist();
 if(!umas.length&&!cards.length)return;
 showModal(`<span class="eyebrow">SCOUT ALERT · ${date()}</span><h2>스카우트 신규 후보</h2><ul class="scout-arrivals">${umas.map(c=>{const o=E.outfits.get(c.outfit);return `<li>${image(o,'avatar')}<div><b>${esc(o.characterKo)} · ${c.stars}★</b><small>${esc(o.ko)}${cfg.watch.includes(o.gameId)?' · 관심 등록':''}</small></div></li>`}).join('')}${cards.map(a=>{const c=E.supports.get(a.card);return `<li>${image(c,'avatar')}<div><b>SSR · ${esc(c.koCharacter)}</b><small>${esc(c.ko)}</small></div></li>`}).join('')}</ul>${button('스카우트 열기','scoutAlertOpen',`data-tab="${umas.length?'uma':'support'}"`,'primary')}`);
}
function activityAptSkills(u){
 const aptitudeGroups=[['경기장',0,2],['거리',2,6],['각질',6,10]];
 const aptitudes=aptitudeGroups.map(([label,start,end])=>{
  const badges=u.apt.slice(start,end).map((value,i)=>{
   const grade=UmaFM.apt(value);
   return `<span class="activity-apt-badge">${esc(aptNames[start+i])}<b class="activity-grade g-${esc(grade)}">${esc(grade)}</b></span>`;
  }).join('');
  return `<div class="activity-badge-row"><b>${label}</b><div>${badges}</div></div>`;
 }).join('');
 const skillGroups=[['고유기',E.o(u).uniqueSkills.slice(-1)],['계승기',u.inheritEquipped||[]],['장착 스킬',u.equipped||[]]];
 const skills=skillGroups.map(([label,ids])=>{
  const badges=ids.map(id=>{
   const skill=E.skills.get(id);
   if(!skill)return '';
   return button(skillIcon(skill)+`<span>${esc(skill.name)}</span>`,'skill',`data-id="${id}" title="${esc(skill.name)}"`,'activity-skill-badge');
  }).join('');
  return `<div class="activity-badge-row"><b>${label}</b><div>${badges||'<small>없음</small>'}</div></div>`;
 }).join('');
 return `<section class="activity-apt-skills" aria-label="적성과 보유 스킬"><div>${aptitudes}</div><div>${skills}</div></section>`;
}
function openRaceLineup(u,key,style){
 const base=E.racesAt(S).find(r=>r.key===key);
 if(!base)return;
 const gate=E.raceEligibility(S,u,base);
 if(!gate.ok){toast(gate.why);return}
 const draft=structuredClone(S);
 draft.runners.find(v=>v.id===u.id).style=style;
 const race=E.playerRaceVariant(base,u.id);
 const field=E.withRng(draft,'races',()=>E.playerRaceField(draft,race)).filter(v=>v.id!==u.id);
 const terrain=base.terrain===2?1:0, distance=E.distType(base);
 const own=draft.runners.find(v=>v.id===u.id);
 const rows=[own,...field].map(v=>{
  const outfit=E.o(v),label=v.mob?v.mobName:name(v);
  const photo=v.mob?`<img class="avatar" src="${esc(v.mobImage)}" alt="">`:image(outfit,'avatar');
  const stats=statNames.map((_,i)=>`<td>${E.value(draft,v,i)}</td>`).join('');
  return `<tr class="${v.id===u.id?'lineup-own':''}"><th scope="row"><div class="lineup-runner">${photo}<span>${esc(label)}<small>${v.id===u.id?'내 주자 · 출전 대기 · ':''}${v.mob?'모브':esc(outfit.ko)} · ${esc(styleNames[v.style])}</small></span></div></th><td>${UmaFM.apt(v.apt[terrain])} / ${UmaFM.apt(v.apt[distance+2])}</td>${stats}</tr>`;
 }).join('');
 showModal(`<span class="eyebrow">RACE ENTRY · ${date()}</span><h2>${esc(base.name)} · 출주 명단</h2><div class="note strong-note">${esc(name(u))} · ${aptNames[terrain]} ${UmaFM.apt(u.apt[terrain])} · ${aptNames[distance+2]} ${UmaFM.apt(u.apt[distance+2])}</div><p>상대 주자 ${field.length} / ${base.entries-1}명</p><div class="race-lineup-table"><table><thead><tr><th>주자</th><th>경기장 / 거리</th>${statNames.map(n=>`<th>${esc(n)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><div class="row-actions">${button('출전 · 관전','raceLineupStart',`data-id="${u.id}" data-key="${esc(key)}" data-style="${style}"`,'primary')}${button('돌아가기','raceLineupBack',`data-id="${u.id}"`,'small')}</div>`);
 setModalCompletion('돌아가기','raceLineupBack',{id:String(u.id)});
}
document.addEventListener('change',e=>{
 const key=e.target.dataset.scoutAlert;
 if(!['four','five','ssr'].includes(key)||!S)return;
 scoutAlertSettings()[key]=e.target.checked;persist();
});
window.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');
 if(!b||b.disabled||!S||busy)return;
 const {action,id,key,style}=b.dataset;
 if(!['watchOutfitToggle','scoutWatchDex','scoutAlertOpen','raceLineup','raceLineupStart','raceLineupBack'].includes(action))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(action==='scoutAlertOpen'){closeModal();view='scout';scoutTab=b.dataset.tab;S.scoutViewedAt=S.marketMonth;persist();render();return}
 if(action==='scoutWatchDex'){closeModal();view='dex';dexTab='outfits';search='';render();window.scrollTo(0,0);return}
 if(action==='watchOutfitToggle'){
  const cfg=scoutAlertSettings(),outfit=Number(id);
  if(!E.outfits.has(outfit))return;
  const watched=cfg.watch.includes(outfit);
  if(watched)cfg.watch=cfg.watch.filter(x=>x!==outfit);
  else{
   if(cfg.watch.length>=5){toast('관심 의상은 최대 5개까지 등록할 수 있습니다.');return}
   cfg.watch.push(outfit);
  }
  b.textContent=watched?'☆ 관심 설정':'★ 관심 해제';
  b.setAttribute('aria-pressed',String(!watched));
  persist();if(view==='scout')render();return;
 }
 const u=S.runners.find(v=>v.id===Number(id));
 if(!u)return;
 if(action==='raceLineupBack'){activityPage(u,'races');return}
 if(action==='raceLineupStart'){raceActivity(id,key,Number(style));return}
 openRaceLineup(u,key,Number($('#activityStyle')?.value??$('#style-'+u.id)?.value??u.style));
},true);
