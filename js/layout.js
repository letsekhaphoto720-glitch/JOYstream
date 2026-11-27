/* Shared layout: injects the navbar, footer, toast and modals on every page. */
(function(){
 const page=document.body.dataset.page||"";
 const links=[["index.html","home","Discover"],["browse.html","browse","Browse"],["mylist.html","mylist","My List"],["uploads.html","uploads","My Uploads"],["about.html","about","About & Help"]];
 const nav=links.map(([href,key,label])=>{
  const badge=key==="mylist"?` <span id="count" class="badge bg-accent">0</span>`:"";
  return `<li class="nav-item"><a class="nav-link${page===key?" active":""}" ${page===key?'aria-current="page"':""} href="${href}">${label.replace("&","&amp;")}${badge}</a></li>`;
 }).join("");
 const hdr=document.getElementById("siteHeader");
 if(hdr)hdr.innerHTML=`<nav class="navbar navbar-expand-lg navbar-dark fixed-top" aria-label="Main"><div class="container">
  <a class="navbar-brand logo" href="index.html"><svg width="30" height="30" viewBox="0 0 24 24" fill="#22c55e" aria-hidden="true"><path d="M12 2 L15 9 L22 9 L16.5 13.5 L18.5 21 L12 16.5 L5.5 21 L7.5 13.5 L2 9 L9 9 Z"/></svg> JOY<span>STREAM</span></a>
  <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#menu" aria-label="Toggle menu"><span class="navbar-toggler-icon"></span></button>
  <div class="collapse navbar-collapse" id="menu"><ul class="navbar-nav ms-auto align-items-lg-center">${nav}
   <li class="nav-item"><a id="navAccount" class="btn btn-accent btn-sm ms-lg-3 mt-2 mt-lg-0${page==="account"?" active":""}" href="account.html">Sign In</a></li></ul></div></div></nav>`;
 const f=document.getElementById("siteFooter");
 if(f)f.innerHTML=`<footer class="text-center text-secondary py-4 small">
  <p class="mb-2"><a class="link-secondary me-3" href="index.html">Discover</a><a class="link-secondary me-3" href="browse.html">Browse</a><a class="link-secondary me-3" href="mylist.html">My List</a><a class="link-secondary me-3" href="uploads.html">My Uploads</a><a class="link-secondary me-3" href="account.html">Account</a><a class="link-secondary" href="about.html">About &amp; Help</a></p>
  <p class="mb-1">&copy; 2026 Joy Stream &ndash; class project, not a real service.</p>
  <p class="mb-0">Films Big Buck Bunny, Sintel, Tears of Steel and Elephants Dream &copy; Blender Foundation, licensed CC BY 3.0 (blender.org). Other trailers and the hero artwork are original placeholders made for this project. Uploaded videos and posters belong to the users who add them.</p></footer>`;
 document.body.insertAdjacentHTML("beforeend",`
<div class="modal fade" id="titleModal" tabindex="-1" aria-labelledby="mTitle" aria-hidden="true"><div class="modal-dialog modal-lg modal-dialog-centered"><div class="modal-content bg-dark text-light">
 <div class="modal-header"><h2 class="modal-title h4" id="mTitle"></h2><button class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button></div><div class="modal-body" id="mBody"></div></div></div></div>
<div class="modal fade" id="uploadModal" tabindex="-1" aria-labelledby="uTitleH" aria-hidden="true"><div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content bg-dark text-light">
 <div class="modal-header"><h2 class="modal-title h4" id="uTitleH">Upload a title</h2><button class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button></div>
 <form id="uploadForm" novalidate><div class="modal-body"><div class="row g-3">
  <div class="col-md-8"><label for="uTitle" class="form-label">Title</label><input id="uTitle" class="form-control" required maxlength="60"><div class="invalid-feedback">Enter a title.</div></div>
  <div class="col-md-4"><label for="uType" class="form-label">Type</label><select id="uType" class="form-select" required><option>Film</option><option>Series</option><option>Documentary</option><option>Educational</option></select></div>
  <div class="col-md-4"><label for="uGenre" class="form-label">Genre</label><input id="uGenre" class="form-control" required maxlength="30"><div class="invalid-feedback">Enter a genre.</div></div>
  <div class="col-md-4"><label for="uYear" class="form-label">Year</label><input id="uYear" type="number" class="form-control" required min="1900" max="2100"><div class="invalid-feedback">Enter a valid year.</div></div>
  <div class="col-md-4"><label for="uDuration" class="form-label">Duration <span class="text-secondary">(optional)</span></label><input id="uDuration" class="form-control" maxlength="20" placeholder="Auto-detected"></div>
  <div class="col-12"><label for="uDesc" class="form-label">Description</label><textarea id="uDesc" class="form-control" rows="3" required maxlength="300"></textarea><div class="invalid-feedback">Add a short description.</div></div>
  <div class="col-md-6"><label for="uVideo" class="form-label">Video file</label><input id="uVideo" type="file" class="form-control" accept="video/mp4,video/webm,video/ogg,video/*"><div id="uVideoNote" class="form-text text-secondary">MP4 or WebM, up to 200 MB.</div></div>
  <div class="col-md-6"><label for="uPoster" class="form-label">Poster image</label><input id="uPoster" type="file" class="form-control" accept="image/*"><div class="form-text text-secondary">Cropped to 2:3 and resized automatically.</div>
   <div class="d-flex align-items-end gap-3 mt-2"><img id="uPosterPrev" class="poster-prev d-none" alt="Poster preview"><div class="form-check d-none" id="rmPosterWrap"><input class="form-check-input" type="checkbox" id="rmPoster"><label class="form-check-label small" for="rmPoster">Remove my poster</label></div></div></div>
 </div><div id="uMsg" class="mt-3" role="status"></div></div>
 <div class="modal-footer"><button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">Cancel</button><button id="uSave" type="submit" class="btn btn-accent">Save</button></div></form></div></div></div>
<div id="toast" class="alert toast-box" role="status" aria-live="polite"></div>`);
})();
