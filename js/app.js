const KEY="joyList";
let list=[];
try{list=JSON.parse(localStorage.getItem(KEY))||[];}catch(e){list=[];}
const $=s=>document.querySelector(s);

function poster(t){
 if(!t.trailer)return "https://picsum.photos/seed/"+t.id+"//600/900";
 return "https://i.ytimg.com/vi/"+t.trailer+"/hqdefault.jpg";
}
function toast(msg){const b=$("#toast");b.textContent=msg;b.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>b.style.display="none",2200);}
function inList(id){return list.includes(id);}
function card(t){
 const on=inList(t.id);
 return `<article class="card tcard" data-id="${t.id}" tabindex="0">
 <img class="card-img-top" src="${poster(t)}" alt="Poster for ${t.title}">
 <div class="card-body p-2"><h3 class="h6 mb-1">${t.title}</h3>
 <p class="small text-warning mb-1">${t.type} &middot; ${t.genre} &middot; ${t.year} &middot; ${t.duration}</p>
 <p class="small text-secondary mb-2">${t.desc}</p>
 <button class="btn btn-sm ${on?"btn-warning":"btn-outline-warning"}" data-act="${t.id}">${on?"&#10003; In My List":"+ My List"}</button></div></article>`;
}
function renderGrid(el,arr){
 let html="";
 for(const t of arr){html+=`<div class="col">${card(t)}</div>`;}
 el.innerHTML=html;
}
function renderRow(el,arr){el.innerHTML=arr.map(card).join("");}

function applyFilters(){
 const q=$("#search").value.trim().toLowerCase(), type=$("#type").value;
 const res=titles.filter(t=>{
  const textMatch=t.title.toLowerCase().includes(q)||t.desc.toLowerCase().includes(q);
  return textMatch&&(type==="All"||t.type===type);
 });
 renderGrid($("#catalogue"),res);
 $("#resultInfo").textContent=res.length?`Showing ${res.length} of ${titles.length} titles`:"No titles match your search. Try another word or type.";
}
function renderList(){
 const items=titles.filter(t=>inList(t.id));
 $("#count").textContent=items.length;
 if(items.length===0){$("#listBox").innerHTML=`<div class="col-12"><div class="alert alert-secondary">Your list is empty. Press "+ My List" on any title to save it here.</div></div>`;}
 else renderGrid($("#listBox"),items);
}
function renderAll(){
 renderRow($("#trending"),titles.filter(t=>[1,2,3,5,7,11].includes(t.id)));
 renderRow($("#newest"),titles.filter(t=>t.year>=2024));
 applyFilters();renderList();
}
function toggle(id){
 const t=titles.find(x=>x.id===id);
 if(inList(id)){list=list.filter(x=>x!==id);toast(`Removed "${t.title}" from My List`);}
 else{list.push(id);toast(`Added "${t.title}" to My List`);}
 try{localStorage.setItem(KEY,JSON.stringify(list));}catch(e){toast("Could not save your list in this browser.");}
 renderAll();
 if($("#titleModal").classList.contains("show"))showModal(id,true);
}
function showModal(id,keep){
 const t=titles.find(x=>x.id===id);
 $("#mTitle").textContent=t.title;
 const watch=t.trailer?`<button class="btn btn-warning" data-play="${t.trailer}">&#9654; Watch Trailer</button>`:`<button class="btn btn-secondary" disabled>Trailer coming soon</button>`;
 $("#mBody").innerHTML=`<div class="row g-3"><div class="col-md-4"><img class="img-fluid rounded" src="${poster(t)}" alt="Poster for ${t.title}"></div>
 <div class="col-md-8"><p class="text-warning">${t.type} &middot; ${t.genre} &middot; ${t.year} &middot; ${t.duration}</p><p>${t.desc}</p>
 <div id="player" class="ratio ratio-16x9 mb-3 d-none"></div>${watch}
 <button class="btn btn-outline-light ms-2" data-act="${t.id}">${inList(id)?"Remove from My List":"+ My List"}</button></div></div>`;
 if(!keep)bootstrap.Modal.getOrCreateInstance($("#titleModal")).show();
}
document.addEventListener("click",e=>{
 const a=e.target.closest("[data-act]"),p=e.target.closest("[data-play]"),c=e.target.closest(".tcard");
 if(a){e.stopPropagation();toggle(+a.dataset.act);}
 else if(p){const pl=$("#player");pl.classList.remove("d-none");pl.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${p.dataset.play}?autoplay=1" title="Trailer" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;}
 else if(c){showModal(+c.dataset.id);}
});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList.contains("tcard"))showModal(+e.target.dataset.id);});
$("#titleModal").addEventListener("hidden.bs.modal",()=>{$("#mBody").innerHTML="";});
$("#search").addEventListener("input",applyFilters);
$("#type").addEventListener("change",applyFilters);

// Hero (featured title)
const hero=titles[1];
$("#heroTitle").textContent=hero.title;
$("#heroMeta").textContent=`${hero.type} · ${hero.genre} · ${hero.year} · ${hero.duration}`;
$("#heroDesc").textContent=hero.desc;
$("#heroPlay").addEventListener("click",()=>showModal(hero.id));
$("#heroAdd").addEventListener("click",()=>toggle(hero.id));

// Mock form validation
$("#demoForm").addEventListener("submit",e=>{
 e.preventDefault();
 const f=e.target,msg=$("#formMsg");
 f.classList.add("was-validated");
 if(!f.checkValidity()){msg.innerHTML=`<div class="alert alert-danger">Please fix the highlighted fields.</div>`;return;}
 if(/^\d+$/.test($("#name").value.trim())){msg.innerHTML=`<div class="alert alert-danger">Display name cannot be only numbers.</div>`;return;}
 msg.innerHTML=`<div class="alert alert-success">Welcome, ${$("#name").value.trim().replace(/</g,"&lt;")}! (Demo only: nothing was saved.)</div>`;
 f.reset();f.classList.remove("was-validated");
});

// Fetch JSON with status + fallback
async function loadFaq(){
 const box=$("#faq");
 try{
  const r=await fetch("data/faq.json");
  if(!r.ok)throw new Error(r.status);
  showFaq(await r.json());
 }catch(err){
  showFaq([{q:"Help topics could not load",a:"Please check your connection and refresh. You can still email help@joystream.example."}]);
  box.insertAdjacentHTML("afterbegin",`<div class="alert alert-warning">Could not load the FAQ file, showing a fallback.</div>`);
 }
}
function showFaq(items){
 $("#faq").innerHTML=items.map((f,i)=>`<div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#f${i}">${f.q}</button></h3><div id="f${i}" class="accordion-collapse collapse" data-bs-parent="#faq"><div class="accordion-body">${f.a}</div></div></div>`).join("");
}
renderAll();loadFaq();
