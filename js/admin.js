/* ===================================================
   ROBO ARENA ADMIN PANEL — FULL WORKING VERSION
=================================================== */

/* -------------------------
   INITIAL FIRESTORE SETUP
------------------------- */
let db = null;
document.addEventListener("DOMContentLoaded", () => {
    if (!firebase.apps.length) {
        console.error("Firebase not initialized");
        return;
    }
    db = firebase.firestore();
});

/* -------------------------
   ADMIN PASSKEY LOGIN
------------------------- */
const ADMIN_PASSKEY = "robo281990";

function adminLogin() {
    const key = document.getElementById("adminPasskey").value.trim();

    if (key !== ADMIN_PASSKEY) {
        alert("❌ Invalid admin passkey");
        return;
    }

    sessionStorage.setItem("adminLoggedIn", "true");
    document.getElementById("adminLogin").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    logAdminAction("Admin logged in");
}

/* Restore session */
function checkAdminSession() {
    if (sessionStorage.getItem("adminLoggedIn") === "true") {
        document.getElementById("adminLogin").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
    }
}

window.onload = checkAdminSession;

/* -------------------------
   LOAD USERS
------------------------- */
async function loadAllUsers() {
    if (!db) return;

    const body = document.getElementById("userListBody");
    body.innerHTML = "<tr><td colspan='4'>Loading users…</td></tr>";

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
                        <button onclick="creditUserBalance('${doc.id}')">Add Funds</button>
                        <button onclick="resetJackpot('${doc.id}')">Reset JP</button>
                        <button onclick="deleteUser('${doc.id}')">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error(err);
        body.innerHTML = "<tr><td colspan='4'>❌ Database error</td></tr>";
    }
}

/* -------------------------
   MANUAL CREDIT FUNCTION
------------------------- */
async function creditUserBalance(userId) {
    const amount = prompt("Enter amount to add to user's balance:");

    if (!amount || isNaN(amount)) return;

    await db.collection("users").doc(userId).update({
        balance: firebase.firestore.FieldValue.increment(Number(amount))
    });

    alert(`✅ Added $${amount} to user balance`);
    logAdminAction(`Manual credit: $${amount} to ${userId}`);
    loadAllUsers();
}

/* -------------------------
   JACKPOT FUNCTIONS
------------------------- */
async function resetJackpot(userId) {
    if (!confirm("Reset jackpot eligibility?")) return;

    await db.collection("users").doc(userId).update({
        hasWonJackpot: false,
        jackpotApproved: false
    });

    logAdminAction(`Jackpot reset for ${userId}`);
    loadAllUsers();
}

/* -------------------------
   DELETE USER
------------------------- */
async function deleteUser(userId) {
    if (!confirm("Delete user permanently?")) return;

    await db.collection("users").doc(userId).delete();
    logAdminAction(`User deleted: ${userId}`);
    loadAllUsers();
}

/* -------------------------
   ADMIN SUPPORT / CHAT
------------------------- */
async function openSupportChats() {
    const snap = await db.collection("supportChats").orderBy("lastMessage", "desc").get();
    let html = "<h3>Support Chats</h3><hr>";

    snap.forEach(doc => {
        const c = doc.data();
        html += `
            <p>
                <b>${c.userEmail || "Guest"}</b><br>
                ${c.lastText || "No message"}<br>
                <small>${new Date(c.lastMessage).toLocaleString()}</small>
                <br>
                <button onclick="openChatRoom('${doc.id}')">Open Chat</button>
            </p><hr>
        `;
    });

    showModal(html);
}

/* -------------------------
   MODAL HELPERS
------------------------- */
function showModal(html) {
    document.getElementById("modalContent").innerHTML = html;
    document.getElementById("adminModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("adminModal").style.display = "none";
}

/* -------------------------
   SECURITY LOGS
------------------------- */
async function logAdminAction(action) {
    if (!db) return;

    await db.collection("adminLogs").add({
        action,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        device: navigator.userAgent
    });
}

/* -------------------------
   END OF FILE — FULL ADMIN PANEL
------------------------- */