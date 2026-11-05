/* Stable save envelope. Add ordered migrations when persistent data changes.
 * Keep format/storage IDs independent of the game's display name. */
(function(root){'use strict';
const FORMAT='tracen-fm',VERSION=2;
class SaveError extends Error{constructor(message){super(message);this.name='SaveError'}}
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function list(o,key){if(o[key]==null)o[key]=[];else if(!Array.isArray(o[key]))throw new SaveError(key+' 항목이 배열이 아닙니다. 원본 저장을 확인하세요.');return o[key]}
function map(o,key,fallback={}){if(o[key]==null)o[key]=structuredClone(fallback);else if(!object(o[key]))throw new SaveError(key+' 항목의 형식이 잘못되었습니다.');return o[key]}
function legacyDefaults(S,E){
 for(const k of ['results','factors','news','ledger','hall','awards','scouts','supportMarket','factorMarket'])list(S,k);
 for(const k of ['supports','inventory','raceFields'])map(S,k);
 map(S,'fac',{training:1,medical:1,scout:1});
 const runners=[...S.runners,...Object.values(S.recordArchive||{}),...S.hall.map(h=>h.runner).filter(object)];
 for(const u of new Set(runners)){
  if(!object(u))throw new SaveError('우마무스메 정보가 손상되었습니다.');
  if(typeof u.outfit==='string'&&/^\d+$/.test(u.outfit))u.outfit=Number(u.outfit);
  if(!E.outfits.has(u.outfit))throw new SaveError('현재 데이터에서 의상 ID '+String(u.outfit)+'을 찾을 수 없습니다. 원본을 보관하고 호환 변환을 요청하세요.');
  for(const k of ['known','learned','equipped','innate','evolved','inheritKnown','inheritLearned','inheritEquipped','usedFactors','factorWindows','supportCards','history','reservations','inheritanceHistory'])list(u,k);
  for(const [k,fallback] of [['iv',[24,24,24,24,24]],['ev',[0,0,0,0,0]],['factorBonus',[0,0,0,0,0]]]){
   if(u[k]==null)u[k]=fallback.slice();
   if(!Array.isArray(u[k])||u[k].length!==5||u[k].some(v=>!Number.isFinite(v)))throw new SaveError('우마무스메 '+u.id+'의 '+k+' 정보가 손상되었습니다.');
  }
  if(u.apt==null)u.apt=E.outfits.get(u.outfit).aptitudes.map(a=>['G','F','E','D','C','B','A','S'].indexOf(a));
  if(!Array.isArray(u.apt)||u.apt.length!==10||u.apt.some(a=>!Number.isInteger(a)||a<0||a>7))throw new SaveError('우마무스메 '+u.id+'의 적성 정보가 잘못되었습니다.');
  u.retired??=false;u.status??=u.retired?'retired':u.debutYear!=null||u.starts?'active':'undebuted';
  u.sp??=0;u.fans??=0;u.style??=E.bestStyle(u);
  for(const k of ['wins','starts','points','seasonPoints','training','g1wins'])u[k]??=0;
  // stats is derived in the current engine; older saves may omit it or contain decimals.
  if(S.rulesVersion!==2&&(!Array.isArray(u.stats)||u.stats.length!==5))throw new SaveError('초기 버전 저장의 기초 능력치가 누락되었습니다.');
 }
 S.nextId=Math.max(Number.isInteger(S.nextId)?S.nextId:1,...S.runners.map(u=>u.id+1));
}
const migrations={
 1:(S,E)=>legacyDefaults(S,E),
 2:S=>{S.saveSchemaVersion=VERSION}
};
function parse(input){if(typeof input!=='string')return input;try{return JSON.parse(input.replace(/^\uFEFF/,''))}catch(_){throw new SaveError('JSON 저장 파일을 읽을 수 없습니다. 압축파일이나 HTML 대신 내보낸 .json 파일을 선택하세요.')}}
function prepare(input,E){
 const payload=parse(input);if(!object(payload))throw new SaveError('올바른 저장 데이터가 아닙니다.');
 let raw,version;
 if(payload.format!==undefined){
  if(payload.format!==FORMAT)throw new SaveError('트레센매니저 저장 형식이 아닙니다.');
  version=payload.version??1;
  if(!Number.isInteger(version)||version<1)throw new SaveError('저장 파일의 버전 정보가 잘못되었습니다.');
  if(version>VERSION&&(!Number.isInteger(payload.minReaderVersion)||payload.minReaderVersion>VERSION))throw new SaveError('더 새로운 저장 형식입니다. 사이트를 최신 버전으로 업데이트한 뒤 불러오세요.');
  raw=payload.state;
 }else{raw=payload;version=1}
 if(!object(raw)||!Array.isArray(raw.runners)||!Array.isArray(raw.teams))throw new SaveError('커리어의 우마무스메 또는 학원 목록이 없습니다.');
 if(!Number.isInteger(raw.year)||raw.year<1||!Number.isInteger(raw.turn)||raw.turn<0||raw.turn>23)throw new SaveError('커리어의 연도·턴 정보가 잘못되었습니다.');
 if(raw.version!==undefined&&raw.version!==1)throw new SaveError('지원하지 않는 게임 상태 버전입니다. 원본을 보관하세요.');
 if(!Number.isFinite(raw.funds))throw new SaveError('커리어의 운영 자금 정보가 잘못되었습니다.');
 if(!raw.teams.length||raw.teams.some(t=>!object(t)))throw new SaveError('학원 정보가 손상되었습니다.');
 const ids=new Set();for(const u of raw.runners){if(!object(u)||!Number.isInteger(u.id)||ids.has(u.id))throw new SaveError('우마무스메 ID가 없거나 중복됩니다.');ids.add(u.id);if(!Number.isInteger(u.team)||u.team<0||!raw.teams.some(t=>t.id===u.team))throw new SaveError('우마무스메 '+u.id+'의 소속 학원을 찾을 수 없습니다.');}
 const state=structuredClone(raw),from=Number.isInteger(state.saveSchemaVersion)?state.saveSchemaVersion:0;
 if(from>VERSION&&version<=VERSION)throw new SaveError('게임 상태가 현재보다 새로운 저장 구조입니다. 사이트 업데이트가 필요합니다.');
 state.version??=1;state.club??=state.teams[0].name||'트레센 학원';
 // Validate/default shared fields even for compatible future additive envelopes.
 legacyDefaults(state,E);
 for(let next=from+1;next<=VERSION;next++){const migrate=migrations[next];if(!migrate)throw new SaveError('저장 변환 단계 '+next+'가 없습니다.');migrate(state,E)}
 state.saveSchemaVersion=VERSION;
 return {state,sourceVersion:version,previousSchema:from,needsMigration:from<VERSION||version<VERSION};
}
function mark(state){state.saveSchemaVersion=VERSION;return state}
function encode(state){return {format:FORMAT,version:VERSION,minReaderVersion:VERSION,game:'트레센매니저',exportedAt:new Date().toISOString(),state:structuredClone(mark(structuredClone(state)))}}
const api={FORMAT,VERSION,SaveError,prepare,mark,encode,migrations};root.TracenSave=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
