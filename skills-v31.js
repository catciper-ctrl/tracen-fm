/* Canonical double-circle skills, saved-skill migration, and rare-first presentation groups. */
(function(root){function install(E,db){
const old={resume:E.resume,newGame:E.newGame,allSkills:E.allSkills},aliases=db.skillAliases||{};
E.canonicalSkillId=id=>Number(aliases[Number(id)]??id);
const removed=new Set(db.removedSelfPenaltySkills||[]);
const ids=xs=>[...new Set((xs||[]).map(E.canonicalSkillId))].filter(id=>!removed.has(id));
// Historical event IDs remain readable without returning duplicate catalogue entries.
const get=E.skills.get.bind(E.skills),has=E.skills.has.bind(E.skills);
E.skills.get=id=>get(E.canonicalSkillId(id));E.skills.has=id=>has(E.canonicalSkillId(id));
E.normalizeSkillRunner=u=>{
 if(!u)return u;
 for(const key of ['known','learned','equipped','innate','masteredSkills','evolved','inheritLearned','inheritEquipped'])u[key]=ids(u[key]);
 u.inheritKnown=(u.inheritKnown||[]).map(x=>({...x,id:E.canonicalSkillId(x.id)})).filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
 E.cleanSkills(u);u.known=u.known.filter(id=>!u.learned.includes(id));
 for(const h of u.inheritanceHistory||[]){for(const key of ['acquired','greenUnlocked'])if(h[key])h[key]=ids(h[key]);normalizeFactor(h.factor)}
 return u;
};
function normalizeFactor(f){if(!f)return;if(f.white)f.white=ids(f.white);if(f.green?.skill)f.green.skill=E.canonicalSkillId(f.green.skill)}
E.normalizeSkillSave=S=>{
 if(S.skillRulesVersion>=34)return S;
 const runners=[...S.runners,...Object.values(S.recordArchive||{}),...(S.hall||[]).map(h=>h.runner)];
 for(const u of new Set(runners))E.normalizeSkillRunner(u);
 for(const f of [...(S.factors||[]),...(S.starterFactorChoices||[])])normalizeFactor(f);
 S.skillRulesVersion=34;return S;
};
for(const name of ['unlockSkill','acquireWhite','skillGate','skillPrice','skillOrigin']){const fn=E[name];E[name]=(u,id,...rest)=>fn(u,E.canonicalSkillId(id),...rest)}
const acquireWhite=E.acquireWhite;E.acquireWhite=(u,id)=>E.skills.has(id)?acquireWhite(u,id):false;
const equip=E.equip;E.equip=(u,id)=>{E.normalizeSkillRunner(u);return equip(u,E.canonicalSkillId(id))};
for(const name of ['learn','unlockInnate','evolve']){const fn=E[name];E[name]=(S,u,id,...rest)=>{E.normalizeSkillRunner(u);return fn(S,u,E.canonicalSkillId(id),...rest)}}
for(const name of ['ancestors','skillSources','skillRestrictions','dexSkillMatch']){const fn=E[name];E[name]=(id,...rest)=>fn(E.canonicalSkillId(id),...rest)}
const related=E.relatedSkills;E.relatedSkills=(a,b)=>related(E.canonicalSkillId(a),E.canonicalSkillId(b));
E.allSkills=u=>ids(old.allSkills(u));
E.skillDisplayGroups=(values,{includeLower=true}={})=>{
 const available=ids(values).filter(id=>E.skills.has(id)),pool=new Set(available),used=new Set(),groups=[];
 const push=(id,lower=[])=>{if(used.has(id))return;const ownLower=lower.filter(i=>pool.has(i)&&!used.has(i));groups.push({id,lower:includeLower?lower:ownLower});used.add(id);for(const k of ownLower)used.add(k)};
 // A rare skill and its lower normal form are one visual block.
 for(const id of available.filter(id=>E.skills.get(id).rarity===2))push(id,(E.skills.get(id).treeParents||[]).filter(i=>E.skills.get(i)?.rarity===1));
 for(const id of available)push(id);
 return groups;
};
const search=E.dexSearch;E.dexSearch=(kind,q='',filters={})=>{q=q.replace(/[○◯]/g,'◎');return search(kind,q,filters)};
E.resume=S=>old.resume(E.normalizeSkillSave(S));
E.newGame=(...args)=>{const S=old.newGame(...args);S.skillRulesVersion=34;return S};
return E}root.UmaSkillsV31={install};if(typeof module!=='undefined')module.exports={install}})(typeof window!=='undefined'?window:globalThis);
