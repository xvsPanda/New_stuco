try{const t=localStorage.getItem("nn-theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.dataset.theme="dark";}catch(e){}

const themeToggle = document.getElementById("themeToggle");
const themeColor = document.getElementById("themeColor");
const savedTheme = localStorage.getItem("nn-theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
function setTheme(theme) {
  const dark = theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(dark));
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.firstElementChild.textContent = dark ? "☀" : "☾";
  themeColor.setAttribute("content", dark ? "#171514" : "#fcfaf7");
}
setTheme(savedTheme || (prefersDark ? "dark" : "light"));
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("nn-theme", next);
  setTheme(next);
});

const menuToggle = document.getElementById("menuToggle");
const mobileDrawer = document.getElementById("mobileDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerClose = document.getElementById("drawerClose");
let drawerReturnFocus = null;
function setDrawer(open) {
  mobileDrawer.classList.toggle("is-open", open);
  drawerBackdrop.classList.toggle("is-open", open);
  mobileDrawer.setAttribute("aria-hidden", String(!open));
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
  document.body.style.overflow = open ? "hidden" : "";
  if (open) { drawerReturnFocus = document.activeElement; drawerClose.focus(); }
  else if (drawerReturnFocus) drawerReturnFocus.focus();
}
menuToggle.addEventListener("click", () => setDrawer(true));
drawerClose.addEventListener("click", () => setDrawer(false));
drawerBackdrop.addEventListener("click", () => setDrawer(false));
document.querySelectorAll(".drawer-links a").forEach(link => link.addEventListener("click", () => setDrawer(false)));
document.addEventListener("keydown", event => { if (event.key === "Escape" && mobileDrawer.classList.contains("is-open")) setDrawer(false); });

const REP_BIO = g => `Represents Grade ${g} students on the council and passes their concerns and ideas to the leadership team.`;
const REP_JOBS = ["Class leadership", "Student voice", "Events"];
let members = [
  {name:"Munkhenerel", role:"President", cls:"12B", type:"leadership", photo:null, jobs:["Leadership","Strategic planning","Student advocacy","Council management"], bio:"Leads the council and speaks for students on campus life, working to make Nomt Naran a place where every student is heard.", email:"munkhenerel@student.naran.edu.mn"},
  {name:"Misheel", role:"Vice President", cls:"11A", type:"leadership", photo:null, jobs:["Operations","Event coordination","Team support"], bio:"Supports the president and runs day-to-day council operations, from planning events to keeping members connected.", email:"misheel@student.naran.edu.mn"},
  {name:"Bilguun", role:"Secretary", cls:"12B", type:"leadership", photo:null, jobs:["Documentation","Communications","Record keeping"], bio:"Keeps the council's records and announcements so students can see what was decided and why.", email:"bilguun@student.naran.edu.mn"},
  {name:"Tselmuun", role:"Class Representative", cls:"10B", type:"representative", photo:null, jobs:REP_JOBS, bio:REP_BIO("10B")},
  {name:"Emuujin", role:"Class Representative", cls:"11B", type:"representative", photo:null, jobs:REP_JOBS, bio:REP_BIO("11B")},
  {name:"Goomaral", role:"Class Representative", cls:"12A", type:"representative", photo:null, jobs:REP_JOBS, bio:REP_BIO("12A")},
  {name:"Enguun", role:"Class Representative", cls:"10A", type:"representative", photo:null, jobs:REP_JOBS, bio:REP_BIO("10A")},
  {name:"Chinhuslen", role:"Class Representative", cls:"10A", type:"representative", photo:null, jobs:REP_JOBS, bio:REP_BIO("10A")},
  {name:"", role:"Class Representative", cls:"11A", type:"representative", photo:null, jobs:REP_JOBS, bio:REP_BIO("11A")},
  {name:"", role:"Class Representative", cls:"12B", type:"representative", photo:null, jobs:REP_JOBS, bio:REP_BIO("12B")}
];
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const display = m => m.name || "To be announced";
const initial = m => (m.name || "?").charAt(0).toUpperCase();
const grade = m => m.cls.replace(/\D/g, "");
function avatar(m) { return m.photo ? `<img src="${esc(m.photo)}" alt="" loading="lazy">` : esc(initial(m)); }
let grade_filter = "all", class_filter = "all", status_filter = "all", sort_filter = "default", query = "", lastFocus = null;
let reps = members.filter(m => m.type === "representative");
let leaders = members.filter(m => m.type === "leadership");
const classes = new Set(members.map(m => m.cls));
$("heroMeta").innerHTML = `<div><strong>${members.length}</strong><span>council members</span></div><div><strong>${classes.size}</strong><span>classes represented</span></div>`;
$("leaders").innerHTML = leaders.map((m, i) => `<button class="leader ${i === 0 ? 'is-president' : ''}" data-i="${members.indexOf(m)}" aria-label="View ${esc(display(m))}, ${esc(m.role)}"><div class="portrait">${avatar(m)}</div><div class="leader-info"><h3>${esc(display(m))}</h3><span>${esc(m.role)} · Class ${esc(m.cls)}</span></div></button>`).join("");
const grades = [...new Set(reps.map(grade))].sort((a, b) => b - a);
$("filters").innerHTML = [`<button class="chip" data-g="all" aria-pressed="true">All grades</button>`].concat(grades.map(g => `<button class="chip" data-g="${g}" aria-pressed="false">Grade ${g}</button>`)).join("");
function renderGrid() {
  const list = reps.filter(m =>
    (grade_filter === "all" || grade(m) === grade_filter) &&
    (class_filter === "all" || m.cls === class_filter) &&
    (status_filter === "all" || (status_filter === "named" ? Boolean(m.name) : !m.name)) &&
    (!query || (display(m) + " " + m.cls + " " + m.role + " " + (m.jobs || []).join(" ")).toLowerCase().includes(query))
  ).sort((a, b) => sort_filter === "name" ? display(a).localeCompare(display(b)) : sort_filter === "class" ? a.cls.localeCompare(b.cls) || display(a).localeCompare(display(b)) : 0);
  $("grid").innerHTML = list.map(m => `<button class="row" data-i="${members.indexOf(m)}" aria-label="View ${esc(display(m))}, Class ${esc(m.cls)}"><span class="avatar">${avatar(m)}</span><span><b>${esc(display(m))}</b><small>Class ${esc(m.cls)}</small></span></button>`).join("");
  $("empty").classList.toggle("show", list.length === 0);
  $("count").textContent = list.length === reps.length && !query ? `${list.length} representatives` : `${list.length} of ${reps.length} representatives`;
}
const dlg = $("dialog");
function openMember(m) {
  $("dAvatar").innerHTML = avatar(m); $("dName").textContent = display(m); $("dRole").textContent = `${m.role} · Class ${m.cls}`;
  $("dTags").innerHTML = m.jobs.map(j => `<span>${esc(j)}</span>`).join(""); $("dBio").textContent = m.bio;
  const actions = []; if (m.email) actions.push(`<a class="btn primary" href="mailto:${esc(m.email)}">Email ${esc(display(m))}</a>`); actions.push(`<button class="btn" id="dClose">Close</button>`);
  $("dActions").innerHTML = actions.join(""); $("dClose").onclick = () => dlg.close(); lastFocus = document.activeElement; dlg.showModal();
}
dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener("close", () => lastFocus && lastFocus.focus());
document.addEventListener("click", e => { const card = e.target.closest("[data-i]"); if (card) return openMember(members[+card.dataset.i]); const chip = e.target.closest(".chip"); if (chip) { grade_filter = chip.dataset.g; document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c === chip)); renderGrid(); } });
$("search").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); renderGrid(); });
$("classFilter").addEventListener("change", e => { class_filter = e.target.value; renderGrid(); });
$("statusFilter").addEventListener("change", e => { status_filter = e.target.value; renderGrid(); });
$("sortFilter").addEventListener("change", e => { sort_filter = e.target.value; renderGrid(); });
$("clearFilters").addEventListener("click", () => { query = ""; grade_filter = "all"; class_filter = "all"; status_filter = "all"; sort_filter = "default"; $("search").value = ""; $("classFilter").value = "all"; $("statusFilter").value = "all"; $("sortFilter").value = "default"; document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", c.dataset.g === "all")); renderGrid(); });
function refreshDirectory() {
  reps = members.filter(m => m.type === "representative");
  leaders = members.filter(m => m.type === "leadership");
  const classes = new Set(members.map(m => m.cls));
  $("heroMeta").innerHTML = `<div><strong>${members.length}</strong><span>council members</span></div><div><strong>${classes.size}</strong><span>classes represented</span></div>`;
  $("leaders").innerHTML = leaders.map((m, i) => `<button class="leader ${i === 0 ? 'is-president' : ''}" data-i="${members.indexOf(m)}" aria-label="View ${esc(display(m))}, ${esc(m.role)}"><div class="portrait">${avatar(m)}</div><div class="leader-info"><h3>${esc(display(m))}</h3><span>${esc(m.role)} · Class ${esc(m.cls)}</span></div></button>`).join("");
  const grades = [...new Set(reps.map(grade))].sort((a, b) => b - a);
  $("filters").innerHTML = [`<button class="chip" data-g="all" aria-pressed="true">All grades</button>`].concat(grades.map(g => `<button class="chip" data-g="${g}" aria-pressed="false">Grade ${g}</button>`)).join("");
  const classes = [...new Set(reps.map(m => m.cls))].sort();
  $("classFilter").innerHTML = `<option value="all">All classes</option>` + classes.map(c => `<option value="${esc(c)}">Class ${esc(c)}</option>`).join("");
  $("classFilter").value = class_filter;
  renderGrid();
}
refreshDirectory();
try {
  const stored = JSON.parse(localStorage.getItem("nn-members") || "null");
  if (Array.isArray(stored)) { members = stored; refreshDirectory(); }
} catch (error) { /* Keep the embedded seed data if localStorage is unavailable. */ }
window.addEventListener("storage", event => {
  if (event.key !== "nn-members") return;
  try { const updated = JSON.parse(event.newValue || "[]"); if (Array.isArray(updated)) { members = updated; refreshDirectory(); } } catch (error) {}
});
