/* Page Title: Authentication & Lockdown */

// THE LOCKDOWN: Protect the games.html and plinko.html pages
auth.onAuthStateChanged((user) => {
    const path = window.location.pathname;
    const isInsideGame = path.includes("games.html") || path.includes("plinko.html");
    
    if (!user && isInsideGame) {
        window.location.href = "index.html";
    }
});

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// FULL REGISTRATION LOGIC
async function handleRegister() {
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    const confirm = document.getElementById('regPassConfirm').value;
    const referral = document.getElementById('regRef').value; // This is the Referrer's ID
    const fullName = document.getElementById('regFullName').value;

    if (!email || !pass || !fullName) return alert("Please fill the required fields.");
    if (pass !== confirm) return alert("Passwords do not match!");

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        const user = userCredential.user;

        // Give $120 if referral is present, otherwise $20
        let initialBalance = (referral && referral.trim() !== "" && referral !== "none") ? 120.00 : 20.00;

        await db.collection("users").doc(user.uid).set({
            fullName: fullName,
            userName: document.getElementById('regUser').value || "User",
            email: email,
            referral: referral || "none",
            balance: initialBalance,
            hasWonJackpot: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Notify Telegram with the Referrer's ID included
        await sendTelegramNotification("NEW_USER", { 
            name: fullName, 
            email: email, 
            balance: initialBalance, 
            referral: referral 
        });

        window.location.href = "games.html"; 
    } catch (error) {
        alert(error.message);
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if (!email || !pass) return alert("Enter email and password.");
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        window.location.href = "games.html"; 
    } catch (error) {
        alert("Login failed: " + error.message);
    }
}
