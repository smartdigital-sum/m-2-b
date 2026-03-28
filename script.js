// ===================================================================
//  GREEN VALLEY PUBLIC SCHOOL — MAIN SCRIPT (Firebase Integrated)
// ===================================================================

// ===================================================================
//  FIREBASE CONFIGURATION (Compat SDK - Global)
// ===================================================================

// NOTE: Firebase API keys are client-side safe, but ensure Firestore security rules
// restrict access appropriately. See: https://firebase.google.com/docs/rules
const firebaseConfig = {
  apiKey: "AIzaSyAHHfY81gd5ouT8Y1hZlyh_aU3IKfoKEhQ",
  authDomain: "school-demo-b7e31.firebaseapp.com",
  projectId: "school-demo-b7e31",
  storageBucket: "school-demo-b7e31.firebasestorage.app",
  messagingSenderId: "93854193533",
  appId: "1:93854193533:web:9647c1ce29b62d55921e14",
  measurementId: "G-20ZSKVJ62K",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===================================================================
//  CONSTANTS
// ===================================================================

const CLASS_SUBJECTS = {
  1: ["English", "Hindi", "Mathematics", "EVS", "Art & Craft"],
  2: ["English", "Hindi", "Mathematics", "EVS", "Art & Craft"],
  3: [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Studies",
    "Art & Craft",
  ],
  4: [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Studies",
    "Art & Craft",
  ],
  5: [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Studies",
    "Art & Craft",
  ],
  6: [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Studies",
    "Sanskrit",
  ],
  7: [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Studies",
    "Sanskrit",
  ],
  8: [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Studies",
    "Sanskrit",
  ],
  9: [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Studies",
    "Computer Science",
  ],
  10: [
    "English",
    "Hindi",
    "Mathematics",
    "Science",
    "Social Studies",
    "Computer Science",
  ],
};

const CLASS_TEACHERS = {
  1: "Mrs. Priya Devi",
  2: "Mr. Rajan Sharma",
  3: "Mrs. Anita Bora",
  4: "Mr. Dipak Das",
  5: "Mrs. Sima Kalita",
  6: "Mr. Hemanta Deka",
  7: "Mrs. Rekha Nath",
  8: "Mr. Bhupen Saikia",
  9: "Mrs. Mita Gogoi",
  10: "Mr. Arun Baruah",
};

const CLASS_STRENGTHS = {
  1: 48,
  2: 52,
  3: 50,
  4: 45,
  5: 48,
  6: 44,
  7: 42,
  8: 40,
  9: 38,
  10: 35,
};
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const EVENT_ICONS = {
  exam: "📝",
  sports: "🏆",
  cultural: "🎭",
  holiday: "🎉",
  meeting: "👨‍👩‍👧",
  other: "📌",
};
const NOTICE_ICONS = {
  info: "📢",
  warning: "⚠️",
  success: "✅",
  exam: "📝",
  holiday: "🎉",
};

// In-memory cache updated by real-time listeners
let _notices = [];
let _results = [];
let _events = [];
let _settings = { opening: "09:00", closing: "16:00" };
let _urgent = {};

// ===================================================================
//  HELPERS
// ===================================================================

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function formatRelTime(ts) {
  if (!ts) return "";
  const msVal = ts.toMillis ? ts.toMillis() : ts;
  const d = Date.now() - msVal,
    m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(msVal).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diff = Math.ceil((target - now) / 86400000);
  if (diff < 0) return "Passed";
  if (diff === 0) return "Today!";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function getGrade(pct) {
  if (pct >= 90) return { g: "A+", color: "#10b981", label: "Outstanding" };
  if (pct >= 80) return { g: "A", color: "#3b82f6", label: "Excellent" };
  if (pct >= 70) return { g: "B+", color: "#6366f1", label: "Very Good" };
  if (pct >= 60) return { g: "B", color: "#8b5cf6", label: "Good" };
  if (pct >= 50) return { g: "C+", color: "#f59e0b", label: "Average" };
  if (pct >= 40) return { g: "C", color: "#f97316", label: "Below Average" };
  if (pct >= 33) return { g: "D", color: "#ef4444", label: "Pass" };
  return { g: "F", color: "#dc2626", label: "Fail" };
}

function getSubjectGrade(marks) {
  const g = getGrade(marks);
  return `<span style="color:${g.color};font-weight:700">${g.g}</span>`;
}

function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

// ===================================================================
//  FIREBASE AUTH — ADMIN LOGIN
// ===================================================================

let currentAdmin = null;

auth.onAuthStateChanged((user) => {
  currentAdmin = user;
  // Update admin button appearance
  const btn = document.querySelector(".btn-admin-nav");
  if (btn) {
    if (user) {
      btn.innerHTML = '<i class="fas fa-unlock-alt"></i> Admin';
      btn.style.background = "#10b981";
    } else {
      btn.innerHTML = '<i class="fas fa-lock"></i> Admin';
      btn.style.background = "";
    }
  }
});

function openAdminLogin() {
  if (currentAdmin) {
    // Already logged in — open panel directly
    openAdminPanel();
    return;
  }
  document.getElementById("adminLoginModal").style.display = "flex";
  setTimeout(() => document.getElementById("adminEmailInput").focus(), 100);
}

function closeAdminLogin() {
  document.getElementById("adminLoginModal").style.display = "none";
  document.getElementById("adminEmailInput").value = "";
  document.getElementById("adminPasswordInput").value = "";
}

async function verifyAdmin() {
  const email = document.getElementById("adminEmailInput").value.trim();
  const password = document.getElementById("adminPasswordInput").value;
  const btn = document.querySelector("#adminLoginModal .btn-gold");

  if (!email || !password) {
    showToast("⚠️ Please enter email and password", "warning");
    return;
  }

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
  btn.disabled = true;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    closeAdminLogin();
    openAdminPanel();
    showToast("✅ Welcome, Admin!");
  } catch (err) {
    const inp = document.getElementById("adminPasswordInput");
    inp.style.borderColor = "#ef4444";
    inp.style.animation = "shake 0.4s ease";
    setTimeout(() => {
      inp.style.borderColor = "";
      inp.style.animation = "";
    }, 800);
    inp.value = "";
    showToast("❌ Invalid credentials. Please try again.", "error");
  } finally {
    btn.innerHTML = '<i class="fas fa-unlock"></i> Login';
    btn.disabled = false;
  }
}

async function adminLogout() {
  await auth.signOut();
  closeAdmin();
  showToast("👋 Logged out successfully", "info");
}

function openAdminPanel() {
  loadAdminPanel();
  document.getElementById("adminModal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeAdmin() {
  document.getElementById("adminModal").style.display = "none";
  document.body.style.overflow = "";
}

function loadAdminPanel() {
  renderAdminNotices();
  renderAdminResults();
  renderAdminEvents();
  // Load settings from cached data
  document.getElementById("schoolOpenInput").value =
    _settings.opening || "09:00";
  document.getElementById("schoolCloseInput").value =
    _settings.closing || "16:00";
  document.getElementById("urgentText").value = _urgent.text || "";
  document.getElementById("urgentDeadline").value = _urgent.deadline || "";
  document.getElementById("urgentShow").checked = _urgent.show || false;
}

function switchTab(btn, panelId) {
  document
    .querySelectorAll(".atab")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-panel")
    .forEach((p) => p.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(panelId).classList.add("active");
}

async function saveSettings() {
  const hours = {
    opening: document.getElementById("schoolOpenInput").value || "09:00",
    closing: document.getElementById("schoolCloseInput").value || "16:00",
  };
  const urgent = {
    text: document.getElementById("urgentText").value,
    deadline: document.getElementById("urgentDeadline").value,
    show: document.getElementById("urgentShow").checked,
  };

  try {
    await db.collection("settings").doc("school").set({ hours, urgent });
    showToast("✅ Settings saved successfully!");
    closeAdmin();
  } catch (e) {
    showToast("❌ Error saving settings: " + e.message, "error");
  }
}

// ===================================================================
//  FIRESTORE REAL-TIME LISTENERS (run once on init)
// ===================================================================

function startFirestoreListeners() {
  const adminModal = document.getElementById("adminModal");
  const isAdminOpen = () => adminModal && adminModal.style.display === "flex";

  // --- NOTICES ---
  db.collection("notices")
    .orderBy("timestamp", "desc")
    .onSnapshot(
      (snap) => {
        _notices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderNoticeBoard();
        if (isAdminOpen()) renderAdminNotices();
      },
      (err) => console.error("Notices listener error:", err),
    );

  // --- RESULTS ---
  db.collection("results").onSnapshot(
    (snap) => {
      _results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (isAdminOpen()) renderAdminResults();
    },
    (err) => console.error("Results listener error:", err),
  );

  // --- EVENTS ---
  db.collection("events")
    .orderBy("date", "asc")
    .onSnapshot(
      (snap) => {
        _events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderEvents();
        if (isAdminOpen()) renderAdminEvents();
      },
      (err) => console.error("Events listener error:", err),
    );

  // --- SETTINGS ---
  db.collection("settings").doc("school").onSnapshot(
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        _settings = data.hours || { opening: "09:00", closing: "16:00" };
        _urgent = data.urgent || {};
        updateSchoolStatus();
        updateUrgentBanner();
      }
    },
    (err) => console.error("Settings listener error:", err),
  );
}

// ===================================================================
//  NOTICES
// ===================================================================

async function addNotice() {
  if (!currentAdmin) {
    showToast("⚠️ Not logged in", "warning");
    return;
  }
  const text = document.getElementById("noticeText").value.trim();
  const type = document.getElementById("noticeType").value;
  if (!text) {
    showToast("⚠️ Please enter notice text", "warning");
    return;
  }

  try {
    await db.collection("notices").add({
      text,
      type,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    document.getElementById("noticeText").value = "";
    showToast("📢 Notice posted!");
  } catch (e) {
    showToast("❌ Error: " + e.message, "error");
  }
}

async function deleteNotice(id) {
  if (!currentAdmin) return;
  try {
    await db.collection("notices").doc(id).delete();
    showToast("🗑️ Notice deleted", "info");
  } catch (e) {
    showToast("❌ Error: " + e.message, "error");
  }
}

function renderAdminNotices() {
  const list = document.getElementById("adminNoticesList");
  if (!_notices.length) {
    list.innerHTML = '<div class="empty-msg">No notices yet</div>';
    return;
  }
  list.innerHTML = _notices
    .map(
      (n) => `
    <div class="admin-list-item">
      <span class="ali-icon">${NOTICE_ICONS[n.type] || "📢"}</span>
      <span class="ali-text">${n.text}</span>
      <span class="ali-meta">${formatRelTime(n.timestamp)}</span>
      <button class="ali-del" onclick="deleteNotice('${n.id}')"><i class="fas fa-trash"></i></button>
    </div>`,
    )
    .join("");
}

function renderNoticeBoard() {
  const container = document.getElementById("noticesDisplay");
  const empty = document.getElementById("noticesEmpty");
  const ticker = document.getElementById("tickerText");

  container.querySelectorAll(".notice-card").forEach((c) => c.remove());

  if (!_notices.length) {
    empty.style.display = "flex";
    ticker.textContent = "No notices at the moment — Check back soon!";
    return;
  }
  empty.style.display = "none";
  ticker.textContent = _notices
    .map((n) => `${NOTICE_ICONS[n.type]}  ${n.text}`)
    .join("   •   ");

  _notices.forEach((n, i) => {
    const card = document.createElement("div");
    card.className = `notice-card nc-${n.type}`;
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = `
      <div class="nc-icon">${NOTICE_ICONS[n.type] || "📢"}</div>
      <div class="nc-body">
        <p class="nc-text">${n.text}</p>
        <span class="nc-time"><i class="far fa-clock"></i> ${formatRelTime(n.timestamp)}</span>
      </div>
      <div class="nc-tag nc-tag-${n.type}">${n.type.toUpperCase()}</div>`;
    container.appendChild(card);
  });
  setTimeout(observeReveal, 100);
}

// ===================================================================
//  RESULTS
// ===================================================================

function loadSubjectFields() {
  const cls = parseInt(document.getElementById("rClass").value);
  const wrap = document.getElementById("subjectFieldsWrap");
  if (!cls) {
    wrap.innerHTML =
      '<p class="hint-text"><i class="fas fa-info-circle"></i> Select a class to enter marks</p>';
    return;
  }
  const subjects = CLASS_SUBJECTS[cls];
  wrap.innerHTML = `
    <p class="subjects-heading"><i class="fas fa-pen"></i> Enter Marks (out of 100) — Pass Mark: 33</p>
    <div class="subjects-marks-grid">
      ${subjects
        .map(
          (s) => `
        <div class="mark-field">
          <label>${s}</label>
          <input type="number" id="mark_${s.replace(/\s+/g, "_")}" min="0" max="100" placeholder="0–100" />
        </div>`,
        )
        .join("")}
    </div>`;
}

async function saveResult() {
  if (!currentAdmin) {
    showToast("⚠️ Not logged in", "warning");
    return;
  }
  const cls = parseInt(document.getElementById("rClass").value);
  const section = document.getElementById("rSection").value;
  const roll = document.getElementById("rRoll").value.trim();
  const name = document.getElementById("rName").value.trim();
  const father = document.getElementById("rFather").value.trim();
  const exam = document.getElementById("rExam").value;

  if (!cls || !roll || !name) {
    showToast("⚠️ Please fill Class, Roll No, and Name", "warning");
    return;
  }

  const subjects = CLASS_SUBJECTS[cls];
  const marks = {};
  let valid = true;
  subjects.forEach((s) => {
    const id = `mark_${s.replace(/\s+/g, "_")}`;
    const inputEl = document.getElementById(id);
    const val = inputEl ? parseInt(inputEl.value) : NaN;
    if (isNaN(val) || val < 0 || val > 100) {
      valid = false;
      return;
    }
    marks[s] = val;
  });
  if (!valid) {
    showToast(
      "⚠️ Please enter valid marks (0–100) for all subjects",
      "warning",
    );
    return;
  }

  // Use composite ID to allow update on duplicate
  const docId = `${cls}_${roll}_${exam.replace(/\s+/g, "_")}`;
  const entry = {
    class: cls,
    section,
    rollNo: roll,
    name,
    fatherName: father,
    exam,
    marks,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("results").doc(docId).set(entry);
    showToast(`✅ Result saved for ${name} (Class ${cls})`);
    document.getElementById("rRoll").value = "";
    document.getElementById("rName").value = "";
    document.getElementById("rFather").value = "";
    document.getElementById("subjectFieldsWrap").innerHTML =
      '<p class="hint-text"><i class="fas fa-info-circle"></i> Select a class to enter marks</p>';
    document.getElementById("rClass").value = "";
  } catch (e) {
    showToast("❌ Error: " + e.message, "error");
  }
}

async function deleteResult(id) {
  if (!currentAdmin) return;
  try {
    await db.collection("results").doc(id).delete();
    showToast("🗑️ Result deleted", "info");
  } catch (e) {
    showToast("❌ Error: " + e.message, "error");
  }
}

function renderAdminResults() {
  const list = document.getElementById("adminResultsList");
  const filterCls = document.getElementById("filterResultClass").value;
  const filterExam = document.getElementById("filterResultExam").value;
  let results = [..._results];
  if (filterCls) results = results.filter((r) => r.class == filterCls);
  if (filterExam) results = results.filter((r) => r.exam === filterExam);

  if (!results.length) {
    list.innerHTML = '<div class="empty-msg">No results found</div>';
    return;
  }

  list.innerHTML = results
    .map((r) => {
      const subjects = CLASS_SUBJECTS[r.class] || [];
      const total = subjects.reduce((s, sub) => s + (r.marks[sub] || 0), 0);
      const max = subjects.length * 100;
      const pct = ((total / max) * 100).toFixed(1);
      const grade = getGrade(parseFloat(pct));
      return `
      <div class="admin-list-item">
        <div class="ali-result-info">
          <strong>${r.name}</strong>
          <span>Class ${r.class}-${r.section} | Roll: ${r.rollNo} | ${r.exam}</span>
        </div>
        <div class="ali-result-grade" style="color:${grade.color}">${pct}% (${grade.g})</div>
        <button class="ali-del" onclick="deleteResult('${r.id}')"><i class="fas fa-trash"></i></button>
      </div>`;
    })
    .join("");
}

function searchResult() {
  const cls = document.getElementById("searchClass").value;
  const roll = document.getElementById("searchRoll").value.trim();
  const exam = document.getElementById("searchExam").value;

  if (!cls || !roll) {
    showToast("⚠️ Please enter your class and roll number", "warning");
    return;
  }

  const matches = _results.filter(
    (r) =>
      r.class == cls &&
      r.rollNo.toLowerCase() === roll.toLowerCase() &&
      (!exam || r.exam === exam),
  );

  if (!matches.length) {
    showResultNotFound();
    return;
  }
  if (matches.length === 1) {
    displayResult(matches[0]);
  } else {
    displayMultipleResults(matches);
  }
}

function showResultNotFound() {
  const panel = document.getElementById("resultDisplay");
  panel.innerHTML = `
    <div class="result-not-found">
      <div class="rnf-icon"><i class="fas fa-search"></i></div>
      <h3>Result Not Found</h3>
      <p>No result found for the given details.<br />Please check your class and roll number, or contact the school office.</p>
      <button class="btn btn-outline-dark" onclick="resetResultPanel()">Try Again</button>
    </div>`;
}

function displayMultipleResults(matches) {
  const panel = document.getElementById("resultDisplay");
  panel.innerHTML = `
    <div class="multi-result-picker">
      <h3><i class="fas fa-list-ul"></i> Multiple Results Found</h3>
      <p>Select an examination to view:</p>
      <div class="exam-pick-list">
        ${matches
          .map(
            (r, i) => `
          <button class="exam-pick-btn" onclick="displayResultFromData(${i})">
            <i class="fas fa-file-alt"></i> ${r.exam}
            <span>${formatRelTime(r.timestamp)}</span>
          </button>`,
          )
          .join("")}
      </div>
    </div>`;
  window._multiResults = matches;
}

function displayResultFromData(idx) {
  displayResult(window._multiResults[idx]);
}

function displayResult(r) {
  const subjects = CLASS_SUBJECTS[r.class] || [];
  const total = subjects.reduce((s, sub) => s + (r.marks[sub] || 0), 0);
  const maxTotal = subjects.length * 100;
  const pct = parseFloat(((total / maxTotal) * 100).toFixed(1));
  const grade = getGrade(pct);
  const passed = subjects.every((sub) => (r.marks[sub] || 0) >= 33);

  const classResults = _results.filter(
    (res) => res.class == r.class && res.exam === r.exam,
  );
  const sorted = classResults
    .map((res) => {
      const subs = CLASS_SUBJECTS[res.class] || [];
      return {
        ...res,
        total: subs.reduce((s, sub) => s + (res.marks[sub] || 0), 0),
      };
    })
    .sort((a, b) => b.total - a.total);
  const rank = sorted.findIndex((res) => res.rollNo === r.rollNo) + 1;

  const panel = document.getElementById("resultDisplay");
  panel.innerHTML = `
    <div class="result-card" id="printableResult">
      <div class="rc-header">
        <div class="rc-school-logo"><i class="fas fa-graduation-cap"></i></div>
        <div class="rc-school-info">
          <h2>Green Valley Public School</h2>
          <p>Silchar, Assam — CBSE Affiliated</p>
          <span class="rc-doc-type">Official Result Card</span>
        </div>
      </div>
      <div class="rc-student-info">
        <div class="rc-info-item"><span class="rci-label">Student Name</span><span class="rci-val">${r.name.toUpperCase()}</span></div>
        <div class="rc-info-item"><span class="rci-label">Father's Name</span><span class="rci-val">${r.fatherName ? r.fatherName.toUpperCase() : "—"}</span></div>
        <div class="rc-info-item"><span class="rci-label">Class</span><span class="rci-val">${ROMAN[r.class - 1]} (Class ${r.class}) — Section ${r.section}</span></div>
        <div class="rc-info-item"><span class="rci-label">Roll Number</span><span class="rci-val">${r.rollNo}</span></div>
        <div class="rc-info-item"><span class="rci-label">Examination</span><span class="rci-val">${r.exam}</span></div>
        <div class="rc-info-item"><span class="rci-label">Class Teacher</span><span class="rci-val">${CLASS_TEACHERS[r.class]}</span></div>
      </div>
      <div class="rc-marks-table-wrap">
        <table class="rc-marks-table">
          <thead>
            <tr><th>#</th><th>Subject</th><th>Marks Obtained</th><th>Max Marks</th><th>Grade</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${subjects
              .map((sub, i) => {
                const m = r.marks[sub] || 0;
                const subPass = m >= 33;
                const subGradeInfo = getGrade(m);
                return `<tr class="${subPass ? "" : "fail-row"}">
                <td>${i + 1}</td><td>${sub}</td>
                <td class="marks-num" style="color:${subGradeInfo.color}">${m}</td>
                <td>100</td><td>${getSubjectGrade(m)}</td>
                <td>${subPass ? '<span class="pass-chip">PASS</span>' : '<span class="fail-chip">FAIL</span>'}</td>
              </tr>`;
              })
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="rc-summary">
        <div class="rc-sum-item"><span class="rcs-label">Total Marks</span><span class="rcs-val">${total} / ${maxTotal}</span></div>
        <div class="rc-sum-item"><span class="rcs-label">Percentage</span><span class="rcs-val">${pct}%</span></div>
        <div class="rc-sum-item"><span class="rcs-label">Overall Grade</span><span class="rcs-val" style="color:${grade.color}">${grade.g} — ${grade.label}</span></div>
        ${rank > 0 ? `<div class="rc-sum-item"><span class="rcs-label">Class Rank</span><span class="rcs-val">${rank} of ${classResults.length}</span></div>` : ""}
      </div>
      <div class="rc-result-banner ${passed ? "banner-pass" : "banner-fail"}">
        ${
          passed
            ? `<i class="fas fa-check-circle"></i> <strong>RESULT: PASSED</strong>`
            : `<i class="fas fa-times-circle"></i> <strong>RESULT: FAILED</strong> — Please contact the school office`
        }
      </div>
      <div class="rc-footer-actions no-print">
        <button class="btn btn-gold" onclick="window.print()"><i class="fas fa-print"></i> Print Report Card</button>
        <button class="btn btn-outline-dark" onclick="resetResultPanel()"><i class="fas fa-search"></i> Search Another</button>
      </div>
    </div>`;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetResultPanel() {
  document.getElementById("resultDisplay").innerHTML = `
    <div class="result-placeholder" id="resultPlaceholder">
      <div class="placeholder-icon"><i class="fas fa-trophy"></i></div>
      <h3>Your Result Will Appear Here</h3>
      <p>Search using your class and roll number</p>
    </div>`;
}

// ===================================================================
//  EVENTS
// ===================================================================

async function addEvent() {
  if (!currentAdmin) {
    showToast("⚠️ Not logged in", "warning");
    return;
  }
  const title = document.getElementById("evTitle").value.trim();
  const date = document.getElementById("evDate").value;
  const type = document.getElementById("evType").value;
  const classes = document.getElementById("evClasses").value.trim();
  const desc = document.getElementById("evDesc").value.trim();

  if (!title || !date) {
    showToast("⚠️ Please enter event title and date", "warning");
    return;
  }

  try {
    await db.collection("events").add({
      title,
      date,
      type,
      classes: classes || "All",
      desc,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });
    document.getElementById("evTitle").value = "";
    document.getElementById("evDate").value = "";
    document.getElementById("evClasses").value = "";
    document.getElementById("evDesc").value = "";
    showToast("🎉 Event added!");
  } catch (e) {
    showToast("❌ Error: " + e.message, "error");
  }
}

async function deleteEvent(id) {
  if (!currentAdmin) return;
  try {
    await db.collection("events").doc(id).delete();
    showToast("🗑️ Event deleted", "info");
  } catch (e) {
    showToast("❌ Error: " + e.message, "error");
  }
}

function renderAdminEvents() {
  const list = document.getElementById("adminEventsList");
  if (!_events.length) {
    list.innerHTML = '<div class="empty-msg">No events yet</div>';
    return;
  }
  list.innerHTML = _events
    .map(
      (e) => `
    <div class="admin-list-item">
      <span class="ali-icon">${EVENT_ICONS[e.type] || "📌"}</span>
      <div class="ali-result-info">
        <strong>${e.title}</strong>
        <span>${formatDate(e.date)} · ${e.classes}</span>
      </div>
      <span class="ali-meta ev-soon">${daysUntil(e.date)}</span>
      <button class="ali-del" onclick="deleteEvent('${e.id}')"><i class="fas fa-trash"></i></button>
    </div>`,
    )
    .join("");
}

function renderEvents() {
  const container = document.getElementById("eventsDisplay");
  const empty = document.getElementById("eventsEmpty");
  container.querySelectorAll(".event-card").forEach((c) => c.remove());
  if (!_events.length) {
    empty.style.display = "flex";
    return;
  }
  empty.style.display = "none";
  _events.forEach((e, i) => {
    const card = document.createElement("div");
    card.className = `event-card ev-${e.type}`;
    card.style.animationDelay = `${i * 0.08}s`;
    const du = daysUntil(e.date);
    const isPast = du === "Passed";
    card.innerHTML = `
      <div class="ev-accent"></div>
      <div class="ev-icon">${EVENT_ICONS[e.type] || "📌"}</div>
      <div class="ev-body">
        <div class="ev-top-row">
          <span class="ev-type-tag ev-tag-${e.type}">${e.type.toUpperCase()}</span>
          <span class="ev-countdown ${isPast ? "ev-past" : ""}">${du}</span>
        </div>
        <h4 class="ev-title">${e.title}</h4>
        <div class="ev-date"><i class="fas fa-calendar-day"></i> ${formatDate(e.date)}</div>
        ${e.desc ? `<p class="ev-desc">${e.desc}</p>` : ""}
        <div class="ev-classes-tag"><i class="fas fa-users"></i> ${e.classes}</div>
      </div>`;
    container.appendChild(card);
  });
  setTimeout(observeReveal, 100);
}

// ===================================================================
//  CLASSES GRID
// ===================================================================

function renderClasses() {
  const grid = document.getElementById("classesGrid");
  const groups = [
    {
      label: "Primary",
      classes: [1, 2],
      color: "#10b981",
      icon: "fa-seedling",
    },
    { label: "Junior", classes: [3, 4, 5], color: "#3b82f6", icon: "fa-leaf" },
    { label: "Middle", classes: [6, 7, 8], color: "#8b5cf6", icon: "fa-tree" },
    {
      label: "Secondary",
      classes: [9, 10],
      color: "#d97706",
      icon: "fa-graduation-cap",
    },
  ];
  let html = "";
  groups.forEach((g) => {
    g.classes.forEach((c) => {
      const subCount = CLASS_SUBJECTS[c].length;
      html += `
        <div class="class-card" onclick="openClassModal(${c})" style="--cls-color:${g.color}">
          <div class="cc-top">
            <div class="cc-num">Class<br /><span class="cc-roman">${ROMAN[c - 1]}</span></div>
            <div class="cc-badge" style="background:${g.color}">${g.label}</div>
          </div>
          <div class="cc-teacher"><i class="fas fa-chalkboard-teacher"></i> ${CLASS_TEACHERS[c]}</div>
          <div class="cc-meta">
            <span><i class="fas fa-users"></i> ${CLASS_STRENGTHS[c]} Students</span>
            <span><i class="fas fa-book"></i> ${subCount} Subjects</span>
          </div>
          <div class="cc-hover-label">View Details <i class="fas fa-arrow-right"></i></div>
        </div>`;
    });
  });
  grid.innerHTML = html;
}

function openClassModal(cls) {
  const subjects = CLASS_SUBJECTS[cls];
  const teacher = CLASS_TEACHERS[cls];
  const strength = CLASS_STRENGTHS[cls];
  const roman = ROMAN[cls - 1];
  const groupLabel =
    cls <= 2
      ? "Primary"
      : cls <= 5
        ? "Junior"
        : cls <= 8
          ? "Middle School"
          : "Secondary";

  document.getElementById("classModalContent").innerHTML = `
    <div class="class-modal-header">
      <div class="cm-class-num">Class ${roman}</div>
      <div class="cm-info">
        <span class="cm-group">${groupLabel} Section</span>
        <h2>Class ${roman} — Details</h2>
        <p>Green Valley Public School</p>
      </div>
    </div>
    <div class="cm-details-grid">
      <div class="cm-detail-card"><i class="fas fa-chalkboard-teacher"></i><div><span>Class Teacher</span><strong>${teacher}</strong></div></div>
      <div class="cm-detail-card"><i class="fas fa-users"></i><div><span>Strength</span><strong>${strength} Students</strong></div></div>
      <div class="cm-detail-card"><i class="fas fa-book-open"></i><div><span>Subjects</span><strong>${subjects.length} Subjects</strong></div></div>
      <div class="cm-detail-card"><i class="fas fa-clock"></i><div><span>School Hours</span><strong>9:00 AM – 4:00 PM</strong></div></div>
    </div>
    <div class="cm-subjects">
      <h3><i class="fas fa-list-alt"></i> Subjects Taught</h3>
      <div class="cm-subjects-grid">
        ${subjects
          .map(
            (s, i) => `
          <div class="cm-subject-chip">
            <span class="chip-num">${i + 1}</span>
            <span>${s}</span>
          </div>`,
          )
          .join("")}
      </div>
    </div>
    <div class="cm-actions">
      <button class="btn btn-gold" onclick="document.getElementById('searchClass').value='${cls}'; closeClassModal(); scrollTo('results')">
        <i class="fas fa-search"></i> Check Results for Class ${roman}
      </button>
    </div>`;
  document.getElementById("classModal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeClassModal() {
  document.getElementById("classModal").style.display = "none";
  document.body.style.overflow = "";
}

// ===================================================================
//  SCHOOL STATUS & TIMERS
// ===================================================================

function formatTime12(t) {
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  const ap = hr >= 12 ? "PM" : "AM";
  const dh = hr % 12 || 12;
  return `${dh}:${m} ${ap}`;
}

function updateSchoolStatus() {
  const hrs = _settings;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = hrs.opening.split(":").map(Number);
  const [ch, cm] = hrs.closing.split(":").map(Number);
  const open = oh * 60 + om,
    close = ch * 60 + cm;
  const isOpen = cur >= open && cur < close;
  const isWeekend = now.getDay() === 0;

  document.getElementById("schoolOpenTime").textContent = formatTime12(
    hrs.opening,
  );
  document.getElementById("schoolCloseTime").textContent = formatTime12(
    hrs.closing,
  );

  const badge = document.getElementById("schoolStatusBadge");
  const text = document.getElementById("schoolStatusText");
  const card = document.getElementById("schoolStatusCard");
  const glow = document.getElementById("statusGlow");
  const iconBox = document.getElementById("statusIconBox");

  if (!badge || !text || !card) return;

  if (isWeekend) {
    badge.textContent = "HOLIDAY";
    badge.className = "status-badge closed";
    text.textContent = "School is Closed (Weekend)";
    card.className = "school-status-card is-closed";
    if (glow) glow.className = "status-glow glow-closed";
    if (iconBox) iconBox.className = "status-icon-box icon-closed";
  } else if (isOpen) {
    badge.textContent = "OPEN";
    badge.className = "status-badge open";
    text.textContent = "School is Open";
    card.className = "school-status-card is-open";
    if (glow) glow.className = "status-glow glow-open";
    if (iconBox) iconBox.className = "status-icon-box icon-open";
  } else {
    badge.textContent = "CLOSED";
    badge.className = "status-badge closed";
    text.textContent =
      cur < open ? "School Not Started Yet" : "School Hours Over";
    card.className = "school-status-card is-closed";
    if (glow) glow.className = "status-glow glow-closed";
    if (iconBox) iconBox.className = "status-icon-box icon-closed";
  }
}

function updateSchoolCountdown() {
  const hrs = _settings;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const [oh, om] = hrs.opening.split(":").map(Number);
  const [ch, cm] = hrs.closing.split(":").map(Number);
  const open = oh * 60 + om,
    close = ch * 60 + cm;

  let diff, label;
  if (cur < open) {
    diff = open - cur;
    label = "School starts in";
  } else if (cur < close) {
    diff = close - cur;
    label = "School ends in";
  } else {
    diff = open + 24 * 60 - cur;
    label = "Opens tomorrow in";
  }

  const h = Math.floor(diff / 60);
  const m = Math.floor(diff % 60);
  const s = Math.floor((diff * 60) % 60);
  const el = document.getElementById("schoolCountdown");
  if (el)
    el.textContent = h > 0 ? `${label}: ${h}h ${m}m` : `${label}: ${m}m ${s}s`;
}

function updateUrgentBanner() {
  const urg = _urgent;
  const banner = document.getElementById("urgentBanner");
  if (urg.show && urg.text) {
    banner.style.display = "flex";
    const noticeText = document.getElementById("urgentNoticeText");
    if (noticeText) noticeText.textContent = urg.text;
    updateUrgentCountdown();
  } else {
    banner.style.display = "none";
  }
}

function updateUrgentCountdown() {
  const urg = _urgent;
  const el = document.getElementById("urgentCountdown");
  if (!el || !urg.deadline) {
    if (el) el.textContent = "No deadline set";
    return;
  }
  const diff = new Date(urg.deadline) - new Date();
  if (diff <= 0) {
    el.textContent = "Deadline passed!";
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  el.textContent =
    d > 0 ? `${d}d ${h}h ${m}m remaining` : `${h}h ${m}m ${s}s remaining`;
}

function updateLiveClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  const clockEl = document.getElementById("liveClock");
  if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;
  const dateEl = document.getElementById("liveDate");
  if (dateEl)
    dateEl.textContent = now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const boardTime = document.getElementById("boardTime");
  if (boardTime)
    boardTime.textContent =
      now.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
      " · " +
      `${h}:${m}`;
}

// ===================================================================
//  GALLERY
// ===================================================================

let lightboxImgs = [],
  lightboxIdx = 0;

function filterGallery(cat, btn) {
  document
    .querySelectorAll(".fbtn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  document.querySelectorAll(".g-item").forEach((item) => {
    item.classList.toggle("hidden", cat !== "all" && item.dataset.cat !== cat);
  });
}

function openLightbox(el) {
  const visible = Array.from(document.querySelectorAll(".g-item:not(.hidden)"));
  lightboxIdx = visible.indexOf(el);
  lightboxImgs = visible.map((i) => i.querySelector("img")?.src).filter(Boolean);
  const lbImg = document.querySelector(".lb-img");
  const lightbox = document.getElementById("lightbox");
  if (lbImg && lightbox && lightboxImgs.length > 0) {
    lbImg.src = lightboxImgs[lightboxIdx];
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) lightbox.style.display = "none";
  document.body.style.overflow = "";
}

function nextImg(e) {
  e.stopPropagation();
  if (lightboxImgs.length === 0) return;
  lightboxIdx = (lightboxIdx + 1) % lightboxImgs.length;
  const lbImg = document.querySelector(".lb-img");
  if (lbImg) lbImg.src = lightboxImgs[lightboxIdx];
}

function prevImg(e) {
  e.stopPropagation();
  if (lightboxImgs.length === 0) return;
  lightboxIdx = (lightboxIdx - 1 + lightboxImgs.length) % lightboxImgs.length;
  const lbImg = document.querySelector(".lb-img");
  if (lbImg) lbImg.src = lightboxImgs[lightboxIdx];
}

document.addEventListener("keydown", (e) => {
  const lightbox = document.getElementById("lightbox");
  if (lightbox && lightbox.style.display === "flex") {
    if (e.key === "ArrowRight") nextImg(e);
    else if (e.key === "ArrowLeft") prevImg(e);
    else if (e.key === "Escape") closeLightbox();
  }
  if (e.key === "Escape") {
    document.querySelectorAll(".modal").forEach((m) => {
      if (m.style.display === "flex") {
        m.style.display = "none";
        document.body.style.overflow = "";
      }
    });
  }
});

// ===================================================================
//  FORM
// ===================================================================

function handleContact(e) {
  e.preventDefault();
  showToast("✅ Message sent! We will contact you shortly.");
  e.target.reset();
}

// ===================================================================
//  STATS COUNTER
// ===================================================================

function animateStats() {
  document.querySelectorAll(".stat-num").forEach((el) => {
    const target = parseInt(el.dataset.target);
    const step = target / 70;
    let cur = 0;
    const tick = () => {
      cur += step;
      if (cur < target) {
        el.textContent = Math.floor(cur);
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    };
    tick();
  });
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      animateStats();
      statsObserver.disconnect();
    }
  },
  { threshold: 0.5 },
);
const statsBar = document.querySelector(".stats-bar");
if (statsBar) statsObserver.observe(statsBar);

// ===================================================================
//  NAVBAR
// ===================================================================

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});
document.querySelectorAll(".nav-link").forEach((l) =>
  l.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  }),
);

window.addEventListener("scroll", () => {
  document
    .getElementById("navbar")
    .classList.toggle("scrolled", window.pageYOffset > 80);
  let cur = "";
  document.querySelectorAll("section").forEach((s) => {
    if (window.pageYOffset >= s.offsetTop - 200) cur = s.id;
  });
  document.querySelectorAll(".nav-link").forEach((l) => {
    l.classList.toggle("active", l.getAttribute("href") === "#" + cur);
  });
});

document.querySelectorAll(".modal").forEach((m) => {
  m.addEventListener("click", (e) => {
    if (e.target === m) {
      m.style.display = "none";
      document.body.style.overflow = "";
    }
  });
});

// ===================================================================
//  SCROLL REVEAL
// ===================================================================

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("revealed");
      }
    });
  },
  { threshold: 0.08 },
);

function observeReveal() {
  document
    .querySelectorAll(".class-card, .notice-card, .event-card, .contact-card")
    .forEach((el) => {
      el.classList.add("reveal-item");
      revealObserver.observe(el);
    });
}

// ===================================================================
//  HERO PARTICLES
// ===================================================================

function createParticles() {
  const c = document.getElementById("heroParticles");
  if (!c) return;
  for (let i = 0; i < 25; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.cssText = `
      left:${Math.random() * 100}%;top:${Math.random() * 100}%;
      width:${Math.random() * 5 + 1}px;height:${Math.random() * 5 + 1}px;
      opacity:${Math.random() * 0.4 + 0.1};
      animation-delay:${Math.random() * 8}s;
      animation-duration:${Math.random() * 5 + 5}s;`;
    c.appendChild(p);
  }
}

// ===================================================================
//  INIT
// ===================================================================

function init() {
  renderClasses();
  updateSchoolStatus();
  updateUrgentBanner();
  updateLiveClock();
  createParticles();
  startFirestoreListeners();

  setInterval(() => {
    updateLiveClock();
    updateSchoolCountdown();
    updateUrgentCountdown();
    updateSchoolStatus();
  }, 1000);

  const footerYear = document.getElementById("footerYear");
  if (footerYear) footerYear.textContent = new Date().getFullYear();
  setTimeout(observeReveal, 300);
}

window.addEventListener("load", () => {
  document.body.style.opacity = "1";
  init();
});
console.log(
  "%c🎓 Green Valley Public School",
  "color:#d97706;font-size:20px;font-weight:bold;",
);

// ===================================================================
//  EXPOSE FUNCTIONS TO GLOBAL SCOPE (required for type="module")
// ===================================================================
window.openAdminLogin = openAdminLogin;
window.closeAdminLogin = closeAdminLogin;
window.verifyAdmin = verifyAdmin;
window.adminLogout = adminLogout;
window.openAdminPanel = openAdminPanel;
window.closeAdmin = closeAdmin;
window.switchTab = switchTab;
window.saveSettings = saveSettings;
window.addNotice = addNotice;
window.deleteNotice = deleteNotice;
window.loadSubjectFields = loadSubjectFields;
window.saveResult = saveResult;
window.deleteResult = deleteResult;
window.renderAdminResults = renderAdminResults;
window.searchResult = searchResult;
window.displayResultFromData = displayResultFromData;
window.resetResultPanel = resetResultPanel;
window.addEvent = addEvent;
window.deleteEvent = deleteEvent;
window.openClassModal = openClassModal;
window.closeClassModal = closeClassModal;
window.filterGallery = filterGallery;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.nextImg = nextImg;
window.prevImg = prevImg;
window.handleContact = handleContact;
window.scrollTo = scrollTo;
