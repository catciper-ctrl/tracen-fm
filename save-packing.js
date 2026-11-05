/* Lossless structural storage: repeated objects/arrays are written once.
 * Decoding creates independent mutable containers. No gameplay fields are removed. */
(function(root){'use strict';
 const TAG='tracen-structural-v1',object=x=>x!==null&&typeof x==='object';
 function pack(value){const nodes=[],index=new Map(),seen=new WeakMap();
  function visit(v){if(!object(v))return typeof v==='number'&&!Number.isFinite(v)?null:v;if(seen.has(v))return [seen.get(v)];const node=Array.isArray(v)?[1,Array.from(v,x=>visit(x===undefined||typeof x==='function'||typeof x==='symbol'?null:x))]:[0,Object.keys(v).filter(k=>v[k]!==undefined&&typeof v[k]!=='function'&&typeof v[k]!=='symbol').map(k=>[k,visit(v[k])])];const key=JSON.stringify(node);let id=index.get(key);if(id===undefined){id=nodes.length;nodes.push(node);index.set(key,id)}seen.set(v,id);return [id]}
  const entry=visit(value);return {encoding:TAG,root:entry,nodes};
 }
 function unpack(p){if(!p||p.encoding!==TAG||!Array.isArray(p.nodes))throw Error('저장 중복 참조 형식이 잘못되었습니다.');
  function read(v,limit){if(!Array.isArray(v))return v;if(v.length!==1||!Number.isInteger(v[0])||v[0]<0||v[0]>=limit)throw Error('저장 중복 참조가 손상되었습니다.');const id=v[0],n=p.nodes[id];if(!Array.isArray(n)||!Array.isArray(n[1]))throw Error('저장 노드가 손상되었습니다.');if(n[0]===1)return n[1].map(x=>read(x,id));if(n[0]!==0)throw Error('저장 노드 종류가 잘못되었습니다.');const o={};for(const pair of n[1]){if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string')throw Error('저장 속성이 손상되었습니다.');Object.defineProperty(o,pair[0],{value:read(pair[1],id),enumerable:true,writable:true,configurable:true})}return o}
  return read(p.root,p.nodes.length);
 }
 // Retired runner snapshots are immutable in gameplay. Reuse only exact matches.
 function compactRuntime(S){const byId=new Map(S.runners.map(u=>[u.id,u]));for(const [id,u] of Object.entries(S.recordArchive||{})){const live=byId.get(u.id);if(live?.retired&&JSON.stringify(live)===JSON.stringify(u))S.recordArchive[id]=live}return S}
 const api={TAG,pack,unpack,compactRuntime};root.TracenPacking=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
