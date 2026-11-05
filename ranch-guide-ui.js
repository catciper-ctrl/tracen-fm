function fanNoticeHTML(){
 return `<section class="fan-notice"><h2>TRACEN FM · 2차창작 팬게임</h2><p>TRACEN FM은 《우마무스메 프리티 더비》를 바탕으로 팬이 제작한 무료·비영리 2차 창작 게임입니다. Cygames, Inc. 및 원작 관계사와 제휴하지 않은 독립 팬 프로젝트이며, 공식 게임이 아닙니다.</p><p>원작과 팬 문화를 존중하며, 다음 원칙에 따라 제작·운영합니다.</p><ol><li>원작 《우마무스메 프리티 더비》와 제삼자의 사상·명예 등을 훼손할 목적을 담지 않습니다.</li><li>폭력적·기괴하거나 흉측한 표현 및 성적 묘사를 포함하지 않습니다.</li><li>특정 정치·종교·신념을 과도하게 옹호하거나 폄하하지 않습니다.</li><li>반사회적인 표현을 담지 않습니다.</li><li>제삼자의 권리를 존중하며, 권리를 침해하는 콘텐츠를 제작하거나 게시하지 않는 것을 원칙으로 합니다.</li><li>상업적 이용이나 영리를 목적으로 하지 않으며, 비영리 팬 활동(동인 활동)의 범위에서 제작·운영합니다.</li></ol><p>원작의 명칭, 캐릭터, 일러스트 및 관련 상표와 저작권은 Cygames, Inc.와 각 권리자에게 귀속됩니다.</p><a href="https://umamusume.jp/derivativework_guidelines/" target="_blank" rel="noopener noreferrer">우마무스메 공식 2차 창작 가이드라인 ↗</a></section>`;
}
/* A short handbook shared by new careers and the in-game help button. */
let ranchSetupReady=false;
const ranchGuide=[
 {tag:'1. 능력치',title:'스탯은 어떻게 올리나요?',facts:[['18~30','능력치별 개체값'],['300','훈련 노력치 총량'],['100','능력치별 상한']],text:[
  '스피드·스태미나·파워·근성·지능에는 영입할 때 정해지는 개체값이 있습니다.',
  '활동 → 트레이닝에서 키울 능력치를 선택하세요. 훈련으로 얻은 노력치가 해당 능력치를 올리고, 청인자를 계승하면 별 등급에 따라 해당 능력치에 +3 / +6 / +10을 더합니다.'
 ]},
 {tag:'2. 스킬',title:'스킬은 어떻게 얻나요?',facts:[['내장기','의상 고유 스킬'],['서포트','장착 카드의 스킬'],['백인자','일반 스킬'],['녹인자','계승기']],text:[
  '우마무스메 → 획득 스킬에서 의상에 내장된 스킬을 확인하세요. 서포트 카드를 장착하면 카드가 제공하는 스킬이 해금되고, 일부 스킬은 하위 스킬을 먼저 배워야 합니다.',
  '인자를 계승하면 백인자의 스킬은 각각 50% 확률로 즉시 습득합니다. 녹인자는 원본 우마무스메의 계승기를 해금하며, 해금한 계승기는 스킬 Pt로 배울 수 있습니다.'
 ]},
 {tag:'2-1. 스킬 Pt',title:'스킬 포인트는 어떻게 얻나요?',facts:[['트레이닝','훈련 보상'],['레이스','착순 · 라이벌'],['JRA','연말 수상 보상']],text:[
  '트레이닝을 마치면 노력치와 함께 스킬 Pt를 얻습니다. 레이스에서는 경기 결과에 따라 스킬 Pt를 받고, 지정 라이벌보다 먼저 결승선을 통과하면 추가 Pt가 들어옵니다.',
  '연말 JRA 수상 보상에도 스킬 Pt가 포함됩니다. 은퇴 후 받는 현창에는 스킬 Pt가 지급되지 않습니다.'
 ]},
 {tag:'3. 적성',title:'적성은 어떻게 올리나요?',comparison:{title:'적인자 성급별 확률',headers:['성급','1단계 상승','2단계 상승','변화 없음'],rows:[['★','40%','—','60%'],['★★','60%','—','40%'],['★★★','50%','25%','25%']]},text:[
  '우마무스메 → 인자 계승에서 목표 레이스에 맞는 주로·거리·각질 적성을 올려주는 적인자를 고르세요. 3성 적인자로 2단계 상승하면 C에서 A가 됩니다.',
  '나머지 확률에서는 적성이 그대로이며, 최고 등급은 S입니다.'
 ]}
];
const titleRankOrder={R:1,SR:2,SSR:3};
function titleRankBadge(grade){return titleRankOrder[grade]?`<span class="title-rank rank-${grade}">${grade}</span>`:''}
function runnerTopTitles(u){
 const best=(u.titles||[]).filter(t=>E.titleGrade(t.name)).slice().sort((a,b)=>titleRankOrder[E.titleGrade(b.name)]-titleRankOrder[E.titleGrade(a.name)]||(b.at||0)-(a.at||0)).slice(0,2);
 return `<div class="runner-top-titles" aria-label="대표 타이틀">${best.map(t=>`<div title="${esc(t.name)}">${titleRankBadge(E.titleGrade(t.name))}<span>${esc(t.name)}</span></div>`).join('')||'<small>획득 타이틀 없음</small>'}</div>`;
}
const classicNewsItem=newsItem;
function newsTitleGrade(n){
 if(n.achievementLabel==='JRA 연도대표')return 'SR';
 if(n.titleGrade)return n.titleGrade;
 if(n.tripleSeries||['봄·가을 6관','JRA 현창'].includes(n.achievementLabel))return 'SSR';
 return n.kind==='awards'&&/최우수/.test(n.title)?'SR':null;
}
newsItem=function(n){
 const grade=newsTitleGrade(n),category=grade?'타이틀':n.kind==='awards'?'JRA 시상식':n.kind==='race'||n.kind==='upset'?'레이스':'학원 소식';
 return classicNewsItem(n).replace('<h3>',`<span class="news-category">${titleRankBadge(grade)} ${category}</span><h3>`);
};
let ranchNewsTab='all';
pages.news=()=>{
 const news=S.news.filter(n=>ranchNewsTab==='all'||ranchNewsTab==='title'&&newsTitleGrade(n)||ranchNewsTab==='own'&&(n.playerRelated||n.team===0));
 return `<div class="tabs page-tabs">${[['all','전체 소식'],['own','우리 학원'],['title','타이틀']].map(([key,label])=>button(label,'ranchNewsTab',`data-key="${key}"`,key===ranchNewsTab?'active':'')).join('')}</div>${panel('최신 소식',`<div class="news-feed">${news.slice(0,100).map(newsItem).join('')||empty('아직 도착한 소식이 없습니다.')}</div>`)}`;
};
const guideHome=pages.home;
pages.home=()=>guideHome();
function welcome(){
 const action=ranchSetupReady?`<label>학원 이름 <span class="club-name-field"><input id="clubName" maxlength="16" value="트레센" aria-label="학원 이름"><b>학원</b></span></label><p class="club-name-help">이름만 입력하면 뒤에 ‘학원’이 붙습니다.</p>${button('학원 설립하기 →','new','','primary')}`:
 `<div class="welcome-first-turn"><span>01 가이드</span><span>02 학원 이름</span><span>03 첫 영입</span></div>${button('새 커리어 시작 →','ranchSetup','','primary')}`;
 return `<main class="welcome ranch-welcome"><div class="welcome-copy"><div class="brand"><span class="brand-mark">T✦</span><div>TRACEN <b>FM</b><small>UMA MUSUME ACADEMY MANAGER</small></div></div><span class="eyebrow">트레센 학원 매니저</span><h1 class="welcome-title"><span>우마무스메 학원을</span><span>운영하세요.</span></h1><p>주자를 영입하고, 훈련을 설계하고, 첫 레이스에 도전하세요. 은퇴한 주자의 인자는 다음 세대의 출발점이 됩니다.</p>${action}<div class="welcome-secondary">${button('저장 파일 불러오기','import','','small')}</div><a class="welcome-guide-link" href="#welcome-handbook"><span><strong>운영 가이드</strong><small>육성부터 학원 운영까지 한눈에</small></span><b aria-hidden="true">↓</b></a><small class="welcome-note">우마무스메 비공식 팬게임 · 브라우저 자동 저장</small></div><div class="welcome-art welcome-stadium"><img src="images/welcome-stadium-hq.webp" alt="푸른 하늘과 관중석 앞에서 응원하는 우마무스메" fetchpriority="high"></div></main>${handbookHTML(true)}<footer class="fan-notice-footer">${fanNoticeHTML()}</footer>`;
}
const managementGuide=[
 {tag:'1. 영입',title:'우마무스메는 어디서 영입하나요?',comparison:{title:'개체값 총합별 별 등급',headers:['개체값 총합','별 등급'],rows:[['138~150','★★★★★'],['126~137','★★★★'],['115~125','★★★'],['103~114','★★'],['90~102','★']]},text:[
  '스카우트의 우마무스메 후보에서 의상, 적성, 개체값을 확인하고 계약하세요. 성급은 다섯 능력치의 개체값을 합산한 등급입니다. 목표 레이스의 적성과 스킬도 함께 확인하세요.',
  '영입 직후에는 미데뷔 상태입니다. 1월 전반에 데뷔반에서 주니어로 등록하고, 6월 전반 신마전에 도전하세요. 학원 정원은 10명이고 현역은 최대 4명입니다.'
 ]},
 {tag:'2. 서포트',title:'서포트 카드는 어디서 구하나요?',comparison:{title:'레이스 추가 뽑기권',headers:['등급','1착','2착','3착'],rows:[['GⅠ','3장','2장','1장'],['GⅡ','2장','1장','1장'],['GⅢ','1장','—','—']]},text:[
  '서포트 카드 → 가챠에서 뽑기권을 사용하세요. 턴을 마칠 때 기본 1장을 받고, 레이스 등급과 착순에 따라 추가로 받습니다.',
  '원하는 카드가 스카우트 경매에 나오면 입찰할 수 있습니다. 합성에서는 R 재료 3개로 SR 재료(75%), SR 재료 3개로 SSR 카드(60%) 획득에 도전합니다. 실패 시 재료 3개는 모두 소모되며, SSR 2장은 재합성할 수 있습니다. 주니어에 3장, 클래식에 추가 3장을 장착할 수 있습니다.'
 ]},
 {tag:'3. 인자',title:'인자는 어디서 구하나요?',facts:[['은퇴','영구 인자'],['인자 경매','1회 대여']],text:[
  '우마무스메를 은퇴시키면 영구 인자를 얻을 수 있습니다. 청·적·녹인자는 1~3성이며, 청·적 성급은 확률로 정해집니다. 청인자는 다섯 능력치 중 하나를 각각 20% 확률로 뽑고, 뽑힌 기초능력치가 높을수록 높은 성급이 나올 가능성이 커집니다. 적인자는 해당 적성이 높을수록 높은 성급이 나올 가능성이 커집니다. 녹인자 성급은 무작위입니다.',
  '스카우트의 인자 경매에서 낙찰받은 대여 인자는 계승에 한 번 쓰면 반환됩니다. 인자는 합계 20개까지 보유하며, 가득 차면 새 인자나 기존 인자 중 하나를 포기할 수 있습니다.'
 ]},
 {tag:'4. 자금',title:'돈은 어떻게 모으나요?',facts:[['레이스','착순별 상금'],['JRA','연말 수상 상금'],['팬 수익','월말 정산']],text:[
  '레이스에 출전해 착순에 따른 상금을 받으세요. 연말 JRA 시상식에서 소속 우마무스메가 수상하면 학원에 상금이 들어옵니다.',
  '현역 우마무스메의 팬 수에 따라 매월 후반 종료 시 팬 수익을 받습니다. 레이스를 통해 팬을 모으고, 재정 메뉴에서 상금·팬 수익과 운영비·경매 지출을 함께 확인하세요.'
 ]}
];
function handbookComparison({title,headers,rows}){
 return `<table class="handbook-comparison"><caption>${title}</caption><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,...cells])=>`<tr><th scope="row">${label}</th>${cells.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function handbookHTML(inline=false){
 const sections=[['우마무스메를 육성하세요',ranchGuide],['학원을 운영하세요',managementGuide]];
 return `<section class="ranch-handbook handbook-scroll ${inline?'handbook-inline':''}" ${inline?'id="welcome-handbook"':''}><header><span class="eyebrow">TRACEN FM · 운영 가이드</span></header>
 ${sections.map(([title,pages])=>`<section class="handbook-chapter"><h2>${title}</h2>${pages.map(g=>
  `<article class="handbook-topic"><h3>${g.tag.split(' ')[0]} ${g.title}</h3>${g.comparison?handbookComparison(g.comparison):`<div class="handbook-facts">${g.facts.map(([value,label])=>`<div><b>${value}</b><small>${label}</small></div>`).join('')}</div>`}<div class="handbook-copy">${g.text.map(p=>`<p>${p}</p>`).join('')}</div></article>`
 ).join('')}</section>`).join('')}
 ${inline?'':`<footer>${button('닫기','close','','primary')}</footer>`}</section>`;
}
function openRanchGuide(){showModal(handbookHTML())}
rules=()=>openRanchGuide();
const handbookShell=shell;
shell=function(){
 return handbookShell()+button('가이드','ranchGuide','','ranch-guide-corner');
};
window.addEventListener('click',event=>{
 const b=event.target.closest('[data-action]');
 if(!b||b.disabled||!['ranchGuide','ranchSetup','ranchNewsTab'].includes(b.dataset.action))return;
 event.preventDefault();event.stopImmediatePropagation();
 if(b.dataset.action==='ranchNewsTab'){ranchNewsTab=b.dataset.key;render();return}
 if(b.dataset.action==='ranchSetup'){ranchSetupReady=true;closeModal();render();$('#clubName')?.focus();return}
 openRanchGuide(Number(b.dataset.index)||0,b.dataset.setup==='1');
},true);

const summaryObserver=new ResizeObserver(entries=>{
 for(const {target:row} of entries){
  row.style.setProperty('--summary-size','11px');
  if(row.scrollWidth<=row.clientWidth)continue;
  let low=1,high=11;
  for(let step=0;step<8;step++){
   const size=(low+high)/2;
   row.style.setProperty('--summary-size',size+'px');
   if(row.scrollWidth<=row.clientWidth)low=size;
   else high=size;
  }
  row.style.setProperty('--summary-size',low+'px');
 }
});
const renderWithSummary=render;
render=function(){
 renderWithSummary();
 summaryObserver.disconnect();
 document.querySelectorAll('.runner-card .runner-tags').forEach(row=>summaryObserver.observe(row));
};

function runnerTitlesHTML(u){
 const titles=(u.titles||[]).filter(t=>E.titleGrade(t.name)).slice().sort((a,b)=>
  titleRankOrder[E.titleGrade(b.name)]-titleRankOrder[E.titleGrade(a.name)]||(b.at||0)-(a.at||0));
 return `<h3 class="subheading">보유 타이틀 ${titles.length}개</h3><div class="runner-title-list">${titles.map(t=>`<div>${titleRankBadge(E.titleGrade(t.name))}<b>${esc(t.name)}</b>${Number.isInteger(t.at)?`<small>${date(t.at%24,Math.floor(t.at/24)+1)}</small>`:''}</div>`).join('')||empty('획득한 타이틀이 없습니다.')}</div><h3 class="subheading">JRA 수상 기록</h3><div class="award-grid">${(u.awards||[]).map(awardHTML).join('')||'수상 없음'}</div>`;
}
function openFactorInbox(){
 const incoming=E.pendingFactors(S)[0];
 if(!incoming)return;
 const owned=E.ownedFactors(S);
 showModal(`<span class="eyebrow">인자 보관함</span><h2>새 인자를 보유할까요?</h2><p>보유 ${owned.length} / 20개 · 획득 대기 ${E.pendingFactors(S).length}개</p><div class="inbox-incoming">${factorCard(incoming)}</div>${owned.length>=20?`<label>교체할 기존 인자<select id="factorInboxDiscard"><option value="">기존 인자 선택</option>${owned.map(f=>`<option value="${f.id}">${esc(f.name)} · ${esc(E.outfits.get(f.outfit)?.ko||'')} · 청 ${esc(statNames[f.blue.stat])} ${f.blue.stars}★ · ${f.rental?'대여':'영구'} #${f.id}</option>`).join('')}</select></label>`:''}<div class="row-actions">${button(owned.length>=20?'선택한 인자와 교체':'새 인자 보유','factorInboxKeep',`data-id="${incoming.id}"`,'primary')}${button('새 인자 획득 포기','factorInboxPass',`data-id="${incoming.id}"`,'small')}</div>`);
}
const renderCapacity=render;
let lastFactorPrompt=null;
function scheduleFactorInbox(){
 const incoming=S&&!S.startup&&!S.pendingTurn&&E.pendingFactors(S)[0];
 if(!incoming||lastFactorPrompt===incoming.id||$('#modal').open||busy)return;
 lastFactorPrompt=incoming.id;openFactorInbox();
}
render=function(){
 renderCapacity();
 if(!S||S.startup)return;
 const pending=E.pendingFactors(S);
 if(pending.length)document.querySelector('.page')?.insertAdjacentHTML('afterbegin',`<div class="factor-inbox-banner"><b>획득 대기 인자 ${pending.length}개</b>${button('보유할 인자 선택','factorInbox','','small')}</div>`);
 setTimeout(scheduleFactorInbox,0);
};
$('#modal').addEventListener('close',()=>setTimeout(scheduleFactorInbox,0));
window.addEventListener('click',event=>{
 const b=event.target.closest('[data-action]');
 if(!b||b.disabled||!S||busy||!['factorInbox','factorInboxKeep','factorInboxPass'].includes(b.dataset.action))return;
 event.preventDefault();event.stopImmediatePropagation();
 if(S.pendingTurn){showReport();return}
 if(b.dataset.action==='factorInbox'){openFactorInbox();return}
 const id=Number(b.dataset.id),discard=b.dataset.action==='factorInboxPass'?id:Number($('#factorInboxDiscard')?.value)||null;
 if(mutate(E.resolveFactorInbox(S,id,discard))){closeModal();if(E.pendingFactors(S).length)openFactorInbox()}
},true);

// Read-only detail links keep the preceding dialog as their back destination.
const detailDialogActions=new Set([
  'skill','support','runner','historicalRunner','dexItem','race','raceDexItem',
  'raceAtlasCourse','raceLineup','result','outfitPreview','career','statusInfo'
]);
const detailDialogParents=[];
let detailDialogOrigin=null;
const renderDetailDialog=showModal;
showModal=function(html){
  const modal=$('#modal'),body=$('#modalBody');
  if(!modal.open)detailDialogParents.length=0;
  if(modal.open&&detailDialogOrigin){
    const close=modal.querySelector('.modal-close');
    detailDialogParents.push({
      nodes:[...body.childNodes],close:close.cloneNode(true),
      scroll:body.scrollTop,modalScroll:modal.scrollTop,kind:modalKind,
      ...detailDialogOrigin
    });
    detailDialogOrigin=null;
  }
  renderDetailDialog(html);
};
window.addEventListener('click',e=>{
  const modal=$('#modal'),button=e.target.closest('[data-action]');
  if(!modal.open||!button||button.disabled)return;
  const action=button.dataset.action;
  if(!modal.contains(button)||action==='nav'||action==='replay'){
    detailDialogParents.length=0;
    return;
  }
  if(detailDialogParents.length&&button.matches('.modal-close')
    &&['close','activityFinish','report'].includes(action)){
    restoreDetailDialog(e);
    return;
  }
  if(detailDialogActions.has(action)){
    detailDialogOrigin={runner:selected,tab,focus:button};
    queueMicrotask(()=>{detailDialogOrigin=null});
  }
},true);
function restoreDetailDialog(e){
  if(!detailDialogParents.length)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const parent=detailDialogParents.pop(),modal=$('#modal'),body=$('#modalBody');
  body.replaceChildren(...parent.nodes);
  modal.querySelector('.modal-close').replaceWith(parent.close);
  modalKind=parent.kind;
  selected=parent.runner;
  tab=parent.tab;
  parent.focus.focus({preventScroll:true});
  body.scrollTop=parent.scroll;
  modal.scrollTop=parent.modalScroll;
}
document.addEventListener('cancel',e=>{if(e.target===$('#modal'))restoreDetailDialog(e)},true);

const ranchPageIntros={
 home:{label:'YOUR ACADEMY',title:'오늘의 일정',icon:'◷',description:'주자를 키우고 다음 승리를 준비하세요.',metric:()=>['현재 일정',date()]},
 scout:{label:'SCOUTING',title:'스카우트',icon:'⌕',description:'우마무스메 후보를 살펴보고 서포트 카드와 인자 경매에 참여하세요.',metric:()=>['스카우트 레벨','Lv. '+S.fac.scout]},
 activities:{label:'TRAINING & RACING',title:'오늘의 활동',icon:'◷',description:'훈련·휴식·레이스 중 이번 턴에 할 활동을 선택하세요.',metric:()=>['활동 가능',E.active(S).filter(u=>E.canAct(S,u)).length+'명']},
 rivals:{label:'RIVAL WATCH',title:'라이벌',icon:'⇄',description:'내 우마무스메별 라이벌과 상대 전적을 확인하세요.',metric:()=>['학원 현역',E.active(S).length+'명']},
 ranking:{label:'SEASON STANDINGS',title:'시즌 랭킹',icon:'↗',description:'연차와 거리 부문을 선택해 이번 시즌의 순위를 비교하세요.',metric:()=>['시즌',E.calendarYear(S)+'년']},
 news:{label:'TRACEN NEWSROOM',title:'트레센 뉴스룸',icon:'▤',description:'레이스 결과와 라이벌 소식, 주요 타이틀을 확인하세요.',metric:()=>['현재 턴',date()]}
};
for(const [key,intro] of Object.entries(ranchPageIntros)){
 const content=pages[key];
 pages[key]=()=>{
  const [label,value]=intro.metric();
  const level=S.fac.scout,slots=key==='scout'?E.marketSlots(level):null;
  const scoutInfo=slots?`<div class="scout-banner-info"><b>스카우트 네트워크 Lv.${level}</b><div class="scout-banner-slots"><span>후보 ${slots.uma}명</span><span>서포트 ${slots.support}칸</span><span>인자 ${slots.factor}칸</span><span>SSR ${Math.round(slots.ssr*100)}% · SR 재료 25% · R 재료 ${75-Math.round(slots.ssr*100)}%</span></div>${button(level>=5?'최대 확장':'후보 칸 확장 · '+money(35000*level**2),'upgrade',`data-key="scout" ${level>=5?'disabled':''} title="확장할 때 우마무스메 후보 +2칸 · 별 등급 확률 고정"`,'small')}</div>`:'';

  let body=content();
  if(key==='home')body=body.replace(/<section class="activity-hero">[\s\S]*?<div class="today-counters">([\s\S]*?)<\/div><\/section>/, '<section class="home-turn-overview"><div class="today-counters">$1</div></section>');
  const art=key==='home'?'activity-hero':'menu-'+key;
  return `<section class="ranch-page-intro intro-${key}"><div class="ranch-intro-copy"><span class="eyebrow">${intro.label}</span><h2>${intro.title}</h2><p>${intro.description}</p><div class="intro-footer"><div class="ranch-intro-metric"><small>${label}</small><b>${esc(value)}</b></div>${key==='home'?button('활동 시작 →','nav','data-view="activities"','lime'):''}</div></div><img class="ranch-intro-art" src="images/${art}.webp" alt="${intro.title} 대표 이미지" decoding="async"></section>${scoutInfo?`<section class="scout-tools">${scoutInfo}</section>`:''}${body}`;
 };
}
