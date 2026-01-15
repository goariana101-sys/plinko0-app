const auth = firebase.auth();
const db = firebase.firestore();

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
    const referral = document.getElementById('regRef').value;

    if (!email || !pass) return alert("Please fill the required fields.");
    if (pass !== confirm) return alert("Passwords do not match!");

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
        const user = userCredential.user;

        // $20 (base) + $100 if referral exists
        let initialBalance = (referral && referral.trim() !== "") ? 120.00 : 20.00;

        await db.collection("users").doc(user.uid).set({
            fullName: document.getElementById('regFullName').value,
            userName: document.getElementById('regUser').value,
            age: document.getElementById('regAge').value,
            gender: document.getElementById('regGender').value,
            address: document.getElementById('regAddress').value,
            phone: document.getElementById('regPhone').value,
            email: email,
            referral: referral,
            balance: initialBalance,
            hasWonJackpot: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        window.location.href = "games.html"; 
    } catch (error) {
        alert(error.message);
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        window.location.href = "games.html"; 
    } catch (error) {
        alert("Login failed: " + error.message);
    }
}
