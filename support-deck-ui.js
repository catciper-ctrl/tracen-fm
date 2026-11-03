/* Attribute symbols and direct editing of the runner's permanent support deck. */
const supportSymbols={
 Speed:'<path d="M9 7h12l-2 12 7 3v5H5v-6h10l1-6H9z"/><path d="M5 29h22" fill="none" stroke="currentColor" stroke-width="2"/>',
 Stamina:'<path d="M16 28 4 16C-3 5 11 0 16 9 21 0 35 5 28 16z"/>',
 Power:'<path d="m7 5 8-2 4 5-4 4-3-3-2 10c4-5 10-5 14-1 5 6 1 12-6 12H5L3 21z"/>',
 Guts:'<path d="M17 1c2 9 11 12 11 20 0 14-24 14-24 0 0-5 3-9 6-12-1 7 3 9 4 10 4-6 4-11 3-18zm0 17c-8 8-5 12 0 12s7-5 0-12z"/>',
 Wit:'<path d="m1 10 15-7 15 7-15 7zm6 7 9 4 9-4v9c-6 4-12 4-18 0zm22-3h2v12h-2z"/>',
 Pal:'<circle cx="16" cy="12" r="10"/><path d="m11 20-3 11h16l-3-11z"/><path d="M11 14q5 6 10 0" fill="none" stroke="var(--support-color)" stroke-width="2"/><circle cx="12" cy="10" r="1.3" fill="var(--support-color)"/><circle cx="20" cy="10" r="1.3" fill="var(--support-color)"/>',
 Group:'<circle cx="10" cy="11" r="7"/><circle cx="23" cy="11" r="7"/><path d="M5 18h10l4 13H1zm13 0h10l4 13H16z"/>'
};
supportTypeBadge=function(c){const label=E.supportTypeName(c);return `<span class="support-symbol type-${esc(c.type)}" title="${esc(label)}" role="img" aria-label="${esc(label)}"><svg viewBox="0 0 32 34" aria-hidden="true">${supportSymbols[c.type]||supportSymbols.Group}</svg></span>`};
function supportDeckCard(c,action,attrs=''){
 return `<button class="deck-art" data-action="${action}" ${attrs} aria-label="${esc(c.koCharacter+' · '+E.supportTypeName(c))}">${image(c)}${supportTypeBadge(c)}</button>`;
}
runnerSupports=function(u,owned){
 const slot=E.supportSlots(S,u),cards=u.supportCards.map(x=>E.supports.get(x.card)).filter(Boolean),available=owned&&slot.window&&slot.used<slot.limit&&slot.total<6&&u.trainingBoard?.at!==E.abs(S);
 const reason=slot.total>=6?'6장 편성 완료':u.trainingBoard?.at===E.abs(S)?'이번 턴 훈련 배치 확인 · 다음 턴에 장착 가능':!slot.window||slot.used>=slot.limit?'다음 장착 기간에 개방':'보유 카드를 선택해 편성하세요';
 return `<section class="support-deck"><header class="deck-heading"><div><span class="eyebrow">SUPPORT DECK</span><h3>서포트 편성 <small>${cards.length} / 6</small></h3></div><span>주니어 3장 · 클래식 +3장</span></header><div class="deck-grid">${Array.from({length:6},(_,i)=>{const c=cards[i],canFill=available&&i<cards.length+slot.limit-slot.used;return c?`<article>${supportDeckCard(c,'support',`data-id="${c.gameId}"`)}<b class="deck-name">${esc(c.koCharacter)}</b></article>`:`<article><button class="deck-empty" data-action="deckChoose" data-runner="${u.id}" ${canFill?'':'disabled'}><strong>${canFill?'+':'◇'}</strong><span>${canFill?'카드 편성':i>=3&&E.age(S,u)<2?'클래식 개방':'빈 슬롯'}</span></button></article>`}).join('')}</div><div class="deck-composition" aria-label="속성별 편성 장수">${Object.keys(supportSymbols).map(type=>{const count=cards.filter(c=>c.type===type).length;return `<span class="${count?'':'is-empty'}">${supportTypeBadge({type})}<b>×${count}</b><small>${esc(E.supportTypeName({type}))}</small></span>`}).join('')}</div><p class="deck-hint">${esc(reason)} · 장착 후 해제·교체 불가</p><div id="deckPicker"></div><details class="deck-rules"><summary>훈련 효과와 편성 규칙</summary><p>일반 출현 +1 · 속성 우정 +3 · 친구·그룹 우정 +2 노력치. 동일한 카드는 1장만 편성할 수 있습니다.</p></details></section>`;
};
function showDeckPicker(id,type='all'){
 const u=S.runners.find(u=>u.id===id);if(!u)return;
 const cards=Object.entries(S.supports).filter(([cid,n])=>n>0).map(([cid])=>E.supports.get(Number(cid))).filter(c=>c&&(type==='all'||c.type===type));
 $('#deckPicker').innerHTML=`<section class="deck-picker"><header><h3>보유 카드에서 편성</h3>${button('접기','deckPickerClose','','small')}</header><p>장착할 카드를 선택하세요. 영구 장착 전 카드와 스킬을 확인할 수 있습니다.</p><div class="deck-filters">${['all',...Object.keys(supportSymbols)].map(t=>button(t==='all'?'전체':supportTypeBadge({type:t}),'deckChoose',`data-runner="${id}" data-type="${t}"`,t===type?'active':'')).join('')}</div><div class="deck-picker-grid">${cards.map(c=>`<article>${supportDeckCard(c,'deckPreview',`data-runner="${id}" data-id="${c.gameId}"`)}<b>${esc(c.koCharacter)}</b><small>${esc(c.rarity)} · 보유 ${S.supports[c.gameId]}장</small>${E.hasSupportCard(u,c.gameId)?'<span class="deck-duplicate">이미 편성됨</span>':button('선택','deckPreview',`data-runner="${id}" data-id="${c.gameId}"`,'small')}</article>`).join('')||'<p>이 속성의 미장착 보유 카드가 없습니다.</p>'}</div></section>`;
 $('#deckPicker').scrollIntoView({behavior:'smooth',block:'nearest'});
}
window.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b||b.disabled||!S||busy)return;
 const a=b.dataset.action;if(!['deckChoose','deckPickerClose','deckPreview','deckReturn','deckAttach'].includes(a))return;
 e.preventDefault();e.stopImmediatePropagation();const id=Number(b.dataset.runner);
 if(a==='deckChoose')return showDeckPicker(id,b.dataset.type||'all');
 if(a==='deckPickerClose'){$('#deckPicker').innerHTML='';return}
 if(a==='deckReturn'){openRunner(id,'supports');showDeckPicker(id);return}
 if(a==='deckPreview'){
  detailFrames17.push(detailSnapshot17());detailPending17=true;openSupport(Number(b.dataset.id));
  const select=$('#supportRunner');select.value=String(id);select.disabled=true;updateSupportEquip26();
  const attach=$('#modalBody [data-action="useSupport"]');attach.dataset.action='deckAttach';attach.dataset.runner=String(id);return;
 }
 const result=E.useSupport(S,id,Number(b.dataset.id));if(result.error){toast(result.error);return}
 persist();render();detailFrames17.pop();openRunner(id,'supports');toast('서포트 카드 편성 완료');
},true);
