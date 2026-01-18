
/* =====================================================
    PLINKO FULL ENGINE — SEQUENTIAL DROP & FORCED JACKPOT
===================================================== */

const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 11;
const MULTIPLIERS = [125, 14, 5, 1.3, 0.4, 0.2, 0.2, 0.4, 1.3, 5, 14, 125];

let userBalance = 20.00;
let currentBet = 5;
let globalVolume = 0.5;
let userName = "USER";
let currentUserId = null;
let isBallInPlay = false; 

// Jackpot Logic State
let gameStartTime = Date.now();
let hasWonJackpot = false;
const JACKPOT_TIME_LIMIT = 210000; // 3 minutes 30 seconds

// Visual State
let trails = [];
let confetti = [];
let shockwave = null;
let glowIndex = null;
let glowAlpha = 1;
let glowFade = -0.05;
let ballWobble = 0;
let laserOffset = 0;

canvas.width = 600;
canvas.height = 650;

window.onload = () => {
    drawBoardBackground();
    loadVolume();
};

function triggerJackpot(amount) {
    hasWonJackpot = true;
    const certOverlay = document.getElementById('cert-overlay');
    const certUser = document.getElementById('cert-user');
    const jackpotDisplay = certOverlay.querySelector('h2');
    
    certUser.innerText = userName.toUpperCase();
    jackpotDisplay.innerText = `$${amount.toLocaleString()}.00!`;
    
    certOverlay.style.display = 'flex';
    playSound("jackpot");
    spawnConfetti();
}

function closeJackpot() {
    document.getElementById('cert-overlay').style.display = 'none';
    openWithdrawalGateway();
}

function openWithdrawalGateway() {
    const gateway = document.getElementById('withdraw-gateway');
    const gateBalance = document.getElementById('gateBalance');
    // Summing balance for display if they just won
    gateBalance.innerText = userBalance.toFixed(2);
    gateway.style.display = 'flex';
}

function selectMethod(method) {
    const buttons = document.querySelectorAll('.method-btn');
    buttons.forEach(btn => btn.classList.remove('active-method'));
    
    const target = method === 'Bank' ? buttons[0] : buttons[1];
    target.classList.add('active-method');
    
    document.getElementById('method-fields').style.display = 'block';
    document.getElementById('paymentDetails').placeholder = 
        method === 'Bank' ? "Enter Bank Details..." : "BTC Wallet...";
}

function submitFinalWithdrawal() {
    const details = document.getElementById('paymentDetails').value;
    if(!details) return alert("Please enter payment details.");
    alert("Withdrawal Request of $" + userBalance.toFixed(2) + " submitted successfully!");
    document.getElementById('withdraw-gateway').style.display = 'none';
}

function drawBoardBackground() {
    ctx.fillStyle = "#050a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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
            ctx.shadowBlur = 0;
        }
    }
}

function dropDisk() {
    if (isBallInPlay) return; 
    if (userBalance < currentBet) return showPopup("Insufficient balance.");
    
    isBallInPlay = true;
    glowIndex = null;
    userBalance -= currentBet;
    updateUI();
    animateBall();
}

function animateBall() {
    let x = canvas.width / 2 + (Math.random() * 4 - 2);
    let y = 30;
    let vx = (Math.random() - 0.5) * 2;
    let vy = 0;

    const gravity = 0.18;
    const friction = 0.98;
    const bounceForce = 2.5;

    // Check if we need to force a jackpot
    const timePlayed = Date.now() - gameStartTime;
    const forceJackpot = (timePlayed > JACKPOT_TIME_LIMIT && !hasWonJackpot);

    const anim = setInterval(() => {
        vy += gravity;
        vx *= friction;
        vy *= friction;

        // Forced X Steering for Jackpot (target 125x slots at the ends)
        if (forceJackpot && y > 100) {
            const targetX = Math.random() > 0.5 ? 40 : canvas.width - 40;
            vx += (targetX - x) * 0.005; 
        }

        x += vx;
        y += vy;

        if (x < 25) { x = 25; vx *= -0.6; }
        if (x > canvas.width - 25) { x = canvas.width - 25; vx *= -0.6; }

        const spacingX = 48;
        const spacingY = 42;
        const startY = 60;
        for (let r = 0; r < ROWS; r++) {
            const dots = r + 3;
            const rowX = (canvas.width / 2) - (dots - 1) * (spacingX / 2);
            const rowY = startY + (r * spacingY);
            if (Math.abs(y - rowY) < 12) {
                for (let d = 0; d < dots; d++) {
                    const dotX = rowX + d * spacingX;
                    const dx = x - dotX;
                    const dy = y - rowY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 11) {
                        const angle = Math.atan2(dy, dx);
                        x = dotX + Math.cos(angle) * 12;
                        y = rowY + Math.sin(angle) * 12;
                        vy *= -0.4;
                        vx = Math.cos(angle) * bounceForce + (Math.random() - 0.5);
                    }
                }
            }
        }

        drawBoardBackground();
        
        // Ball Drawing
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = "#ffcc00";
        ctx.fill();

        if (y > canvas.height - 35) {
            clearInterval(anim);
            isBallInPlay = false; 
            const index = Math.floor(x / (canvas.width / MULTIPLIERS.length));
            const multiplier = MULTIPLIERS[index];
            
            const win = currentBet * multiplier;
            userBalance += win;
            updateUI();

            if (multiplier === 125) {
                triggerJackpot(89000);
            } else if (userBalance >= 800 && !hasWonJackpot) {
                triggerJackpot(userBalance);
            }
        }
    }, 16);
}

function updateUI() {
    document.getElementById("balanceDisplay").innerText = userBalance.toFixed(2);
    document.getElementById("btnSubtext").innerText = `bet amount $${currentBet.toFixed(2)}`;
    document.getElementById("currentBetDisplay").innerText = `$${currentBet}`;
}

function adjustBet(n) {
    if (isBallInPlay) return;
    currentBet = Math.max(5, currentBet + n);
    updateUI();
}

function showPopup(msg) {
    document.getElementById("popup-message").innerText = msg;
    document.getElementById("custom-popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("custom-popup").style.display = "none";
}

function loadVolume() {
    const saved = localStorage.getItem("plinkoVolume");
    if (saved !== null) globalVolume = Number(saved);
}

function spawnConfetti() {
    // Simple placeholder for visual win feedback
}

function playSound(key) {}
