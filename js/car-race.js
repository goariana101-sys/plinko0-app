const LANES = [40, 120, 200]; 
let currentLane = 1;
let health = 100;
let score = 0;
let gameActive = true;

const player = document.getElementById('playerCar');
const entityLayer = document.getElementById('entityLayer');

player.style.left = LANES[currentLane] + "px";

function move(dir) {
    if (!gameActive) return;
    if (dir === 'left' && currentLane > 0) currentLane--;
    if (dir === 'right' && currentLane < 2) currentLane++;
    player.style.left = LANES[currentLane] + "px";
}

function shoot() {
    if (!gameActive) return;
    const glove = document.createElement('div');
    glove.style.position = "absolute";
    glove.innerHTML = "🥊";
    glove.style.fontSize = "30px";
    glove.style.left = (LANES[currentLane] + 15) + "px";
    glove.style.bottom = "150px";
    entityLayer.appendChild(glove);

    let pos = 150;
    const moveGlove = setInterval(() => {
        pos += 15;
        glove.style.bottom = pos + "px";
        document.querySelectorAll('.enemy').forEach(en => {
            const r1 = glove.getBoundingClientRect();
            const r2 = en.getBoundingClientRect();
            if (!(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom)) {
                en.innerHTML = "💥";
                setTimeout(() => en.remove(), 200);
                glove.remove();
                clearInterval(moveGlove);
                score += 100;
                document.getElementById('scoreVal').innerText = score;
            }
        });
        if (pos > 1500) { clearInterval(moveGlove); glove.remove(); }
    }, 20);
}

document.getElementById('btnLeft').onclick = () => move('left');
document.getElementById('btnRight').onclick = () => move('right');
document.getElementById('btnShoot').onclick = () => shoot();

setInterval(() => {
    if (!gameActive) return;
    const en = document.createElement('div');
    const lane = Math.floor(Math.random() * 3);
    en.className = 'car-3d enemy';
    en.style.left = LANES[lane] + "px";
    en.style.top = "-100px";
    entityLayer.appendChild(en);

    let top = -100;
    const moveEn = setInterval(() => {
        top += 10;
        en.style.top = top + "px";
        if (top > 1200 && top < 1350 && lane === currentLane) {
            health -= 20;
            document.getElementById('healthFill').style.width = health + "%";
            en.remove();
            clearInterval(moveEn);
            if(health <= 0) {
                gameActive = false;
                document.getElementById('game-over').style.display = 'block';
            }
        }
        if (top > 2000) { clearInterval(moveEn); en.remove(); }
    }, 20);
}, 2000);
