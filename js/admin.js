/* ===================================================
   ROBO ARENA ADMIN PANEL — STABLE VERSION
=================================================== */

console.log("ADMIN.JS LOADED");

let db;

/* -------------------------
   INIT FIREBASE
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    if (!firebase.apps.length) {
        alert("Firebase not initialized");
        return;
    }

    db = firebase.firestore();
    checkAdminSession();
});

/* -------------------------
   ADMIN LOGIN (EMAIL/PASS)
------------------------- */
async function adminLogin() {
    const passkey = document.getElementById("adminPasskey").value.trim();

    if (passkey !== "robo281990") {
        alert("❌ Invalid passkey");
        return;
    }

    try {
        await firebase.auth().signInWithEmailAndPassword(
            "admin@roboarena.com",
            "robo281990"
        );

        sessionStorage.setItem("adminLoggedIn", "true");

        document.getElementById("adminLogin").style.display = "none";
        document.getElementById("dashboard").style.display = "block";

        loadAllUsers();
        logAdminAction("Admin logged in");

    } catch (err) {
        console.error(err);
        alert("❌ Admin login failed (check console)");
    }
}

/* -------------------------
   SESSION RESTORE
------------------------- */
function checkAdminSession() {
    if (sessionStorage.getItem("adminLoggedIn") === "true") {
        document.getElementById("adminLogin").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
        loadAllUsers();
    }
}

/* -------------------------
   LOAD USERS
------------------------- */
async function loadAllUsers() {
    const body = document.getElementById("userListBody");
    body.innerHTML = "<tr><td colspan='4'>Loading…</td></tr>";

    try {
        const snap = await db.collection("users").get();
        body.innerHTML = "";

        snap.forEach(doc => {
            const u = doc.data();
            body.innerHTML += `
                <tr>
                    <td>${u.fullName || "Unknown"}</td>
                    <td>$${(u.balance || 0).toFixed(2)}</td>
                    <td>${u.hasWonJackpot ? "🏆 Won" : "—"}</td>
                    <td>
                        <button onclick="creditUser('${doc.id}')">Add Funds</button>
                        <button onclick="resetJackpot('${doc.id}')">Reset JP</button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error(e);
        body.innerHTML = "<tr><td colspan='4'>❌ Database error</td></tr>";
    }
}

/* -------------------------
   CREDIT USER
------------------------- */
async function creditUser(userId) {
    const amount = Number(prompt("Enter amount:"));
    if (!amount) return;

    await db.collection("users").doc(userId).update({
        balance: firebase.firestore.FieldValue.increment(amount)
    });

    logAdminAction(`Credited $${amount} to ${userId}`);
    loadAllUsers();
}

/* -------------------------
   RESET JACKPOT
------------------------- */
async function resetJackpot(userId) {
    await db.collection("users").doc(userId).update({
        hasWonJackpot: false
    });

    logAdminAction(`Reset jackpot for ${userId}`);
    loadAllUsers();
}

/* -------------------------
   ADMIN LOGS
------------------------- */
function logAdminAction(action) {
    db.collection("adminLogs").add({
        action,
        time: firebase.firestore.FieldValue.serverTimestamp(),
        device: navigator.userAgent
    });
}
