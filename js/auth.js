/* =================================
   ROBO ARENA – AUTH ENGINE
   Firebase v8 Compatible
   Full registration, login, referral, anti-abuse
================================= */
// Optional: prevent back button after logout
window.history.pushState(null, "", window.location.href);
window.onpopstate = function () {
    window.history.pushState(null, "", window.location.href);
    if (!sessionStorage.getItem("userLoggedIn")) {
        window.location.href = "index.html";
    }
};

const auth = firebase.auth();
const db = firebase.firestore();

/* ===============================
   UI HELPERS
================================ */

function showSpinner() {
    document.getElementById("authSpinner").style.display = "flex";
}

function hideSpinner() {
    document.getElementById("authSpinner").style.display = "none";
}

/* ===============================
   REGISTER
================================ */

async function handleRegister() {
    showSpinner();

    const fullName = regFullName.value.trim();
    const username = regUser.value.trim();
    const age = regAge.value;
    const gender = regGender.value;
    const country = regCountry.value;
    const address = regAddress.value.trim();
    const phone = regPhone.value.trim();
    const email = regEmail.value.trim();
    const password = regPass.value;
    const confirm = regPassConfirm.value;
    const referralCode = regRef.value.trim();

    // Validation
    if (!fullName || !email || !password || !country) {
        hideSpinner();
        alert("Please fill all required fields.");
        return;
    }

    if (password !== confirm) {
        hideSpinner();
        alert("Passwords do not match.");
        return;
    }

    // Allowed countries
    const allowedCountries = [
        "USA", "Canada", "United Kingdom", "Germany", "France", "Italy", "Spain",
        "Netherlands", "Belgium", "Austria", "Switzerland", "Sweden", "Norway",
        "Denmark", "Finland", "Ireland", "Poland", "Czech Republic", "Portugal",
        "Greece", "Romania", "Hungary", "Slovakia", "Slovenia", "Croatia",
        "Bulgaria", "Lithuania", "Latvia", "Estonia", "Luxembourg", "Iceland",
        "Malta", "Cyprus"
    ];

    if (!allowedCountries.includes(country)) {
        hideSpinner();
        alert("Registration is not allowed from your country.");
        return;
    }

    // Anti-abuse: get IP & device fingerprint
    const ipAddress = await getUserIP();
    const deviceFingerprint = getDeviceFingerprint();

    // ---------------------
    // MULTI-ACCOUNT / ANTI-ABUSE CHECK
    // ---------------------
    const existingUsersSnap = await db.collection("users")
        .where("ipAddress", "==", ipAddress)
        .get();

    if (!existingUsersSnap.empty) {
        hideSpinner();
        alert("Registration blocked: multiple accounts from same IP.");
        return;
    }

    const deviceSnap = await db.collection("users")
        .where("deviceFingerprint", "==", deviceFingerprint)
        .get();

    if (!deviceSnap.empty) {
        hideSpinner();
        alert("Registration blocked: multiple accounts from same device.");
        return;
    }

    try {
        // Create Firebase Auth account
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        const user = cred.user;

        // Send verification email
        await user.sendEmailVerification();

        // Save user to Firestore
        await db.collection("users").doc(user.uid).set({
            fullName,
            username,
            age,
            gender,
            country,
            address,
            phone,
            email,

            balance: 20,
            hasWonJackpot: false,
            jackpotApproved: false,
            jackpotClaimed: false,

            referralCodeUsed: referralCode || null,
            referrals: [],
            referralEarnings: 0,

            ipAddress,
            deviceFingerprint,
            isFlagged: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Apply referral bonus
        if (referralCode) {
            await applyReferralBonus(user.uid, referralCode);
        }

        alert(
            "Account created successfully!\n\n" +
            "A verification email has been sent.\n" +
            "Please verify your email before logging in."
        );

        await auth.signOut();
        closeModal("regModal");

    } catch (err) {
        hideSpinner();
        alert(err.message);
    }

    hideSpinner();
}

/* ===============================
   LOGIN
================================ */

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

        if (!cred.user.emailVerified) {
            hideSpinner();
            alert("Email not verified. Please check your inbox.");
            await auth.signOut();
            return;
        }

        // Redirect to game
        window.location.href = "plinko.html";

    } catch (err) {
        hideSpinner();
        alert(err.message);
    }

    hideSpinner();
}

/* ===============================
   RESET PASSWORD
================================ */

async function resetPassword() {
    const email = loginEmail.value.trim();
    if (!email) {
        alert("Please enter your email first.");
        return;
    }

    try {
        await auth.sendPasswordResetEmail(email);
        alert("Password reset email sent.");
    } catch (err) {
        alert(err.message);
    }
}

/* ===============================
   RESEND VERIFICATION EMAIL
================================ */

async function resendVerification() {
    const user = auth.currentUser;

    if (!user) {
        alert("Please log in first.");
        return;
    }

    if (user.emailVerified) {
        alert("Your email is already verified.");
        return;
    }

    try {
        await user.sendEmailVerification();
        alert("Verification email resent.");
    } catch (err) {
        alert(err.message);
    }
}

/* ===============================
   REFERRAL BONUS
================================ */

async function applyReferralBonus(newUserId, referralUsername) {
    const snap = await db
        .collection("users")
        .where("username", "==", referralUsername)
        .limit(1)
        .get();

    if (snap.empty) return;

    const refDoc = snap.docs[0];

    await db.collection("users").doc(refDoc.id).update({
        balance: firebase.firestore.FieldValue.increment(5),
        referralEarnings: firebase.firestore.FieldValue.increment(5),
        referrals: firebase.firestore.FieldValue.arrayUnion({
            user: newUserId,
            amount: 5,
            date: Date.now()
        })
    });
}

/* ===============================
   ANTI-ABUSE HELPERS
================================ */

async function getUserIP() {
    try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return data.ip;
    } catch {
        return "unknown";
    }
}

function getDeviceFingerprint() {
    return btoa(
        navigator.userAgent +
        screen.width +
        screen.height +
        Intl.DateTimeFormat().resolvedOptions().timeZone
    );
}