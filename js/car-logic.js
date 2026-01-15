const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 500;
canvas.height = 800;

// LOAD YOUR 3D ASSETS
const playerImg = new Image(); playerImg.src = 'img/player_car.png'; 
const enemyImg = new Image(); enemyImg.src = 'img/enemy_car.png';
const treeImg = new Image(); treeImg.src = 'img/tree_3d.png';
const signImg = new Image(); signImg.src = 'img/sign_robo.png';

let health = 100;
let score = 0;
let bullets = [];
let enemies = [];
let decoration = [];
let gameActive = true;

// LANE SETUP (Prevents cars from crossing lines)
const lanes = [100, 250, 400]; // Left, Middle, Right
let currentLane = 1; // Start in middle

// 1. INPUT: Movement & Shooting
window.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    if (e.key === "ArrowLeft" && currentLane > 0) currentLane--;
    if (e.key === "ArrowRight" && currentLane < 2) currentLane++;
    if (e.key === " " || e.key === "Control") shoot();
});

function shoot() {
    document.getElementById('shootSound').cloneNode(true).play();
    bullets.push({ x: lanes[currentLane], y: 650 });
}

// 2. THE GAME LOOP
function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Spawn Objects
    if (Math.random() < 0.02) spawnEnemy();
    if (Math.random() < 0.05) spawnDecoration();

    // Move Bullets
    bullets.forEach((b, i) => {
        b.y -= 15;
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Move Enemies & Check Collisions
    enemies.forEach((en, ei) => {
        en.y += en.speed;
        
        // Bullet Hit Enemy
        bullets.forEach((b, bi) => {
            if (Math.abs(b.x - en.x) < 40 && Math.abs(b.y - en.y) < 60) {
                en.life -= 25;
                bullets.splice(bi, 1);
                if (en.life <= 0) {
                    document.getElementById('explodeSound').play();
                    enemies.splice(ei, 1);
                    score += 100;
                }
            }
        });

        // Player Hit Enemy
        if (en.lane === currentLane && Math.abs(en.y - 700) < 80) {
            health -= 10;
            enemies.splice(ei, 1);
            if (health <= 0) endGame();
        }
    });

    // Move Trees/Signs
    decoration.forEach((d, i) => {
        d.y += 10;
        if (d.y > 900) decoration.splice(i, 1);
    });

    document.getElementById('health').innerText = health;
    document.getElementById('score').innerText = score;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // NIGHT ROAD DESIGN
    ctx.fillStyle = "#111"; // Asphalt
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Lane Lines
    ctx.strokeStyle = "rgba(0, 242, 255, 0.5)";
    ctx.setLineDash([40, 20]);
    ctx.lineWidth = 5;
    [175, 325].forEach(lineX => {
        ctx.beginPath(); ctx.moveTo(lineX, 0); ctx.lineTo(lineX, 800); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw Trees & "Robo" Signs (Outside Road)
    decoration.forEach(d => {
        const img = d.type === 'tree' ? treeImg : signImg;
        ctx.drawImage(img, d.x, d.y, 80, 80);
    });

    // Draw Player Car (Locked to Lane)
    const playerX = lanes[currentLane] - 40;
    ctx.shadowBlur = 20; ctx.shadowColor = "#00f2ff";
    ctx.drawImage(playerImg, playerX, 680, 80, 120);
    ctx.shadowBlur = 0;

    // Draw Enemies
    enemies.forEach(en => {
        ctx.drawImage(enemyImg, en.x - 40, en.y, 80, 120);
        // Life Bar above enemy
        ctx.fillStyle = "red";
        ctx.fillRect(en.x - 30, en.y - 10, en.life / 2, 5);
    });

    // Draw Bullets (Lasers)
    ctx.fillStyle = "#ffff00";
    bullets.forEach(b => ctx.fillRect(b.x - 3, b.y, 6, 20));
}

function spawnEnemy() {
    let lane = Math.floor(Math.random() * 3);
    enemies.push({ x: lanes[lane], y: -150, lane: lane, speed: 5, life: 100 });
}

function spawnDecoration() {
    let side = Math.random() > 0.5 ? 20 : 400; // Left or Right grass
    decoration.push({ x: side, y: -100, type: Math.random() > 0.7 ? 'sign' : 'tree' });
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').style.display = 'flex';
}

gameLoop();
