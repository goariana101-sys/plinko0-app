/* =====================================================
    PLINKO FULL ENGINE — REFERRALS, EFFECTS, JACKPOT
===================================================== */

const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 11;
const MULTIPLIERS = [125, 14, 5, 1.3, 0.4, 0.2, 0.2, 0.4, 1.3, 5, 14, 125];

let userBalance = 20.00;
let currentBet = 5;
let hasWonJackpot = false;
let globalVolume = 0.5;
let userName = "User";
let currentUserId = null;

canvas.width = 600;
canvas.height = 650;

window.onload = () => drawBoardBackground();

/* =====================================================
    SOUND ENGINE
===================================================== */
function playSound(key) {
    const audio = new Audio(`sounds/${key}.mp3`);
    audio.volume = globalVolume;
    audio.play().catch(() => {});
}

/* =====================================================
    REFERRAL POPUP
===================================================== */
function showReferralPopup() {
    showPopup("You earned $100 referral bonus!");
}

/* =====================================================
    HANDLE REFERRAL BONUS
===================================================== */
async function handleReferralBonus(userDoc) {
    const data = userDoc.data();
    const referrerId = data.referral;

    if (!referrerId || referrerId === "none") return;
    if (data.referralBonusPaid) return;

    try {
        const refRef = db.collection("users").doc(referrerId);
        const refSnap = await refRef.get();

        if (refSnap.exists) {
            const newBalance = (refSnap.data().balance || 0) + 100;

            await refRef.update({ balance: newBalance });

            await refRef.collection("referralHistory").add({
                newUser: currentUserId,
                amount: 100,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            const newCount = (refSnap.data().referralCount || 0) + 1;
            await refRef.update({ referralCount: newCount });

            await db.collection("users").doc(currentUserId).update({
                referralBonusPaid: true
            });

            showReferralPopup();
        }
    } catch (err) {
        console.error("Referral bonus error:", err);
    }
}

/* =====================================================
    REFERRAL LINK
===================================================== */
function setReferralLink() {
    if (!currentUserId) return;
    const field = document.getElementById("referralLink");
    const domain = window.location.origin;
    field.value = `${domain}/index.html?ref=${currentUserId}`;
}
function copyReferral() {
    const field = document.getElementById("referralLink");
    field.select();
    navigator.clipboard.writeText(field.value);
}

/* =====================================================
    REFERRAL HISTORY
===================================================== */
async function loadReferralHistory() {
    const list = document.getElementById("refHistoryList");
    list.innerHTML = "Loading...";

    const snap = await db.collection("users")
        .doc(currentUserId)
        .collection("referralHistory")
        .orderBy("timestamp", "desc")
        .get();

    list.innerHTML = "";

    if (snap.empty) {
        list.innerHTML = "<p>No referral bonuses yet.</p>";
        return;
    }

    snap.forEach(doc => {
        const h = doc.data();
        const date = h.timestamp ? h.timestamp.toDate().toLocaleString() : "Unknown";

        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `<strong>+ $100</strong><br><small>${date}</small>`;
        list.appendChild(div);
    });
}

/* =====================================================
    LEADERBOARD
===================================================== */
async function loadLeaderboard() {
    const board = document.getElementById("leaderboardList");
    board.innerHTML = "Loading...";

    const snap = await db.collection("users")
        .orderBy("referralCount", "desc")
        .limit(10)
        .get();

    board.innerHTML = "";

    let rank = 1;
    snap.forEach(doc => {
        const u = doc.data();
        const item = document.createElement("div");
        item.className = "leaderboard-row";
        item.innerHTML = `
            <strong>#${rank}</strong> — ${u.fullName || "User"}<br>
            <small>${u.referralCount || 0} referrals</small>
        `;
        board.appendChild(item);
        rank++;
    });
}

/* =====================================================
    DRAW BOARD + LASER LIGHTS
===================================================== */
let laserOffset = 0;

function drawLaserLights() {
    laserOffset += 2;

    const gradient = ctx.createLinearGradient(0, laserOffset, 0, laserOffset + 150);
    gradient.addColorStop(0, "rgba(0,255,255,0)");
    gradient.addColorStop(0.5, "rgba(0,255,255,0.5)");
    gradient.addColorStop(1, "rgba(0,255,255,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 15, canvas.height);
    ctx.fillRect(canvas.width - 15, 0, 15, canvas.height);
}

function drawBoardBackground() {
    ctx.fillStyle = "#050a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawLaserLights();

    const spacingX = 48;
    const spacingY = 42;
    const startY = 60;

    for (let r = 0; r < ROWS; r++) {
        let dots = r + 3;
        let startX = (canvas.width / 2) - (dots - 1) * (spacingX / 2);

        for (let d = 0; d < dots; d++) {
            ctx.beginPath();
            ctx.arc(startX + (d * spacingX), startY + (r * spacingY), 4, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#00f2ff";
            ctx.fill();
        }
    }
}

/* =====================================================
    BALL + WOBBLE
===================================================== */
let ballWobble = 0;

function drawBall(x, y) {
    ballWobble += 0.3;
    const wobbleOffset = Math.sin(ballWobble) * 2;

    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff9d00";

    const grad = ctx.createRadialGradient(x + wobbleOffset, y, 2, x, y, 12);
    grad.addColorStop(0, "#ffcc00");
    grad.addColorStop(1, "#ff6a00");

    ctx.beginPath();
    ctx.arc(x + wobbleOffset, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
}

/* =====================================================
    NEON TRAIL
===================================================== */
let trails = [];
function drawTrails() {
    for (let t of trails) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,0,${t.alpha})`;
        ctx.fill();
        t.alpha -= 0.03;
    }
    trails = trails.filter(t => t.alpha > 0);
}

/* =====================================================
    CONFETTI
===================================================== */
let confetti = [];
function spawnConfetti() {
    for (let i = 0; i < 50; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: -10,
            speed: 2 + Math.random() * 3,
            size: 5 + Math.random() * 4,
            alpha: 1
        });
    }
}
function updateConfetti() {
    for (let c of confetti) {
        c.y += c.speed;
        c.alpha -= 0.005;
        ctx.fillStyle = `rgba(255,255,100,${c.alpha})`;
        ctx.fillRect(c.x, c.y, c.size, c.size);
    }
    confetti = confetti.filter(c => c.alpha > 0);
}

/* =====================================================
    SHOCKWAVE (JACKPOT)
===================================================== */
let shockwave = null;
function spawnShockwave(x, y) {
    shockwave = { x, y, radius: 10, alpha: 1 };
}
function drawShockwave() {
    if (!shockwave) return;
    ctx.beginPath();
    ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
    ctx.lineWidth = 5;
    ctx.strokeStyle = `rgba(255,255,255,${shockwave.alpha})`;
    ctx.stroke();
    shockwave.radius += 5;
    shockwave.alpha -= 0.04;
    if (shockwave.alpha <= 0) shockwave = null;
}

/* =====================================================
    WINNING SLOT GLOW
===================================================== */
let glowIndex = null;
let glowAlpha = 1;
let glowFade = -0.05;

function drawSlotGlow() {
    if (glowIndex === null) return;

    const slotWidth = canvas.width / MULTIPLIERS.length;
    const x = glowIndex * slotWidth;

    glowAlpha += glowFade;
    if (glowAlpha <= 0.2 || glowAlpha >= 1) glowFade *= -1;

    ctx.fillStyle = `rgba(255,200,0,${glowAlpha})`;
    ctx.fillRect(x, canvas.height - 30, slotWidth, 30);
}

/* =====================================================
    USER LOGIN + REFERRAL CHECK
===================================================== */
firebase.auth().onAuthStateChanged(async user => {
    if (user) {
        currentUserId = user.uid;
        setReferralLink();

        const doc = await db.collection("users").doc(user.uid).get();

        if (doc.exists) {
            userBalance = doc.data().balance || 20;
            userName = doc.data().fullName || "User";
            hasWonJackpot = doc.data().hasWonJackpot || false;

            updateUI();
            loadReferralHistory();
            loadLeaderboard();
            handleReferralBonus(doc);
        }
    }
});

/* =====================================================
    UI
===================================================== */
function updateUI() {
    document.getElementById("balanceDisplay").innerText = userBalance.toFixed(2);
    document.getElementById("btnSubtext").innerText = `Bet amount $${currentBet.toFixed(2)}`;
}

function adjustBet(n) {
    currentBet = Math.max(5, currentBet + n);
    document.getElementById("currentBetDisplay").innerText = `$${currentBet}`;
    updateUI();
}

function showPopup(msg) {
    document.getElementById("popup-message").innerText = msg;
    document.getElementById("custom-popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("custom-popup").style.display = "none";
}

/* =====================================================
    MAIN GAME ENGINE
===================================================== */
function animateBall() {
    let x = canvas.width / 2;
    let y = 30;
    let vx = 0, vy = 0;

    const gravity = 0.18;
    const friction = 0.98;
    const bounceForce = 2.5;

    const anim = setInterval(() => {

        vy += gravity;
        vx *= friction;
        vy *= friction;

        x += vx;
        y += vy;

        if (x < 30) { x = 30; vx *= -0.6; }
        if (x > canvas.width - 30) { x = canvas.width - 30; vx *= -0.6; }

        const spacingX = 48;
        const spacingY = 42;
        const startY = 60;

        for (let r = 0; r < ROWS; r++) {
            const dots = r + 3;
            const rowX = (canvas.width / 2) - (dots - 1) * (spacingX / 2);
            const rowY = startY + (r * spacingY);

            if (Math.abs(y - rowY) < 8) {
                for (let d = 0; d < dots; d++) {
                    const dotX = rowX + d * spacingX;
                    const dist = Math.sqrt((x - dotX) ** 2 + (y - rowY) ** 2);
                    if (dist < 10) {
                        vy = -vy * 0.4;
                        vx = (x < dotX ? -1 : 1) * bounceForce + (Math.random() - 0.5);
                        playSound("bounce");
                    }
                }
            }
        }

        trails.push({
            x, y, size: 4 + Math.random() * 3, alpha: 0.6
        });

        drawBoardBackground();
        drawTrails();
        drawBall(x, y);
        updateConfetti();
        drawShockwave();
        drawSlotGlow();

        if (y > canvas.height - 35) {
            clearInterval(anim);

            const index = Math.floor(x / (canvas.width / MULTIPLIERS.length));
            glowIndex = index;

            const win = currentBet * MULTIPLIERS[index];
            userBalance += win;
            updateUI();

            if (MULTIPLIERS[index] >= 5) spawnConfetti();
            if (MULTIPLIERS[index] === 125) {
                spawnShockwave(x, canvas.height - 40);
                playSound("jackpot");
            }

            db.collection("users").doc(currentUserId).update({ balance: userBalance });
        }

    }, 20);
}

function dropDisk() {
    if (userBalance < currentBet) return showPopup("Insufficient balance.");
    glowIndex = null;
    userBalance -= currentBet;
    updateUI();
    animateBall();
}

/* =====================================================
    VOLUME MEMORY
===================================================== */
function loadVolume() {
    const saved = localStorage.getItem("plinkoVolume");
    if (saved !== null) {
        globalVolume = Number(saved);
        document.getElementById("volValue").innerText = Math.round(globalVolume * 100) + "%";
    }
}
loadVolume();

function setVolume(v) {
    globalVolume = v;
    localStorage.setItem("plinkoVolume", v);
    document.getElementById("volValue").innerText = Math.round(v * 100) + "%";
}
