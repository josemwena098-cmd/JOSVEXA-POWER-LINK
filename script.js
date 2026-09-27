import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { ref, set, push, get, onValue, update } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js';

const $ = id => document.getElementById(id);
const msg = (text, error=false) => { const el=$('message'); if(el){el.textContent=text;el.className='message'+(error?' error':'');} };
const page = location.pathname.split('/').pop() || 'index.html';
const provider = new GoogleAuthProvider();
const friendly = e => ({'auth/email-already-in-use':'Email hii tayari ina account. Tumia Login.','auth/invalid-credential':'Email au password si sahihi.','auth/operation-not-allowed':'Google/Email login haijawezeshwa Firebase Console.','auth/popup-blocked':'Popup ya Google imezuiwa na browser.','auth/popup-closed-by-user':'Google login imefungwa kabla ya kumalizika.','auth/unauthorized-domain':'Domain hii haijaongezwa kwenye Authorized domains za Firebase.'}[e.code] || e.message);

async function saveUser(user, extra={}) { const snap=await get(ref(db,`users/${user.uid}`)); const old=snap.exists()?snap.val():{}; await set(ref(db,`users/${user.uid}`),{...old,name:extra.name??old.name??user.displayName??'',phone:extra.phone??old.phone??'',email:user.email||old.email||'',updatedAt:Date.now()}); }
async function requireProfile(user){ const s=await get(ref(db,`users/${user.uid}`)); const p=s.exists()?s.val():{}; if(!p.name || !p.phone){ if(page!=='register.html' && page!=='index.html') { location.href='dashboard.html#profile'; } return false; } return true; }

if(page==='index.html' || page===''){
 $('loginForm')?.addEventListener('submit',async e=>{e.preventDefault();msg('Signing in...');try{const c=await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);await saveUser(c.user);location.href='dashboard.html';}catch(err){msg(friendly(err),true);}});
 $('googleBtn')?.addEventListener('click',async()=>{msg('Opening Google...');try{const r=await signInWithPopup(auth,provider);await saveUser(r.user);location.href='dashboard.html';}catch(err){msg(friendly(err),true);}});
}
if(page==='register.html'){
 $('registerForm')?.addEventListener('submit',async e=>{e.preventDefault();msg('Creating account...');try{const c=await createUserWithEmailAndPassword(auth,$('email').value.trim(),$('password').value);await updateProfile(c.user,{displayName:$('name').value.trim()});await saveUser(c.user,{name:$('name').value.trim(),phone:$('phone').value.trim()});location.href='dashboard.html';}catch(err){msg(friendly(err),true);}});
 $('googleBtn')?.addEventListener('click',async()=>{msg('Opening Google...');try{const r=await signInWithPopup(auth,provider);const phone=prompt('Enter your phone number to finish your profile:');if(!phone){msg('Phone number is required.',true);return;}await saveUser(r.user,{name:r.user.displayName||'',phone:phone.trim()});location.href='dashboard.html';}catch(err){msg(friendly(err),true);}});
}

if(page==='dashboard.html'){
 onAuthStateChanged(auth,async user=>{if(!user){location.href='index.html';return;} const ok=await requireProfile(user); if(!ok)return;
 $('profileName').value=user.displayName||''; const ps=await get(ref(db,`users/${user.uid}`)); $('profilePhone').value=ps.val()?.phone||'';
 const linksRef=ref(db,'powerLinks');
 onValue(linksRef,async snap=>{
   const data=snap.val()||{}; const mine=Object.entries(data).filter(([_,v])=>v.ownerUid===user.uid);
   $('linkCount').textContent=mine.length; const box=$('links'); box.innerHTML='';
   if(!mine.length){box.innerHTML='<div class="empty">No Power Links yet.</div>'; $('sessionCount').textContent='0'; return;}
   const rows=await Promise.all(mine.map(async([id,v])=>{
     const ss=await get(ref(db,`linkSessions/${id}`)); const sessions=ss.exists()?Object.entries(ss.val()||{}):[];
     const last=sessions.map(([_,x])=>x.createdAt||0).sort((a,b)=>b-a)[0]||0;
     return {id,v,sessions,last};
   }));
   $('sessionCount').textContent=rows.reduce((n,r)=>n+r.sessions.length,0);
   rows.sort((a,b)=>(b.v.createdAt||0)-(a.v.createdAt||0));
   rows.forEach(({id,v,sessions,last})=>{
     const url=new URL('power-link.html',location.href); url.searchParams.set('id',id);
     const div=document.createElement('div'); div.className='link-item';
     div.innerHTML=`<div><strong>${esc(v.title)}</strong><small>Created: ${new Date(v.createdAt).toLocaleString()}</small><small>Open Date: ${last?new Date(last).toLocaleString():'Not opened yet'} · ${sessions.length} session(s)</small></div><div class="link-actions"><button class="btn small copy" data-url="${url.href}">Copy</button><a class="btn small secondary" href="${url.href}" target="_blank">Open</a></div>`;
     box.appendChild(div);
   });
   box.querySelectorAll('.copy').forEach(b=>b.onclick=()=>navigator.clipboard.writeText(b.dataset.url).then(()=>alert('Link copied')));
 });
 $('profileNav')?.addEventListener('click',e=>{e.preventDefault();$('profilePanel').classList.remove('hidden');scrollTo(0,$('profilePanel').offsetTop)});
 $('profileForm')?.addEventListener('submit',async e=>{e.preventDefault();await updateProfile(user,{displayName:$('profileName').value.trim()});await update(ref(db,`users/${user.uid}`),{name:$('profileName').value.trim(),phone:$('profilePhone').value.trim(),updatedAt:Date.now()});$('profileMessage').textContent='Profile saved.';});
 $('logoutBtn')?.addEventListener('click',async e=>{e.preventDefault();await signOut(auth);location.href='index.html';});
 });
}

if(page==='create-link.html'){
 onAuthStateChanged(auth,async user=>{if(!user){location.href='index.html';return;}if(!(await requireProfile(user)))return;
 $('createLinkForm')?.addEventListener('submit',async e=>{
   e.preventDefault();
   const features={camera:$('camera').checked,audio:$('audio').checked,video:$('video').checked,location:$('location').checked};
   if(!Object.values(features).some(Boolean)){msg('Select at least one feature.',true);return;}
   const id=push(ref(db,'powerLinks')).key;
   const item={ownerUid:user.uid,title:$('title').value.trim(),features,photoLimit:Number($('photoLimit').value)||5,recordingSeconds:Math.min(30,Math.max(3,Number($('recordingSeconds').value)||10)),redirectUrl:$('redirectUrl').value.trim(),createdAt:Date.now()};
   await set(ref(db,`powerLinks/${id}`),item);
   const url=new URL('power-link.html',location.href);url.searchParams.set('id',id);
   $('generatedLink').value=url.href;$('openLink').href=url.href;$('result').classList.remove('hidden');msg('Power Link created successfully and saved.');
 });
 $('logoutBtn')?.addEventListener('click',async e=>{e.preventDefault();await signOut(auth);location.href='index.html';});
 });
}

if(page==='power-link.html'){
 const id=new URLSearchParams(location.search).get('id'); let link=null; let stream=null; let recorder=null; let chunks=[]; let sessionId=null; let recordingUrl=null;
 const stopTracks=()=>{stream?.getTracks().forEach(t=>t.stop());stream=null;};
 const waitVideo=()=>new Promise(resolve=>{const v=$('preview');if(v.readyState>=2&&v.videoWidth){resolve();return;}v.onloadedmetadata=()=>resolve();});
 const savePhotoToDatabase=async(blob)=>{
   const reader=new FileReader();
   const data=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
   await update(ref(db,`linkSessions/${id}/${sessionId}`),{photo:data,photoCreatedAt:Date.now(),photoType:blob.type});
 };
 const autoPhoto=async()=>{
   if(!stream||!sessionId)return;
   const v=$('preview'),c=$('canvas'); await waitVideo(); c.width=Math.min(v.videoWidth||640,1280);c.height=Math.min(v.videoHeight||480,1280);c.getContext('2d').drawImage(v,0,0,c.width,c.height);
   const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.72)); if(!blob)return;
   // Photo is saved in Realtime Database as a compressed data URL. Audio/video are NOT saved to Firebase.
   await savePhotoToDatabase(blob);$('resultBox').innerHTML+='<p>📸 Photo captured automatically and saved.</p>'; if($('openDate')) $('openDate').textContent='Open Date: '+new Date().toLocaleString();
 };
 const autoRecord=async()=>{
   if(!stream||!sessionId)return;
   const isVideo=link.features.video; const preferred=isVideo?'video/webm':'audio/webm'; const mime=MediaRecorder.isTypeSupported(preferred)?preferred:'';
   recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);chunks=[];
   recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
   recorder.onstop=()=>{
     const blob=new Blob(chunks,{type:recorder.mimeType|| (isVideo?'video/webm':'audio/webm')});
     recordingUrl=URL.createObjectURL(blob);
     const label=isVideo?'Video':'Audio';
     const player=isVideo?`<video controls playsinline class="media-result" src="${recordingUrl}"></video>`:`<audio controls class="media-result" src="${recordingUrl}"></audio>`;
     $('resultBox').innerHTML+=`<p>⏺️ ${label} recorded automatically for ${link.recordingSeconds||10} seconds. It is available only in this browser session and is not saved to Firebase.</p>${player}`;
   };
   recorder.start();$('resultBox').innerHTML+='<p>⏺️ Recording started automatically...</p>'; const seconds=link.recordingSeconds||10; setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},seconds*1000);
 };
 const autoLocation=async()=>{if(!sessionId||!navigator.geolocation)return; navigator.geolocation.getCurrentPosition(async p=>{await update(ref(db,`linkSessions/${id}/${sessionId}`),{location:{lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy},locationCreatedAt:Date.now()});$('resultBox').innerHTML+='<p>📍 Location shared and saved.</p>';},()=>msg('Location permission was not granted.',true),{enableHighAccuracy:true,timeout:10000});};
 if(!id){msg('Invalid link.',true);} else get(ref(db,`powerLinks/${id}`)).then(s=>{if(!s.exists()){msg('This Power Link does not exist.',true);return;}link=s.val();$('linkTitle').textContent=link.title||'Power Link';const labels={camera:'Camera / Photo',audio:'Microphone / Voice',video:'Video',location:'Location'};const list=$('requestList');Object.entries(link.features||{}).filter(([_,v])=>v).forEach(([key])=>{const row=document.createElement('label');row.className='request';row.innerHTML=`<input type="checkbox" data-feature="${key}" checked> <span>${labels[key]}</span>`;list.appendChild(row);});}).catch(e=>msg(e.message,true));
 $('allowBtn')?.addEventListener('click',async()=>{if(!link)return;const selected=[...document.querySelectorAll('[data-feature]:checked')].map(x=>x.dataset.feature);if(!selected.length){msg('Select at least one permission.',true);return;}try{
   sessionId=push(ref(db,`linkSessions/${id}`)).key;
   await set(ref(db,`linkSessions/${id}/${sessionId}`),{createdAt:Date.now(),selected,consent:true,status:'started',openDate:new Date().toISOString()});
   $('requestView').classList.add('hidden');$('captureView').classList.remove('hidden');window.currentSession={sessionId,selected}; if($('openDate')) $('openDate').textContent='Open Date: '+new Date().toLocaleString();
   if(selected.includes('camera')||selected.includes('video')){stream=await navigator.mediaDevices.getUserMedia({video:true,audio:selected.includes('audio')||selected.includes('video')});$('preview').srcObject=stream;await waitVideo();}
   else if(selected.includes('audio')){stream=await navigator.mediaDevices.getUserMedia({audio:true});}
   if(selected.includes('camera')) await autoPhoto();
   if(selected.includes('audio')||selected.includes('video')) await autoRecord();
   if(selected.includes('location')) await autoLocation();
 }catch(e){msg('Permission was not granted or this browser does not support the requested feature.',true);}});
 $('denyBtn')?.addEventListener('click',()=>{document.body.innerHTML='<main class="recipient"><section class="recipient-card"><div class="brand center"><span class="brand-mark">J</span><div><b>JOSVEXA</b><small>POWER LINK</small></div></div><h2>Request declined</h2><p class="muted">No camera, microphone, video or location data was shared.</p></section></main>';});
 $('capturePhoto')?.remove(); $('startRecord')?.remove(); $('stopRecord')?.remove(); $('shareLocation')?.remove();
 window.addEventListener('beforeunload',()=>{if(recordingUrl)URL.revokeObjectURL(recordingUrl);stopTracks();});
}
function esc(s=''){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
