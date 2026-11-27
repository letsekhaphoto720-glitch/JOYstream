const $=s=>document.querySelector(s);
const on=(sel,ev,fn)=>{const el=$(sel);if(el)el.addEventListener(ev,fn);};
const page=document.body.dataset.page||"";
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const MAX_VIDEO=200*1024*1024,MAX_POSTER=10*1024*1024;

let titles=[],list=[],editing=null;
const urlCache=new Map();

/* ---------- helpers ---------- */
function toast(msg){const b=$("#toast");b.textContent=msg;b.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>b.style.display="none",2600);}
function flash(el,type,msg){el.innerHTML=`<div class="alert alert-${type}">${esc(msg)}</div>`;}
function urlFor(t,kind){
 if(!t[kind])return "";
 const key=t.id+kind,c=urlCache.get(key);
 if(c&&c.blob===t[kind])return c.url;
 if(c)URL.revokeObjectURL(c.url);
 const url=URL.createObjectURL(t[kind]);
 urlCache.set(key,{blob:t[kind],url});return url;
}
function placeholder(t){
 const c=t.c||["#064e3b","#22c55e"],name=esc(t.title.length>22?t.title.slice(0,21)+"…":t.title);
 const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='900' viewBox='0 0 600 900'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c[0]}'/><stop offset='1' stop-color='${c[1]}'/></linearGradient></defs><rect width='600' height='900' fill='url(#g)'/><text x='300' y='450' text-anchor='middle' font-family='Segoe UI,Arial,sans-serif' font-size='46' font-weight='700' fill='white'>${name}</text></svg>`;
 return "data:image/svg+xml,"+encodeURIComponent(svg);
}
function poster(t){
 if(t.poster)return urlFor(t,"poster");
 if(t.trailer)return "https://i.ytimg.com/vi/"+t.trailer+"/hqdefault.jpg";
 return placeholder(t);
}
const canPlay=t=>!!(t.video||t.videoUrl||t.trailer);
const isMine=t=>!!(Auth.user&&t.ownerId===Auth.user.id);

/* ---------- my list (per account, guests use the old key) ---------- */
const listKey=()=>Auth.user?"joyList:"+Auth.user.id:"joyList";
function readList(key){try{return JSON.parse(localStorage.getItem(key))||[];}catch(e){return[];}}
function loadList(){list=readList(listKey());}
function saveList(){try{localStorage.setItem(listKey(),JSON.stringify(list));}catch(e){toast("Could not save your list in this browser.");}}
const inList=id=>list.includes(id);

/* ---------- catalogue ---------- */
async function loadCatalogue(){
 let mine=[];
 try{mine=await DB.all("titles");}catch(e){toast("Uploads are not available in this browser.");}
 mine.sort((a,b)=>b.created-a.created);
 titles=[...seedTitles,...mine];
}
function card(t){
 const on=inList(t.id),own=isMine(t);
 return `<article class="card tcard" data-id="${t.id}" tabindex="0">
 ${t.ownerId?`<span class="badge badge-yours">${own?"Yours":"Community"}</span>`:""}
 <img class="card-img-top" src="${poster(t)}" alt="Poster for ${esc(t.title)}">
 <div class="card-body"><h3 class="h6 mb-1">${esc(t.title)}</h3>
 <p class="small text-accent mb-1">${esc(t.type)} &middot; ${esc(t.genre)} &middot; ${esc(t.year)} &middot; ${esc(t.duration)}</p>
 <p class="small text-secondary mb-2">${esc(t.desc)}</p>
 <button class="btn btn-sm ${on?"btn-accent":"btn-outline-accent"}" data-act="${t.id}">${on?"&#10003; In My List":"+ My List"}</button>${own?`<button class="btn btn-sm btn-outline-light" data-edit="${t.id}">Edit</button>`:""}</div></article>`;
}
function renderGrid(el,arr){el.innerHTML=arr.map(t=>`<div class="col">${card(t)}</div>`).join("");}
function renderRow(el,arr){el.innerHTML=arr.map(card).join("");}
function applyFilters(){
 if(!$("#catalogue"))return;
 const q=$("#search").value.trim().toLowerCase(),type=$("#type").value;
 const res=titles.filter(t=>(t.title.toLowerCase().includes(q)||t.desc.toLowerCase().includes(q))&&(type==="All"||t.type===type));
 renderGrid($("#catalogue"),res);
 $("#resultInfo").textContent=res.length?`Showing ${res.length} of ${titles.length} titles`:"No titles match your search. Try another word or type.";
}
function renderList(){
 const items=titles.filter(t=>inList(t.id));
 if($("#count"))$("#count").textContent=items.length;
 if(!$("#listBox"))return;
 if(!items.length)$("#listBox").innerHTML=`<div class="col-12"><div class="alert alert-secondary">Your list is empty. Press "+ My List" on any title to save it here.</div></div>`;
 else renderGrid($("#listBox"),items);
}
function renderUploads(){
 const box=$("#uploadsBox");
 if(!box)return;
 $("#newUpload").classList.toggle("d-none",!Auth.user);
 if(!Auth.user){box.innerHTML=`<div class="col-12"><div class="alert alert-secondary">Sign in or create an account to upload and manage your own videos and posters. <a class="link-accent" href="account.html?next=uploads.html">Sign in or create an account</a></div></div>`;return;}
 const mine=titles.filter(isMine);
 if(!mine.length)box.innerHTML=`<div class="col-12"><div class="alert alert-secondary">You have not uploaded anything yet. Press "+ Upload new" to add a video and poster from your device.</div></div>`;
 else renderGrid(box,mine);
}
function renderAll(){
 if($("#trending"))renderRow($("#trending"),titles.filter(t=>[1,2,3,5,7,11].includes(t.id)));
 if($("#newest"))renderRow($("#newest"),titles.filter(t=>t.ownerId||t.year>=2024));
 applyFilters();renderList();renderUploads();
}
function renderHero(){
 if(!$("#heroTitle"))return;
 const h=titles.find(t=>t.id===2)||titles[0];
 $("#heroTitle").textContent=h.title;
 $("#heroMeta").textContent=`${h.type} · ${h.genre} · ${h.year} · ${h.duration}`;
 $("#heroDesc").textContent=h.desc;
 $("#heroPlay").dataset.id=h.id;$("#heroAdd").dataset.id=h.id;
}
async function refresh(){await loadCatalogue();loadList();renderAll();renderAuthUI();}

/* ---------- list toggle + modal ---------- */
function toggle(id){
 const t=titles.find(x=>x.id===id);if(!t)return;
 if(inList(id)){list=list.filter(x=>x!==id);toast(`Removed "${t.title}" from My List`);}
 else{list.push(id);toast(`Added "${t.title}" to My List`);}
 saveList();renderAll();
 if($("#titleModal").classList.contains("show"))showModal(id,true);
}
function showModal(id,keep){
 const t=titles.find(x=>x.id===id);if(!t)return;
 $("#mTitle").textContent=t.title;
 const watch=canPlay(t)?`<button class="btn btn-accent" data-play="${t.id}">&#9654; ${t.video?"Watch":"Watch Trailer"}</button>`:`<button class="btn btn-secondary" disabled>Trailer coming soon</button>`;
 const own=isMine(t)?`<div class="mt-3 pt-3 border-top border-secondary"><button class="btn btn-sm btn-outline-light" data-edit="${t.id}">Edit</button> <button class="btn btn-sm btn-outline-danger" data-del="${t.id}">Delete</button></div>`:"";
 const player=$("#player");const playing=keep&&player&&!player.classList.contains("d-none")?player.innerHTML:"";
 $("#mBody").innerHTML=`<div class="row g-3"><div class="col-md-4"><img class="img-fluid rounded" src="${poster(t)}" alt="Poster for ${esc(t.title)}"></div>
 <div class="col-md-8"><p class="text-accent">${esc(t.type)} &middot; ${esc(t.genre)} &middot; ${esc(t.year)} &middot; ${esc(t.duration)}</p><p>${esc(t.desc)}</p>
 <div id="player" class="ratio ratio-16x9 mb-3 d-none"></div>${watch}
 <button class="btn btn-outline-light ms-2" data-act="${t.id}">${inList(id)?"Remove from My List":"+ My List"}</button>${own}</div></div>`;
 if(playing){const p=$("#player");p.innerHTML=playing;p.classList.remove("d-none");}
 if(!keep)bootstrap.Modal.getOrCreateInstance($("#titleModal")).show();
}
function play(id){
 const t=titles.find(x=>x.id===id),pl=$("#player");if(!t||!pl)return;
 pl.classList.remove("d-none");
 pl.innerHTML=(t.video||t.videoUrl)?`<video controls autoplay playsinline poster="${poster(t)}" src="${t.video?urlFor(t,"video"):esc(t.videoUrl)}"></video>`
  :`<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(t.trailer)}?autoplay=1" title="Trailer" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
}
async function removeTitle(id){
 const t=titles.find(x=>x.id===id);
 if(!t||!isMine(t))return;
 if(!confirm(`Delete "${t.title}"? This cannot be undone.`))return;
 try{await DB.del("titles",id);}catch(e){toast("Could not delete. Try again.");return;}
 for(const k of["poster","video"]){const c=urlCache.get(id+k);if(c){URL.revokeObjectURL(c.url);urlCache.delete(id+k);}}
 list=list.filter(x=>x!==id);saveList();
 bootstrap.Modal.getInstance($("#titleModal"))?.hide();
 await refresh();toast(`Deleted "${t.title}"`);
}

/* ---------- upload / edit ---------- */
function openUpload(id){
 if(!Auth.user){location.href="account.html?next=uploads.html";return;}
 editing=id?titles.find(t=>t.id===id&&isMine(t)):null;
 if(id&&!editing)return;
 const f=$("#uploadForm");f.reset();f.classList.remove("was-validated");$("#uMsg").innerHTML="";
 $("#uTitleH").textContent=editing?"Edit title":"Upload a title";
 $("#uYear").value=editing?editing.year:new Date().getFullYear();
 if(editing){
  $("#uTitle").value=editing.title;$("#uType").value=editing.type;$("#uGenre").value=editing.genre;
  $("#uYear").value=editing.year;$("#uDuration").value=editing.duration;$("#uDesc").value=editing.desc;
 }
 $("#uVideoNote").textContent=editing?`Current: ${editing.video.name||"video"}. Choose a file only to replace it.`:"MP4 or WebM, up to 200 MB.";
 const prev=$("#uPosterPrev");
 if(editing&&editing.poster){prev.src=urlFor(editing,"poster");prev.classList.remove("d-none");}else{prev.removeAttribute("src");prev.classList.add("d-none");}
 $("#rmPosterWrap").classList.toggle("d-none",!(editing&&editing.poster));
 bootstrap.Modal.getOrCreateInstance($("#uploadModal")).show();
}
function resizePoster(file){
 return new Promise((res,rej)=>{
  const img=new Image(),u=URL.createObjectURL(file);
  img.onload=()=>{
   const W=600,H=900,c=document.createElement("canvas");c.width=W;c.height=H;
   const x=c.getContext("2d"),s=Math.max(W/img.width,H/img.height),w=img.width*s,h=img.height*s;
   x.drawImage(img,(W-w)/2,(H-h)/2,w,h);URL.revokeObjectURL(u);
   c.toBlob(b=>b?res(b):rej(new Error("Could not process the poster.")),"image/jpeg",.88);
  };
  img.onerror=()=>{URL.revokeObjectURL(u);rej(new Error("That poster is not a readable image."));};
  img.src=u;
 });
}
function videoLength(file){
 return new Promise(res=>{
  const v=document.createElement("video"),u=URL.createObjectURL(file);v.preload="metadata";
  const done=m=>{URL.revokeObjectURL(u);res(m);};
  v.onloadedmetadata=()=>done(isFinite(v.duration)?Math.max(1,Math.round(v.duration/60))+" min":"");
  v.onerror=()=>done("");v.src=u;
 });
}
on("#uPoster","change",e=>{
 const f=e.target.files[0],prev=$("#uPosterPrev");
 if(f&&f.type.startsWith("image/")){prev.src=URL.createObjectURL(f);prev.classList.remove("d-none");}
});
on("#uploadForm","submit",async e=>{
 e.preventDefault();
 const f=e.target,msg=$("#uMsg"),btn=$("#uSave");
 f.classList.add("was-validated");
 if(!f.checkValidity())return;
 const pf=$("#uPoster").files[0],vf=$("#uVideo").files[0];
 if(!editing&&!vf){flash(msg,"danger","Please choose a video file.");return;}
 if(vf&&!vf.type.startsWith("video/")){flash(msg,"danger","The video must be a video file (MP4 or WebM).");return;}
 if(vf&&vf.size>MAX_VIDEO){flash(msg,"danger","That video is larger than 200 MB.");return;}
 if(pf&&!pf.type.startsWith("image/")){flash(msg,"danger","The poster must be an image.");return;}
 if(pf&&pf.size>MAX_POSTER){flash(msg,"danger","That poster is larger than 10 MB.");return;}
 btn.disabled=true;btn.textContent="Saving…";
 try{
  const rec=editing?await DB.get("titles",editing.id):{id:Date.now(),ownerId:Auth.user.id,created:Date.now(),c:["#064e3b","#22c55e"]};
  if(!rec||rec.ownerId!==Auth.user.id)throw new Error("You can only edit your own titles.");
  rec.title=$("#uTitle").value.trim();rec.type=$("#uType").value;rec.genre=$("#uGenre").value.trim();
  rec.year=+$("#uYear").value;rec.desc=$("#uDesc").value.trim();
  if(vf)rec.video=vf;
  rec.duration=$("#uDuration").value.trim()||(vf?await videoLength(vf):"")||rec.duration||"Video";
  if(pf)rec.poster=await resizePoster(pf);
  else if($("#rmPoster").checked)delete rec.poster;
  await DB.put("titles",rec);
  bootstrap.Modal.getInstance($("#uploadModal")).hide();
  await refresh();toast(editing?"Changes saved":"Uploaded! Find it under My Uploads.");
 }catch(err){
  const quota=err&&err.name==="QuotaExceededError";
  flash(msg,"danger",quota?"Not enough browser storage for this file. Try a smaller video.":(err.message||"Could not save. Try again."));
 }finally{btn.disabled=false;btn.textContent="Save";}
});

/* ---------- account UI ---------- */
function renderAuthUI(){
 const u=Auth.user;
 if($("#navAccount"))$("#navAccount").textContent=u?"Hi, "+u.name.split(" ")[0]:"Sign In";
 if(!$("#authBox"))return;
 $("#authBox").classList.toggle("d-none",!!u);
 $("#accountBox").classList.toggle("d-none",!u);
 if(u){
  $("#accName").textContent=u.name;$("#accEmail").textContent=u.email;
  $("#accStats").textContent=`${titles.filter(isMine).length} upload(s) · ${list.length} in My List · favourite type: ${u.fav||"none"}`;
 }
}
async function afterAuth(){
 const guest=readList("joyList");
 loadList();list=[...new Set([...list,...guest])];saveList();
 await refresh();
 const next=new URLSearchParams(location.search).get("next");
 if(["uploads.html","mylist.html","browse.html","index.html"].includes(next))location.href=next;
}
on("#signupForm","submit",async e=>{
 e.preventDefault();
 const f=e.target,msg=$("#formMsg"),pw=$("#pw"),pw2=$("#pw2");
 pw2.setCustomValidity(pw.value&&pw.value!==pw2.value?"Passwords must match.":"");
 f.classList.add("was-validated");
 if(!f.checkValidity()){flash(msg,"danger","Please fix the highlighted fields.");return;}
 if(/^\d+$/.test($("#name").value.trim())){flash(msg,"danger","Display name cannot be only numbers.");return;}
 try{
  await Auth.register({name:$("#name").value,email:$("#email").value,pw:pw.value,fav:$("#fav").value});
  f.reset();f.classList.remove("was-validated");msg.innerHTML="";
  await afterAuth();toast("Account created. Welcome to Joy Stream!");
 }catch(err){flash(msg,"danger",err.message||"Could not create the account.");}
});
on("#pw2","input",e=>e.target.setCustomValidity(""));
on("#loginForm","submit",async e=>{
 e.preventDefault();
 const f=e.target,msg=$("#formMsg");f.classList.add("was-validated");
 if(!f.checkValidity()){flash(msg,"danger","Enter your email and password.");return;}
 try{
  await Auth.login($("#liEmail").value,$("#liPw").value);
  f.reset();f.classList.remove("was-validated");msg.innerHTML="";
  await afterAuth();toast("Signed in");
 }catch(err){flash(msg,"danger",err.message||"Could not sign in.");}
});
on("#logoutBtn","click",async()=>{Auth.logout();await refresh();toast("Signed out");});
on("#newUpload","click",()=>openUpload());

/* ---------- global events ---------- */
document.addEventListener("click",e=>{
 const a=e.target.closest("[data-act]"),p=e.target.closest("[data-play]"),ed=e.target.closest("[data-edit]"),dl=e.target.closest("[data-del]"),c=e.target.closest(".tcard");
 if(a){e.stopPropagation();toggle(+a.dataset.act);}
 else if(ed){
  e.stopPropagation();const id=+ed.dataset.edit,m=$("#titleModal");
  if(m.classList.contains("show")){m.addEventListener("hidden.bs.modal",()=>openUpload(id),{once:true});bootstrap.Modal.getInstance(m).hide();}
  else openUpload(id);
 }
 else if(dl){removeTitle(+dl.dataset.del);}
 else if(p){play(+p.dataset.play);}
 else if(c){showModal(+c.dataset.id);}
});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList.contains("tcard"))showModal(+e.target.dataset.id);});
on("#titleModal","hidden.bs.modal",()=>{$("#mBody").innerHTML="";});
on("#search","input",applyFilters);
on("#type","change",applyFilters);
on("#heroPlay","click",e=>showModal(+e.currentTarget.dataset.id));
on("#heroAdd","click",e=>toggle(+e.currentTarget.dataset.id));

/* ---------- FAQ ---------- */
async function loadFaq(){
 const box=$("#faq");
 if(!box)return;
 try{
  const r=await fetch("data/faq.json");
  if(!r.ok)throw new Error(r.status);
  showFaq(await r.json());
 }catch(err){
  showFaq([{q:"Help topics could not load",a:"Please check your connection and refresh. You can still email help@joystream.example."}]);
  box.insertAdjacentHTML("beforebegin",`<div class="alert alert-warning">Could not load the FAQ file, showing a fallback.</div>`);
 }
}
function showFaq(items){
 $("#faq").innerHTML=items.map((f,i)=>`<div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#f${i}">${esc(f.q)}</button></h3><div id="f${i}" class="accordion-collapse collapse" data-bs-parent="#faq"><div class="accordion-body">${esc(f.a)}</div></div></div>`).join("");
}

/* ---------- start ---------- */
(async()=>{
 try{await Auth.init();}catch(e){}
 const qs=new URLSearchParams(location.search);
 if($("#search")&&qs.get("q"))$("#search").value=qs.get("q");
 if($("#type")&&qs.get("type"))$("#type").value=qs.get("type");
 await loadCatalogue();loadList();renderAll();renderHero();renderAuthUI();loadFaq();
})();
