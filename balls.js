const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');

let balls = [];
let w, h;

// simple click sounds using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playHitSound(volume = 0.3, freq = 600) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.value = volume;
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.stop(audioCtx.currentTime + 0.12);
}

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}

class Ball {
    constructor(x, y) {
        this.x = x || Math.random() * w;
        this.y = y || Math.random() * h;
        this.r = Math.random() * 18 + 12;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.color = `hsl(${Math.random()*360}, 85%, 62%)`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        let hit = false;

        // bouncier walls
        if (this.x - this.r < 0) { 
            this.x = this.r; 
            this.vx *= -0.96; 
            hit = true; 
        }
        if (this.x + this.r > w) { 
            this.x = w - this.r; 
            this.vx *= -0.96; 
            hit = true; 
        }
        if (this.y - this.r < 0) { 
            this.y = this.r; 
            this.vy *= -0.96; 
            hit = true; 
        }
        if (this.y + this.r > h) { 
            this.y = h - this.r; 
            this.vy *= -0.92;   // slightly less bouncy on floor
            hit = true; 
        }

        this.vy += 0.15; // gravity

        if (hit) playHitSound(0.25, 400 + Math.random() * 300);
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(this.x - this.r*0.35, this.y - this.r*0.35, this.r*0.3, 0, Math.PI*2);
        ctx.fill();
    }
}

function collide(b1, b2) {
    const dx = b2.x - b1.x;
    const dy = b2.y - b1.y;
    const dist = Math.hypot(dx, dy);

    if (dist >= b1.r + b2.r || dist === 0) return;

    const nx = dx / dist;
    const ny = dy / dist;

    const overlap = (b1.r + b2.r) - dist;
    b1.x -= nx * overlap * 0.5;
    b1.y -= ny * overlap * 0.5;
    b2.x += nx * overlap * 0.5;
    b2.y += ny * overlap * 0.5;

    const dvx = b2.vx - b1.vx;
    const dvy = b2.vy - b1.vy;
    const dot = dvx * nx + dvy * ny;

    b1.vx += dot * nx * 1.05;  // extra energy for more bounce
    b1.vy += dot * ny * 1.05;
    b2.vx -= dot * nx * 1.05;
    b2.vy -= dot * ny * 1.05;

    // play collision sound
    const speed = Math.hypot(dvx, dvy);
    if (speed > 2) playHitSound(Math.min(speed / 25, 0.4), 800 - speed * 8);
}

function animate() {
    ctx.fillStyle = 'rgba(17,17,17,0.22)';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < balls.length; i++) {
        balls[i].update();
        balls[i].draw();
    }

    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            collide(balls[i], balls[j]);
        }
    }

    countEl.textContent = balls.length;
    requestAnimationFrame(animate);
}

// click to spawn
canvas.addEventListener('click', e => {
    for (let i = 0; i < 8; i++) {
        balls.push(new Ball(e.clientX, e.clientY));
    }
});

// space to clear
document.addEventListener('keydown', e => {
    if (e.key === ' ') balls = [];
});

window.addEventListener('resize', resize);
resize();
animate();

// starter balls
for (let i = 0; i < 25; i++) balls.push(new Ball());
