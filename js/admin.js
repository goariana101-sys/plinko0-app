/* ===================================================
   ROBO ARENA ADMIN PANEL — STABLE VERSION
=================================================== */

/* -------------------------
   FIREBASE REFERENCES
------------------------- */
let db;

/* Wait for Firebase */
document.addEventListener("DOMContentLoaded", () => {
    if (!firebase.apps.length) {
        alert("Firebase not loaded");
        return;
    }

    db = firebase.firestore();

    firebase.auth().onAuthStateChanged(user => {
        if (user && sessionStorage.getItem("adminLoggedIn") === "true") {
            showDashboard();
            loadAllUsers();
        }
    });
});

/* -------------------------
   ADMIN CONFIG
------------------------- */
async function adminLogin() {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();
    const passkey = document.getElementById("adminPasskey").value.trim();

    if (passkey !== "robo281990") {
        alert("Wrong admin passkey");
        return;
    }

    try {
        const res = await firebase.auth().signInWithEmailAndPassword(email, password);
        console.log("Logged in:", res.user.email);

        sessionStorage.setItem("adminLoggedIn", "true");
        showDashboard();
        loadAllUsers();

    } catch (err) {
        console.error("LOGIN ERROR:", err.code, err.message);
        alert(err.message);
    }
}

/* -------------------------
   UI HELPERS
------------------------- */
function showDashboard() {
    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
}

function logoutAdmin() {
    firebase.auth().signOut();
    sessionStorage.removeItem("adminLoggedIn");
    location.reload();
}

/* -------------------------
   LOAD USERS
------------------------- */
async function loadAllUsers() {
    const tbody = document.getElementById("userListBody");
    tbody.innerHTML = "<tr><td colspan='4'>Loading…</td></tr>";

    try {
        const snap = await db.collection("users").get();
        tbody.innerHTML = "";

        snap.forEach(doc => {
            const u = doc.data();

            tbody.innerHTML += `
                <tr>
                    <td>${u.fullName || "Unknown"}</td>
                    <td>$${(u.balance || 0).toFixed(2)}</td>
                    <td>${u.hasWonJackpot ? "🏆 Won" : "—"}</td>
                    <td>
                        <button onclick="creditUser('${doc.id}')">Add</button>
                        <button onclick="resetJackpot('${doc.id}')">Reset JP</button>
                        <button onclick="deleteUser('${doc.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = "<tr><td colspan='4'>❌ Database error</td></tr>";
    }
}

/* -------------------------
   CREDIT USER (MANUAL)
------------------------- */
async function creditUser(uid) {
    const amount = prompt("Enter amount:");
    if (!amount || isNaN(amount)) return;

    await db.collection("users").doc(uid).update({
        balance: firebase.firestore.FieldValue.increment(Number(amount))
    });

    logAdminAction(`Credited $${amount} to ${uid}`);
    loadAllUsers();
}

/* -------------------------
   JACKPOT RESET
------------------------- */
async function resetJackpot(uid) {
    if (!confirm("Reset jackpot?")) return;

    await db.collection("users").doc(uid).update({
        hasWonJackpot: false,
        jackpotApproved: false
    });

    logAdminAction(`Jackpot reset for ${uid}`);
    loadAllUsers();
}

/* -------------------------
   DELETE USER
------------------------- */
async function deleteUser(uid) {
    if (!confirm("Delete user?")) return;

    await db.collection("users").doc(uid).delete();
    logAdminAction(`Deleted user ${uid}`);
    loadAllUsers();
}

/* -------------------------
   ADMIN LOGS
------------------------- */
async function logAdminAction(action) {
    await db.collection("adminLogs").add({
        action,
        time: firebase.firestore.FieldValue.serverTimestamp(),
        agent: navigator.userAgent
    });
}
