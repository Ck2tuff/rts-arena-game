/*************************************************
 * CANVAS SETUP (Responsive)
 *************************************************/
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    const maxWidth = 800;
    const width = Math.min(window.innerWidth, maxWidth);
    const height = width * 0.625; // 16:10 ratio

    canvas.width = width;
    canvas.height = height;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/*************************************************
 * GAME CONSTANTS
 *************************************************/
const TOWER_RANGE = 120;
const UNIT_SPEED = 40;
const UNIT_DAMAGE = 10;
const UNIT_ATTACK_RANGE = 20;
const ELIXIR_MAX = 10;

/*************************************************
 * UTILITY
 *************************************************/
function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

/*************************************************
 * CLASSES
 *************************************************/

/* -------------------------------
   Unit
--------------------------------*/
class Unit {
    constructor(x, y, targetTower, owner) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.hp = 50;
        this.damage = UNIT_DAMAGE;
        this.speed = UNIT_SPEED;
        this.targetTower = targetTower;
        this.owner = owner;
        this.attackCooldown = 0;
    }

    update(deltaTime) {
        if (this.hp <= 0) return;

        const dist = distance(this, this.targetTower);

        if (dist > UNIT_ATTACK_RANGE) {
            const angle = Math.atan2(
                this.targetTower.y - this.y,
                this.targetTower.x - this.x
            );

            this.x += Math.cos(angle) * this.speed * deltaTime;
            this.y += Math.sin(angle) * this.speed * deltaTime;
        } else {
            if (this.attackCooldown <= 0) {
                this.targetTower.hp -= this.damage;
                this.attackCooldown = 1;
            }
        }

        this.attackCooldown -= deltaTime;
    }

    draw() {
        ctx.fillStyle = this.owner === "player" ? "cyan" : "orange";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

/* -------------------------------
   Tower
--------------------------------*/
class Tower {
    constructor(x, y, owner) {
        this.x = x;
        this.y = y;
        this.hp = 200;
        this.range = TOWER_RANGE;
        this.owner = owner;
        this.attackCooldown = 0;
    }

    update(deltaTime, enemyUnits) {
        if (this.hp <= 0) return;

        this.attackCooldown -= deltaTime;

        const target = enemyUnits.find(
            u => u.hp > 0 && distance(this, u) <= this.range
        );

        if (target && this.attackCooldown <= 0) {
            target.hp -= 15;
            this.attackCooldown = 1;
        }
    }

    draw() {
        ctx.fillStyle = this.owner === "player" ? "blue" : "red";
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);

        // HP bar
        ctx.fillStyle = "green";
        ctx.fillRect(this.x - 20, this.y - 30, (this.hp / 200) * 40, 5);
    }
}

/* -------------------------------
   Player
--------------------------------*/
class Player {
    constructor(side) {
        this.side = side;
        this.elixir = 5;
        this.units = [];

        this.tower = side === "player"
            ? new Tower(100, canvas.height / 2, "player")
            : new Tower(canvas.width - 100, canvas.height / 2, "ai");
    }

    regenerateElixir(deltaTime) {
        this.elixir += deltaTime * 0.5;
        this.elixir = Math.min(this.elixir, ELIXIR_MAX);
    }
}

/*************************************************
 * GAME STATE
 *************************************************/
const player = new Player("player");
const ai = new Player("ai");

let lastTime = 0;
let aiTimer = 0;

/*************************************************
 * INPUT
 *************************************************/
document.getElementById("spawnUnitBtn").addEventListener("click", () => {
    if (player.elixir >= 3) {
        player.elixir -= 3;
        player.units.push(
            new Unit(
                player.tower.x + 30,
                player.tower.y,
                ai.tower,
                "player"
            )
        );
    }
});

/*************************************************
 * MAIN LOOP
 *************************************************/
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}

/*************************************************
 * UPDATE
 *************************************************/
function update(deltaTime) {
    player.regenerateElixir(deltaTime);
    ai.regenerateElixir(deltaTime);

    player.units.forEach(u => u.update(deltaTime));
    ai.units.forEach(u => u.update(deltaTime));

    player.tower.update(deltaTime, ai.units);
    ai.tower.update(deltaTime, player.units);

    // Simple AI
    aiTimer += deltaTime;
    if (aiTimer > 3 && ai.elixir >= 3) {
        ai.elixir -= 3;
        ai.units.push(
            new Unit(
                ai.tower.x - 30,
                ai.tower.y,
                player.tower,
                "ai"
            )
        );
        aiTimer = 0;
    }

    document.getElementById("elixirValue").innerText =
        Math.floor(player.elixir);

    // Win / Lose
    if (player.tower.hp <= 0) {
        alert("You Lose!");
        location.reload();
    }
    if (ai.tower.hp <= 0) {
        alert("You Win!");
        location.reload();
    }
}

/*************************************************
 * RENDER
 *************************************************/
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.tower.draw();
    ai.tower.draw();

    player.units.forEach(u => u.draw());
    ai.units.forEach(u => u.draw());
}

/*************************************************
 * START
 *************************************************/
requestAnimationFrame(gameLoop);
