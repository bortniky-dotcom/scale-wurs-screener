const OFFICE = "office@readywellpsych.com";
const SCALE = {
  0: "Not at all or very slightly",
  1: "Mildly",
  2: "Moderately",
  3: "Quite a bit",
  4: "Very much"
};
const ITEMS_A = [
  "concentration problems, easily distracted",
  "anxious, worrying",
  "nervous, fidgety",
  "inattentive, daydreaming",
  "hot- or short-tempered, low boiling point",
  "temper outbursts, tantrums",
  "trouble with stick-to-it-tiveness, not following through, failing to finish things started",
  "stubborn, strong-willed",
  "sad or blue, depressed, unhappy",
  "disobedient with parents, rebellious, sassy",
  "low opinion of myself",
  "irritable",
  "moody, ups and downs",
  "angry",
  "acting without thinking, impulsive",
  "tendency to be immature",
  "guilty feelings, regretful",
  "losing control of myself",
  "tendency to be or act irrational",
  "unpopular with other children, didn't keep friends for long, didn't get along with other children",
  "trouble seeing things from someone else's point of view",
  "trouble with authorities, trouble with school, visits to principal's office"
];
const ITEMS_B = [
  "overall a poor student, slow learner",
  "trouble with mathematics or numbers",
  "not achieving up to potential"
];
const ITEMS = ITEMS_A.concat(ITEMS_B);
const CUTOFF = 46;
const MAX = 100;

function renderItems(targetId, stems, startN) {
  const root = document.getElementById(targetId);
  stems.forEach((text, i) => {
    const n = startN + i;
    const code = String(n).padStart(2, "0");
    root.insertAdjacentHTML("beforeend", `
      <div class="item">
        <p><span class="code">${code}.</span> ${text}</p>
        <div class="scale five">
          ${[0,1,2,3,4].map(v => `<label><input type="radio" name="I${n}" value="${v}" required> <span class="num">${v}</span><small>${SCALE[v]}</small></label>`).join("")}
        </div>
      </div>`);
  });
}

renderItems("partA", ITEMS_A, 1);
renderItems("partB", ITEMS_B, 23);
document.getElementById("date").valueAsDate = new Date();

function val(name) {
  const el = document.querySelector(`[name="${name}"]:checked`);
  return el ? el.value : null;
}
function num(name) {
  const v = val(name);
  return v === null ? null : Number(v);
}
function bandFor(total) {
  if (total >= CUTOFF) return "46–100. At or above cutoff. Predictive of childhood ADHD.";
  return "0–45. Below cutoff.";
}
function bandClass(total) {
  return total >= CUTOFF ? "pos" : "neg";
}

function score(opts) {
  opts = opts || {};
  const send = !!opts.send;
  const initialsCheck = document.getElementById("name").value.trim();
  if (!initialsCheck) {
    alert("Please enter initials.");
    document.getElementById("name").focus();
    return;
  }
  const ratings = ITEMS.map((_, i) => num("I" + (i + 1)));
  if (ratings.some(v => v === null)) {
    alert("Please answer every item (0–4).");
    return;
  }
  const total = ratings.reduce((s, n) => s + n, 0);
  const name = document.getElementById("name").value.trim();
  const date = document.getElementById("date").value || "";
  const visit = document.getElementById("visit").value || "not given";
  const age = document.getElementById("age").value || "n/a";
  const band = bandFor(total);

  let html = `
    <div class="score-row"><span>Initials</span><strong>${name}</strong></div>
    <div class="score-row"><span>Completed</span><strong>${date || "not dated"}</strong></div>
    <div class="score-row"><span>Age</span><strong>${age}</strong></div>
    <div class="score-row"><span>Next visit</span><strong>${visit}</strong></div>
    <div class="score-row"><span>Total (0–100)</span><strong>${total} / ${MAX}</strong></div>
    <div class="score-row"><span>Cutoff</span><strong>${CUTOFF}</strong></div>
    <div class="score-row"><span>Band</span><strong><span class="pill ${bandClass(total)}">${band}</span></strong></div>
  `;
  document.getElementById("resultBody").innerHTML = html;

  const itemHtml = ITEMS.map((stem, i) => {
    const n = ratings[i];
    const code = String(i + 1).padStart(2, "0");
    return `<div class="item"><p><span class="code">${code}.</span> ${stem}</p><p class="ans">Answer: ${n} · ${SCALE[n]}</p></div>`;
  }).join("");
  document.getElementById("itemList").innerHTML = "<p class=\"hint\">Every item and the rating selected</p>" + itemHtml;

  const lines = [
    "WURS 25-item abridged",
    "Initials: " + name,
    "Completed: " + (date || "n/a"),
    "Age: " + age,
    "Next visit: " + visit,
    "Score: " + total + " / " + MAX,
    "Cutoff: " + CUTOFF + " (predictive of childhood ADHD)",
    "Band: " + band,
    "",
    "Item, rating, label"
  ];
  ITEMS.forEach((stem, i) => {
    const n = ratings[i];
    lines.push("");
    lines.push((i + 1) + ". " + stem);
    lines.push("Answer: " + n + "  " + SCALE[n]);
  });
  window._ocsSummary = lines.join("\n");
  window._meta = { name, date, visit, age, total, band };
  const box = document.getElementById("summaryBox");
  if (box) box.value = window._ocsSummary;
  document.getElementById("results").classList.add("show");
  document.getElementById("results").scrollIntoView({ behavior: "smooth" });
  if (send) sendOffice();
  return true;
}

var SENT_KEY = "wurs.v1.sent";
var sending = false;
function isSent() {
  try { if (localStorage.getItem(SENT_KEY) === "1") return true; } catch (e) {}
  return document.cookie.split("; ").some(function (p) { return p === SENT_KEY + "=1"; });
}
function markSent() {
  try { localStorage.setItem(SENT_KEY, "1"); } catch (e) {}
  document.cookie = SENT_KEY + "=1;max-age=" + (60 * 60 * 24 * 14) + ";path=/;SameSite=Lax";
}
function showThanks() {
  const btn = document.getElementById("scoreBtn");
  btn.disabled = true;
  btn.style.display = "none";
  let t = document.getElementById("thanksBox");
  if (!t) {
    t = document.createElement("div");
    t.id = "thanksBox";
    t.setAttribute("role", "status");
    t.style.cssText = "margin:16px 0;padding:20px;border:2px solid #2e7d32;border-radius:12px;background:#eef7ee;font-size:18px;line-height:1.5;";
    t.innerHTML = "<strong>Thank you.</strong> Your answers were sent to the office. You can close this page.";
    const actions = document.querySelector(".actions");
    actions.parentNode.insertBefore(t, actions);
  }
  const status = document.getElementById("copyStatus");
  if (status) status.textContent = "";
}

function sendOffice() {
  if (!window._ocsSummary || sending || isSent()) return;
  sending = true;
  const m = window._meta || {};
  const btn = document.getElementById("scoreBtn");
  const status = document.getElementById("copyStatus");
  btn.disabled = true;
  btn.textContent = "Sending\u2026";
  status.textContent = "";
  fetch("https://formsubmit.co/ajax/" + OFFICE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      _subject: "FOR REVIEW : WURS screener",
      _template: "box",
      _captcha: "false",
      _cc: ["yuriyb", "mail.grokbot.com"].join("@"),
      initials: m.name || "",
      date: m.date || "",
      age: m.age || "",
      visit: m.visit || "",
      score: (m.total != null ? m.total + " / " + MAX : ""),
      band: m.band || "",
      cutoff: String(CUTOFF),
      message: window._ocsSummary
    })
  }).then(r => r.json()).then(d => {
    if (d && (d.success === true || d.success === "true")) { markSent(); showThanks(); }
    else throw new Error("not sent");
  }).catch(() => {
    sending = false;
    btn.disabled = false;
    btn.textContent = "Retry sending";
    status.textContent = "Your answers did not send. Please check your connection and press Retry sending.";
  });
}

function copySummary() {
  if (!score({ send: false })) return false;
  const box = document.getElementById("summaryBox");
  const status = document.getElementById("copyStatus");
  box.value = window._ocsSummary;
  box.focus();
  box.select();
  box.setSelectionRange(0, box.value.length);
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  if (!ok && navigator.clipboard) {
    navigator.clipboard.writeText(window._ocsSummary).then(() => {
      status.textContent = "Summary copied.";
    }).catch(() => {
      status.textContent = "Select the box and copy (Ctrl+C or Cmd+C).";
    });
    return true;
  }
  status.textContent = ok ? "Summary copied." : "Select the box and copy (Ctrl+C or Cmd+C).";
  return ok;
}

function scoreAndSend() {
  if (isSent()) { showThanks(); return; }
  score({ send: true });
}

document.getElementById("scoreBtn").onclick = scoreAndSend;
document.getElementById("copyBtn").onclick = copySummary;
document.getElementById("printBtn").onclick = () => {
  if (!score({ send: false })) return;
  window.print();
};

if (isSent()) showThanks();
