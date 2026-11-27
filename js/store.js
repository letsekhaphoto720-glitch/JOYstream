/* Local storage layer: IndexedDB (users, uploaded titles with video/poster files) + accounts.
   Everything lives in this browser. There is no server. */
const DB=(()=>{
 let dbp;
 function open(){
  if(!dbp)dbp=new Promise((res,rej)=>{
   if(!window.indexedDB){rej(new Error("IndexedDB not supported"));return;}
   const r=indexedDB.open("joystream",1);
   r.onupgradeneeded=()=>{
    const d=r.result;
    d.createObjectStore("users",{keyPath:"id"}).createIndex("email","email",{unique:true});
    d.createObjectStore("titles",{keyPath:"id"}).createIndex("owner","ownerId");
   };
   r.onsuccess=()=>res(r.result);
   r.onerror=()=>rej(r.error);
  });
  return dbp;
 }
 function run(store,mode,fn){
  return open().then(db=>new Promise((res,rej)=>{
   const t=db.transaction(store,mode),rq=fn(t.objectStore(store));
   t.oncomplete=()=>res(rq?rq.result:undefined);
   t.onerror=t.onabort=()=>rej(t.error||new Error("Storage error"));
  }));
 }
 return{
  get:(s,k)=>run(s,"readonly",o=>o.get(k)),
  all:s=>run(s,"readonly",o=>o.getAll()),
  put:(s,v)=>run(s,"readwrite",o=>o.put(v)),
  del:(s,k)=>run(s,"readwrite",o=>o.delete(k)),
  byIndex:(s,i,v)=>run(s,"readonly",o=>o.index(i).get(v))
 };
})();

const b64=buf=>btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,10);

async function hashPw(pw,salt){
 if(!(window.crypto&&crypto.subtle))throw new Error("Accounts need a secure page (https or localhost).");
 const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveBits"]);
 return b64(await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},k,256));
}

const Auth={
 user:null,
 async init(){
  const id=localStorage.getItem("joySession");
  if(id){try{this.user=(await DB.get("users",id))||null;}catch(e){this.user=null;}}
 },
 async register({name,email,pw,fav}){
  email=email.trim().toLowerCase();
  if(await DB.byIndex("users","email",email))throw new Error("An account with that email already exists. Try signing in.");
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const u={id:uid(),name:name.trim(),email,fav,salt:b64(salt),hash:await hashPw(pw,salt),created:Date.now()};
  await DB.put("users",u);
  this.set(u);return u;
 },
 async login(email,pw){
  const u=await DB.byIndex("users","email",email.trim().toLowerCase());
  if(!u||u.hash!==await hashPw(pw,unb64(u.salt)))throw new Error("Incorrect email or password.");
  this.set(u);return u;
 },
 set(u){this.user=u;localStorage.setItem("joySession",u.id);},
 logout(){this.user=null;localStorage.removeItem("joySession");}
};
