const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 11;
const MULTIPLIERS = [125, 14, 5, 1.3, 0.4, 0.2, 0.2, 0.4, 1.3, 5, 14, 125];
let userBalance = 20.00; 
let currentBet = 5; 
let hasWonJackpot = false;
let globalVolume = 0.5;
let userName = "User";

canvas.width = 600;
canvas.height = 650;

// Local Sound Setup
function playSound(key) {
    const audio = new Audio(`sounds/${key}.mp3`);
    audio.volume = globalVolume;
    audio.play().catch(() => {});
}

// Separate the drawing of the background and pegs
function drawBoardBackground() {
    ctx.fillStyle = "#050a0f"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const spacingX = 48; 
    const spacingY = 42; 
    const startY = 60;

    for (let r = 0; r < ROWS; r++) {
        let dotsInRow = r + 3;
        let startX = (canvas.width / 2) - (dotsInRow - 1) * (spacingX / 2);
        for (let d = 0; d < dotsInRow; d++) {
            ctx.beginPath();
            ctx.arc(startX + (d * spacingX), startY + (r * spacingY), 4, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 10; 
            ctx.shadowColor = "#00f2ff";
            ctx.fill();
        }
    }
}

// Draw the ball separately
function drawBall(x, y) {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff9d00";
    const grad = ctx.createRadialGradient(x-3, y-3, 2, x, y, 12);
    grad.addColorStop(0, "#ffcc00");
    grad.addColorStop(1, "#ff6a00");
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
}

// Initial draw
drawBoardBackground();

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                userName = doc.data().fullName || "User";
                userBalance = doc.data().balance || 20.00;
                hasWonJackpot = doc.data().hasWonJackpot || false;
                updateUI();
                if (userBalance >= 1200 && !doc.data().withdrawalSubmitted) {
                    showJackpotGateway();
                }
            }
        });
    }
});

function animateBall() {
    let x = canvas.width / 2;
    let y = 30;
    let vy = 0; 
    let vx = 0; 
    const gravity = 0.18; 
    const friction = 0.98;
    const bounceForce = 2.5;

    const anim = setInterval(() => {
        vy += gravity; vy *= friction; vx *= friction;
        y += vy; x += vx;

        // Boundaries
        if (x < 30) { x = 30; vx *= -0.6; }
        if (x > canvas.width - 30) { x = canvas.width - 30; vx *= -0.6; }

        // Peg Collision
        const spacingX = 48; const spacingY = 42; const startY = 60;
        for (let r = 0; r < ROWS; r++) {
            let dotsInRow = r + 3;
            let rowStartX = (canvas.width / 2) - (dotsInRow - 1) * (spacingX / 2);
            let rowY = startY + (r * spacingY);
            if (Math.abs(y - rowY) < 8) {
                for (let d = 0; d < dotsInRow; d++) {
                    let dotX = rowStartX + (d * spacingX);
                    let dist = Math.sqrt((x - dotX)**2 + (y - rowY)**2);
                    if (dist < 10) { 
                        vy = -vy * 0.4; 
                        vx = (x < dotX ? -1 : 1) * bounceForce + (Math.random() - 0.5);
                        playSound('bounce');
                    }
                }
            }
        }

        // REDRAW EVERYTHING EVERY FRAME
        drawBoardBackground(); // This clears and draws pegs
        drawBall(x, y);       // This draws the ball on top

        if (y > canvas.height - 35) {
            clearInterval(anim);
            const segmentWidth = canvas.width / MULTIPLIERS.length;
            const finalIndex = Math.floor(x / segmentWidth);
            const winAmount = currentBet * MULTIPLIERS[finalIndex];
            userBalance += winAmount;
            updateUI();
            
            if (userBalance >= 1200 && !hasWonJackpot) {
                triggerJackpot();
            } else {
                db.collection('users').doc(firebase.auth().currentUser.uid).update({ balance: userBalance });
            }
            drawBoardBackground();
        }
    }, 20);
}

function dropDisk() {
    if (userBalance < currentBet) return showPopup("Insufficient balance.");
    if (document.getElementById('withdraw-gateway').style.display === 'flex') return;
    userBalance -= currentBet;
    updateUI();
    animateBall();
}

function triggerJackpot() {
    hasWonJackpot = true;
    userBalance += 10000;
    updateUI();
    playSound('jackpot');
    document.getElementById('cert-user').innerText = userName.toUpperCase();
    document.getElementById('cert-overlay').style.display = 'flex';
    db.collection('users').doc(firebase.auth().currentUser.uid).update({ balance: userBalance, hasWonJackpot: true });
}

/* --- UI HELPERS --- */
function updateUI() { 
    document.getElementById('balanceDisplay').innerText = userBalance.toFixed(2); 
    document.getElementById('btnSubtext').innerText = `bet amount $${currentBet.toFixed(2)}`;
}
function adjustBet(n) { 
    currentBet = Math.max(5, currentBet + n); 
    document.getElementById('currentBetDisplay').innerText = `$${currentBet}`; 
    updateUI();
}
function showPopup(m) { document.getElementById('popup-message').innerText = m; document.getElementById('custom-popup').style.display = 'flex'; }
function closePopup() { document.getElementById('custom-popup').style.display = 'none'; }
function closeJackpot() { document.getElementById('cert-overlay').style.display = 'none'; showJackpotGateway(); }
function setVolume(v) { globalVolume = v; document.getElementById('volValue').innerText = Math.round(v*100)+'%'; }

// Gateway logic (ensure these are in your HTML)
function showJackpotGateway() {
    document.getElementById('gateBalance').innerText = userBalance.toFixed(2);
    document.getElementById('withdraw-gateway').style.display = 'flex';
}

function selectMethod(method) {
    document.getElementById('method-fields').style.display = 'block';
    document.getElementById('paymentDetails').placeholder = method === 'Bitcoin' ? "BTC Wallet..." : "Bank Details...";
}
