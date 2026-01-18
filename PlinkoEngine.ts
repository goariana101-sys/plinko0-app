
interface GameOptions {
    onWin: (amount: number, multiplier: number) => void;
    onCollision: () => void;
}

interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    bet: number;
}

export default class PlinkoEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private options: GameOptions;
    private activeBall: Ball | null = null;
    private animationId: number | null = null;
    
    private rows = 11;
    private multipliers = [125, 14, 5, 1.3, 0.4, 0.2, 0.2, 0.4, 1.3, 5, 14, 125];
    private trails: { x: number; y: number; alpha: number }[] = [];
    
    // Core Jackpot Logic from your games.js
    private gameStartTime: number = Date.now();
    private hasWonJackpot: boolean = false;
    private JACKPOT_TIME_LIMIT = 210000; // 3.5 Minutes

    constructor(canvas: HTMLCanvasElement, options: GameOptions) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        this.options = options;
    }

    public start() {
        if (!this.animationId) {
            this.animate();
        }
    }

    public dropBall(bet: number) {
        if (this.activeBall) return;
        this.activeBall = {
            x: this.canvas.width / 2 + (Math.random() * 4 - 2),
            y: 35,
            vx: (Math.random() - 0.5) * 2,
            vy: 0,
            bet: bet
        };
        this.trails = [];
    }

    private animate = () => {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(this.animate);
    }

    private update() {
        if (!this.activeBall) return;

        const ball = this.activeBall;
        const gravity = 0.18;
        const friction = 0.98;

        const timePlayed = Date.now() - this.gameStartTime;
        const forceJackpot = (timePlayed > this.JACKPOT_TIME_LIMIT && !this.hasWonJackpot);

        ball.vy += gravity;
        ball.vx *= friction;
        ball.vy *= friction;

        // Forced X Steering for Jackpot (target 125x slots at the ends)
        if (forceJackpot && ball.y > 150) {
            const targetX = Math.random() > 0.5 ? 40 : this.canvas.width - 40;
            ball.vx += (targetX - ball.x) * 0.005; 
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        // Boundary bounce
        if (ball.x < 25) { ball.x = 25; ball.vx *= -0.6; }
        if (ball.x > this.canvas.width - 25) { ball.x = this.canvas.width - 25; ball.vx *= -0.6; }

        const spacingX = 48;
        const spacingY = 42;
        const startY = 60;
        for (let r = 0; r < this.rows; r++) {
            const dots = r + 3;
            const rowX = (this.canvas.width / 2) - (dots - 1) * (spacingX / 2);
            const rowY = startY + (r * spacingY);

            if (Math.abs(ball.y - rowY) < 12) {
                for (let d = 0; d < dots; d++) {
                    const dotX = rowX + d * spacingX;
                    const dx = ball.x - dotX;
                    const dy = ball.y - rowY;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < 121) { 
                        const angle = Math.atan2(dy, dx);
                        ball.x = dotX + Math.cos(angle) * 12;
                        ball.y = rowY + Math.sin(angle) * 12;
                        ball.vy *= -0.4;
                        ball.vx = Math.cos(angle) * 2.5 + (Math.random() - 0.5);
                        this.options.onCollision();
                    }
                }
            }
        }

        this.trails.push({ x: ball.x, y: ball.y, alpha: 1.0 });
        if (this.trails.length > 10) this.trails.shift();

        if (ball.y > this.canvas.height - 40) {
            const slotWidth = this.canvas.width / this.multipliers.length;
            const index = Math.floor(ball.x / slotWidth);
            const multiplier = this.multipliers[Math.max(0, Math.min(index, this.multipliers.length - 1))];
            
            if (multiplier === 125) {
                this.hasWonJackpot = true;
            }
            this.options.onWin(ball.bet, multiplier);
            this.activeBall = null;
        }
    }

    private draw() {
        const { ctx, canvas } = this;
        ctx.fillStyle = "#050a0f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Pegs
        ctx.fillStyle = "#ffffff";
        for (let r = 0; r < this.rows; r++) {
            const dots = r + 3;
            const startX = (canvas.width / 2) - (dots - 1) * (48 / 2);
            for (let d = 0; d < dots; d++) {
                ctx.beginPath();
                ctx.arc(startX + (d * 48), 60 + (r * 42), 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Trails
        this.trails.forEach(t => {
            t.alpha -= 0.1;
            if (t.alpha > 0) {
                ctx.beginPath();
                ctx.arc(t.x, t.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 204, 0, ${t.alpha * 0.2})`;
                ctx.fill();
            }
        });

        // Draw Ball
        if (this.activeBall) {
            ctx.beginPath();
            ctx.arc(this.activeBall.x, this.activeBall.y, 12, 0, Math.PI * 2);
            ctx.fillStyle = "#ffcc00";
            ctx.fill();
        }
    }
}
