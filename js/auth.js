/* =================================
   ROBO ARENA – AUTH ENGINE
   Firebase v8 Compatible
   Firestore ONLY
================================= */

/* ===============================
   UI HELPERS
================================ */
function showSpinner() {
    document.getElementById("authSpinner")?.style &&
    (document.getElementById("authSpinner").style.display = "flex");
}

function hideSpinner() {
    document.getElementById("authSpinner")?.style &&
    (document.getElementById("authSpinner").style.display = "none");
}

/* ===============================
   REGISTER
================================ */
async function handleRegister() {
    showSpinner();

    const fullName = regFullName.value.trim();
    const username = regUser.value.trim();
    const email = regEmail.value.trim();
    const password = regPass.value;
    const confirm = regPassConfirm.value;
    const country = regCountry?.value || "";

    if (!fullName || !email || !password) {
        hideSpinner();
        alert("Please fill all required fields.");
        return;
    }

    if (password !== confirm) {
        hideSpinner();
        alert("Passwords do not match.");
        return;
    }

    try {
        // 1️⃣ Create account
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const user = cred.user;

        // 2️⃣ Send verification email (THIS IS WHAT YOU WANT)
        await user.sendEmailVerification();

        // 3️⃣ Save user to Firestore
        await db.collection("users").doc(user.uid).set({
            fullName,
            username,
            email,
            country,
            balance: 20,
            hasWonJackpot: false,
            jackpotApproved: false,
            jackpotClaimed: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(
            "Registration successful!\n\n" +
            "A verification link has been sent to your email.\n" +
            "Please check your inbox or spam box.from example:robo-123fb Team"
        );

        closeModal("regModal");

    } catch (err) {
        alert(err.message);
        console.error(err);
    }

    hideSpinner();
}

/* ===============================
   LOGIN (EMAIL VERIFICATION SAFE)
================================ */
async function handleLogin() {
    alert("LOGIN FUNCTION CALLED"); // 👈 TEMP TEST
    showSpinner();

async function handleLogin() {
    showSpinner();

    const email = loginEmail.value.trim();
    const password = loginPass.value;

    if (!email || !password) {
        hideSpinner();
        alert("Enter email and password.");
        return;
    }

    try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const user = cred.user;

        // 🔒 BLOCK UNVERIFIED EMAILS
        if (!user.emailVerified) {
            hideSpinner();
            alert("❌ Please verify your email before logging in.");

            await auth.signOut();
            return;
        }

        // ✅ VERIFIED USER
        sessionStorage.setItem("userLoggedIn", "true");
        sessionStorage.setItem("userId", user.uid);

        hideSpinner();
        window.location.href = "games.html";

    } catch (err) {
        hideSpinner();
        alert(err.message);
    }
}

    hideSpinner();
}

/* ===============================
   RESET PASSWORD
================================ */
async function resetPassword() {
    const email = loginEmail.value.trim();
    if (!email) {
        alert("Enter your email first.");
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        alert("Password reset email sent.");
    } catch (err) {
        alert(err.message);
    }
}
