const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var mouseX = canvas.width / 2;
var mouseY = canvas.height / 2;

canvas.addEventListener("mousemove", function(e) { 
    var cRect = canvas.getBoundingClientRect();
    var canvasX = Math.round(e.clientX - cRect.left);
    var canvasY = Math.round(e.clientY - cRect.top);
    mouseX = canvasX;
    mouseY = canvasY;
});

class Ship {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.angle = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.asteroidsDestroyed = 0;
        this.alive = true;
    }
    
    update(mouseX, mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 10) {
            const speed = Math.min(distance / 50, 3);
            this.velocityX = (dx / distance) * speed;
            this.velocityY = (dy / distance) * speed;
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.angle = Math.atan2(dy, dx);
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}
const ship = new Ship();

var lasers = [];
class Laser {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.velocityX = Math.cos(angle) * 8;
        this.velocityY = Math.sin(angle) * 8;
        this.radius = 0;
        this.length = 12;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Remove laser if it goes off screen
        if (this.x <  -(this.length*10) || this.x > canvas.width + (this.length*10) || this.y < -(this.length*10) || this.y > canvas.height + (this.length*10)) {
            lasers = lasers.filter(l => l !== this);
        }

    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - Math.cos(this.angle) * this.length, this.y - Math.sin(this.angle) * this.length);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 5;
        ctx.stroke();
    }
}

// window.addEventListener("keydown", function(e) { 
//     lasers.push(new Laser(ship.x, ship.y, ship.angle));
// });

var asteroids = [];
var id = 0;
class Asteroid {
    constructor() {
        this.id = id++;
        this.radius = 30 + Math.random() * 20;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        if (Math.random() > 0.5) {
            this.x = Math.random() > 0.5 ? -this.radius : canvas.width + this.radius;
            this.y = Math.random() * canvas.height;
        } else {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() > 0.5 ? -this.radius : canvas.height + this.radius;
        }

        this.angle = Math.random() * Math.PI * 2;
        this.sides = 5 + Math.floor(Math.random() * 5);
        this.velocityX = (Math.random() - 0.5) * 10;
        this.velocityY = (Math.random() - 0.5) * 10;

        this.offsets = [];
        for (let i = 0; i < this.sides; i++) {
            this.offsets.push((Math.random() - 0.5) * 10);
        }
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.angle += this.rotationSpeed;

        if (this.x < -this.radius * 2 || this.x > canvas.width + this.radius * 2 ||
            this.y < -this.radius * 2 || this.y > canvas.height + this.radius * 2) {
            asteroids = asteroids.filter(a => a.id !== this.id);
        }

        // Check collision with lasers
        lasers.forEach((laser, index) => {
            const dx = laser.x - this.x;
            const dy = laser.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.radius) {
                asteroids = asteroids.filter(a => a.id !== this.id);
                lasers.splice(index, 1);
                ship.asteroidsDestroyed++;
            }
        });

        // Check collision with ship
        const dx = ship.x - this.x;
        const dy = ship.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.radius) {
            ship.alive = false;
        }

        // Check collision with other asteroids
        asteroids.forEach(other => {
            if (other.id !== this.id) {
                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < this.radius + other.radius) {
                    const angle = Math.atan2(dy, dx);
                    const totalMass = this.radius + other.radius;
                    const newVelX1 = (this.velocityX * (this.radius - other.radius) + (2 * other.radius * other.velocityX)) / totalMass;
                    const newVelY1 = (this.velocityY * (this.radius - other.radius) + (2 * other.radius * other.velocityY)) / totalMass;
                    const newVelX2 = (other.velocityX * (other.radius - this.radius) + (2 * this.radius * this.velocityX)) / totalMass;
                    const newVelY2 = (other.velocityY * (other.radius - this.radius) + (2 * this.radius * this.velocityY)) / totalMass;
                    this.velocityX = newVelX1;
                    this.velocityY = newVelY1;
                    other.velocityX = newVelX2;
                    other.velocityY = newVelY2;

                    // Separate overlapping asteroids
                    const overlap = 0.5 * (this.radius + other.radius - distance + 1);
                    this.x -= overlap * Math.cos(angle);
                    this.y -= overlap * Math.sin(angle);
                    other.x += overlap * Math.cos(angle);
                    other.y += overlap * Math.sin(angle);
                }
            }
        });
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        for (let i = 0; i < this.sides; i++) {
            const theta = (i / this.sides) * Math.PI * 2;
            const r = this.radius + this.offsets[i];
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}

for (let i = 0; i < 5; i++) {
    asteroids.push(new Asteroid());
}

var previousTime = 0;
var position = 0;
var startTime;
function gameLoop(currentTime) {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Fire laser every X ms
    if (elapsed > 1200) {
        startTime = currentTime;
        lasers.push(new Laser(ship.x, ship.y, ship.angle));
    }
    
    // Draw new asteroid randomly
    if (Math.random() > 0.85) {
        asteroids.push(new Asteroid());
    }
    
    
    // Update and draw ship
    ship.update(mouseX, mouseY);
    ship.draw();
    
    // Update and draw asteroids
    asteroids.forEach(asteroid => {
        asteroid.update();
        asteroid.draw();
    });
    
    // Update and draw lasers
    lasers.forEach((laser, index) => {
        laser.update();
        laser.draw();
    });
    
    // print number of asteroids
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Asteroids Destroyed: ${ship.asteroidsDestroyed}`, 20, 30);
    
    if (!ship.alive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Game Over! You destroyed ${ship.asteroidsDestroyed} asteroids.`, canvas.width / 2, canvas.height / 2);
        return;
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);