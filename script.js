const $ = id => document.getElementById(id);
// Expense categories
const cats = { Food: ["🍔", "#ef4444"], Travel: ["🚌", "#3b82f6"], Shopping: ["🛍️", "#a855f7"],
               Bills: ["💡", "#f59e0b"], Education: ["📚", "#10b981"], Other: ["📦", "#6b7280"] };
// Income categories
const inc = { Salary: ["💼", "#16a34a"], "Pocket Money": ["👛", "#22c55e"], Freelance: ["💻", "#14b8a6"],
              Gift: ["🎁", "#84cc16"], Other: ["💰", "#65a30d"] };

const inr = n => (n < 0 ? "-" : "") + "₹" + Math.abs(n).toLocaleString("en-IN");
const today = () => new Date().toLocaleDateString("en-CA");        // YYYY-MM-DD (local time)
const sum = arr => arr.reduce((s, e) => s + e.amount, 0);
const isInc = e => e.type === "income";                            // old data without type = expense
const info = e => (isInc(e) ? inc : cats)[e.cat] || ["📦", "#6b7280"];
const users = JSON.parse(localStorage.getItem("users")) || {};     // localStorage
let user, data = [], budget = 0, rate = 0, filter = "All", signup = false, type = "expense";

// ---------- Small helpers ----------
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  $("toast").appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

async function hash(p) {                                           // SHA-256 so plain password is not stored
  try {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(p));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
  } catch { return btoa(p); }
}

// ---------- Login / Signup ----------
function setMode(s) {
  signup = s;
  $("tabLogin").classList.toggle("active", !s);
  $("tabSignup").classList.toggle("active", s);
  $("name").hidden = !s;
  $("name").required = s;
  $("authBtn").textContent = s ? "Create Account" : "Login";
  $("authMsg").textContent = "";
}
$("tabLogin").onclick = () => setMode(false);
$("tabSignup").onclick = () => setMode(true);

$("authForm").onsubmit = async e => {
  e.preventDefault();
  const u = $("username").value.trim().toLowerCase(), p = $("password").value;
  const msg = t => $("authMsg").textContent = t;
  if (u.length < 3 || p.length < 4) return msg("Username min 3 and password min 4 characters.");
  const h = await hash(p);
  if (signup) {
    if (users[u]) return msg("Username already taken.");
    users[u] = { name: $("name").value.trim() || u, hash: h };
    localStorage.setItem("users", JSON.stringify(users));
    start(u);
  } else if (users[u] && users[u].hash === h) start(u);
  else msg("Wrong username or password.");
};

function start(u) {
  user = u;
  localStorage.setItem("current", u);
  data = JSON.parse(localStorage.getItem("exp_" + u)) || [];       // each user has own data
  budget = Number(localStorage.getItem("budget_" + u)) || 0;
  $("budget").value = budget || "";
  $("hello").textContent = `Hello, ${users[u].name} 👋`;
  $("auth").hidden = true;
  $("app").hidden = false;
  $("authForm").reset();
  render();
}

$("logout").onclick = () => {
  localStorage.removeItem("current");
  $("app").hidden = true;
  $("auth").hidden = false;
  setMode(false);
};

// ---------- Expense / Income toggle ----------
function setType(t) {
  type = t;
  $("tExp").classList.toggle("active", t == "expense");
  $("tInc").classList.toggle("active", t == "income");
  $("form").classList.toggle("income", t == "income");
  $("addBtn").textContent = t == "income" ? "Add Income" : "Add Expense";
  $("title").placeholder = t == "income" ? "Description (e.g. October salary)" : "Title (e.g. Lunch)";
  $("cat").innerHTML = Object.keys(t == "income" ? inc : cats).map(c => `<option>${c}</option>`).join("");
}
$("tExp").onclick = () => setType("expense");
$("tInc").onclick = () => setType("income");
setType("expense");
$("date").value = today();

// ---------- Filter chips, search, sort ----------
$("chips").innerHTML = ["All", "Income", ...Object.keys(cats)]
  .map(c => `<button class="chip${c == "All" ? " active" : ""}">${c}</button>`).join("");

$("chips").onclick = e => {
  if (!e.target.classList.contains("chip")) return;
  filter = e.target.textContent;
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c == e.target));
  renderList();
};
$("search").oninput = $("sort").onchange = () => renderList();

// ---------- Dashboard ----------
function render() {
  localStorage.setItem("exp_" + user, JSON.stringify(data));
  const exp = data.filter(e => !isInc(e)), incs = data.filter(isInc);
  const spent = sum(exp), earned = sum(incs), bal = earned - spent;
  const month = sum(exp.filter(e => e.date.startsWith(today().slice(0, 7))));

  // Stat cards
  $("balance").textContent = inr(bal);
  $("balance").style.color = bal < 0 ? "#dc2626" : "#16a34a";
  $("income").textContent = inr(earned);
  $("total").textContent = inr(spent);
  $("month").textContent = inr(month);
  $("usd").textContent = rate ? `≈ $${(bal * rate).toFixed(2)} USD (live rate)` : "";

  // Budget progress bar (based on this month's spending)
  const pct = budget ? Math.min(100, month / budget * 100) : 0;
  $("progress").style.width = pct + "%";
  $("progress").style.background = pct >= 100 ? "#dc2626" : pct >= 75 ? "#f59e0b" : "#22c55e";
  $("budgetText").textContent = !budget ? "No budget set"
    : month <= budget ? `${inr(budget - month)} left of ${inr(budget)}` : `Over budget by ${inr(month - budget)}`;

  // Canvas doughnut chart (expenses only) + legend
  const sums = {};
  exp.forEach(e => sums[e.cat] = (sums[e.cat] || 0) + e.amount);
  const ctx = $("pie").getContext("2d");
  ctx.clearRect(0, 0, 250, 250);
  ctx.textAlign = "center";
  let start = -Math.PI / 2, legend = "";
  Object.keys(sums).forEach(c => {
    const a = (sums[c] / spent) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(125, 125, 110, start, start + a);
    ctx.arc(125, 125, 65, start + a, start, true);
    ctx.fillStyle = cats[c] ? cats[c][1] : "#6b7280";
    ctx.fill();
    start += a;
    legend += `<li><span style="color:${cats[c] ? cats[c][1] : "#6b7280"}">●</span> ${c} · ${Math.round(sums[c] / spent * 100)}%</li>`;
  });
  ctx.fillStyle = "#1e3a8a";
  ctx.font = "bold 15px Arial";
  ctx.fillText(spent ? inr(spent) : "No data yet", 125, 130);
  $("legend").innerHTML = legend;

  // Canvas bar chart: income vs expense for last 6 months
  const months = [...Array(6)].map((_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return d; });
  const monthTotal = (arr, d) => sum(arr.filter(e => e.date.startsWith(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"))));
  const iv = months.map(d => monthTotal(incs, d)), ev = months.map(d => monthTotal(exp, d));
  const max = Math.max(...iv, ...ev, 1);
  const bc = $("bar").getContext("2d");
  bc.clearRect(0, 0, 400, 200);
  bc.font = "12px Arial";
  bc.textAlign = "left";
  bc.fillStyle = "#22c55e"; bc.fillRect(20, 6, 10, 10);
  bc.fillStyle = "#1e3a8a"; bc.fillText("Income", 34, 15);
  bc.fillStyle = "#3b82f6"; bc.fillRect(100, 6, 10, 10);
  bc.fillStyle = "#1e3a8a"; bc.fillText("Expense", 114, 15);
  bc.textAlign = "center";
  months.forEach((d, i) => {
    const x = 20 + i * 62, hi = iv[i] / max * 140, he = ev[i] / max * 140;
    bc.fillStyle = "#22c55e"; bc.fillRect(x, 170 - hi, 18, hi);
    bc.fillStyle = "#3b82f6"; bc.fillRect(x + 20, 170 - he, 18, he);
    bc.fillStyle = "#1e3a8a"; bc.fillText(d.toLocaleString("en", { month: "short" }), x + 19, 190);
  });

  renderList();
}

function renderList() {
  const q = $("search").value.toLowerCase(), [field, dir] = $("sort").value.split("-");
  const match = e => filter == "All" || (filter == "Income" ? isInc(e) : !isInc(e) && e.cat == filter);
  const list = data
    .filter(e => match(e) && e.title.toLowerCase().includes(q))
    .sort((a, b) => (field == "date" ? a.date.localeCompare(b.date) : a.amount - b.amount) * (dir == "asc" ? 1 : -1));

  $("list").innerHTML = list.length ? "" : "<p class='empty'>No transactions found</p>";
  list.forEach(e => {
    const [icon, color] = info(e);
    const li = document.createElement("li");
    li.draggable = true;                                           // Drag-and-Drop
    li.ondragstart = ev => ev.dataTransfer.setData("text", e.id);
    li.innerHTML = `<span class="ico" style="background:${color}33">${icon}</span>
      <div><b></b><small>${isInc(e) ? "Income · " : ""}${e.cat} · ${e.date}</small></div>
      <strong class="${isInc(e) ? "plus" : "minus"}">${isInc(e) ? "+" : "-"}${inr(e.amount)}</strong><button>✕</button>`;
    li.querySelector("b").textContent = e.title;
    li.querySelector("button").onclick = () => del(e.id);
    $("list").appendChild(li);
  });
}

const del = id => { data = data.filter(e => e.id !== id); render(); toast("Transaction deleted 🗑️"); };

$("form").onsubmit = e => {
  e.preventDefault();
  data.push({ id: Date.now(), type, title: $("title").value.trim(), amount: Number($("amount").value), cat: $("cat").value, date: $("date").value });
  e.target.reset();
  $("date").value = today();
  render();
  toast(type == "income" ? "Income added 💰" : "Expense added ✅");
};

$("budgetBtn").onclick = () => {
  budget = Number($("budget").value) || 0;
  localStorage.setItem("budget_" + user, budget);
  render();
  toast("Budget saved 💰");
};

// Drag a transaction onto the trash box
const trash = $("trash");
trash.ondragover = e => { e.preventDefault(); trash.classList.add("over"); };
trash.ondragleave = () => trash.classList.remove("over");
trash.ondrop = e => { e.preventDefault(); trash.classList.remove("over"); del(Number(e.dataTransfer.getData("text"))); };

// Export CSV
$("csv").onclick = () => {
  if (!data.length) return toast("Nothing to export!");
  const rows = data.map(e => `${e.date},${isInc(e) ? "Income" : "Expense"},"${e.title.replace(/"/g, '""')}",${e.cat},${e.amount}`);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["Date,Type,Title,Category,Amount\n" + rows.join("\n")], { type: "text/csv" }));
  a.download = user + "_transactions.csv";
  a.click();
};

// Live USD rate from a free REST API (async/await)
async function getRate() {
  try { rate = (await (await fetch("https://open.er-api.com/v6/latest/INR")).json()).rates.USD; }
  catch (err) { console.log("Rate not available", err); }
  if (user) render();
}

// ---------- On page load ----------
getRate();
const saved = localStorage.getItem("current");
if (saved && users[saved]) start(saved);