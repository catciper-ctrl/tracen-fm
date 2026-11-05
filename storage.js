/* Main careers are durable; optional originals never compete for localStorage quota. */
(function(root){
 let database,queue=Promise.resolve();const temporary=new Map();
 const encode=v=>root.TracenPacking&&v&&Array.isArray(v.runners)?{__tracenStorageEncoding:root.TracenPacking.TAG,data:root.TracenPacking.pack(v)}:structuredClone(v);
 const decode=v=>v?.__tracenStorageEncoding===root.TracenPacking?.TAG&&v?.data?root.TracenPacking.unpack(v.data):v;
 function open(){if(database)return database;const pending=new Promise((resolve,reject)=>{const q=indexedDB.open('tracen-fm-careers',1);q.onupgradeneeded=()=>q.result.createObjectStore('careers');q.onsuccess=()=>{q.result.onversionchange=()=>{q.result.close();database=null};resolve(q.result)};q.onerror=()=>reject(q.error)});database=pending;pending.catch(()=>{if(database===pending)database=null});return pending}
 async function read(key){if(temporary.has(key))return structuredClone(temporary.get(key));try{const fallback=JSON.parse(localStorage.getItem(key)||'null');if(fallback?.__careerStorageFallback===1)return decode(fallback.value)}catch(_){}try{const db=await open();const value=await new Promise((resolve,reject)=>{const t=db.transaction('careers'),q=t.objectStore('careers').get(key);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});if(value!==undefined)return decode(value)}catch(e){console.warn('Career store read failed',e)}return decode(JSON.parse(localStorage.getItem(key)||'null'))}
 async function put(key,value){const db=await open();await new Promise((resolve,reject)=>{const t=db.transaction('careers','readwrite');t.objectStore('careers').put(value,key);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error)});temporary.delete(key);try{localStorage.removeItem(key)}catch(_){}return true}
 function enqueue(job){const next=queue.catch(()=>{}).then(job);queue=next;return next}
 function write(key,value){const snapshot=encode(value);return enqueue(async()=>{try{return await put(key,snapshot)}catch(e){try{localStorage.setItem(key,JSON.stringify({__careerStorageFallback:1,value:snapshot}));return true}catch(err){throw new Error('브라우저 저장 공간이 부족하거나 저장소에 접근할 수 없습니다. 기존 저장은 유지했습니다. 저장 파일을 내보낸 뒤 다시 시도해 주세요.')}}})}
 function writeBackup(key,value){const snapshot=encode(value);return enqueue(async()=>{try{return await put(key,snapshot)}catch(e){temporary.set(key,decode(snapshot));console.warn('Original backup retained for this session only',e);return false}})}
 root.CareerStore={read,write,writeBackup,flush:()=>queue};
})(window);
