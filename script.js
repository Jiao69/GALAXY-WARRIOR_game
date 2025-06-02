const menu = document.getElementById('menu');
const canvas = document.getElementById('gameCanvas');
const startButton = document.getElementById('startButton');
const continueButton = document.getElementById('continueButton');
const restartButton = document.getElementById('restartButton');
const mainMenuButton = document.getElementById('mainMenuButton');
const difficultyOptions = document.querySelectorAll('.difficultyOption');
const ctx = canvas.getContext('2d');

//МЕНЮ
startButton.addEventListener('click', () => {
  //всплывающее окно выбора сложности
  document.getElementById('difficultyPopup').style.display = 'block';
});

//продолжить 
continueButton.addEventListener('click', () => {
  isPaused = false;
  menu.style.display = 'none';
  canvas.style.display = 'block';
  requestAnimationFrame(gameLoop);
});

//возврат в меню
mainMenuButton.addEventListener('click', () => {
  returnToMenu();
});

// сложность и скины
difficultyOptions.forEach(button => {
  button.addEventListener('click', () => {
    const selectedDiff = button.dataset.diff;
    difficulty = selectedDiff;
    currentDifficultyIndex = difficulties.indexOf(difficulty);

    // Загрузка выбранного скина игрока
    switch (selectedSkin) {
      case 1:
        playerImg.src = 'resources/images/ship.png';
        break;
      case 2:
        playerImg.src = 'resources/images/ship2.png';
        break;
      case 3:
        playerImg.src = 'resources/images/ship3.png';
        break;
    }

    difficultyPopup.style.display = 'none';
    menu.style.display = 'none';
    canvas.style.display = 'block';

    resetGame();
    backgroundMusic.play().catch(console.error);
    coinSound.play().catch(console.error);
    isGameStarted = true;
    isPaused = false;
    requestAnimationFrame(gameLoop);
  });
});

//cкины
const skinOptions = document.querySelectorAll('.skin-option');
skinOptions.forEach(option => {
  option.addEventListener('click', () => {
    selectedSkin = parseInt(option.dataset.skin);
    skinOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
  });
});

//рестарт
restartButton.addEventListener('click', () => {
  resetGame();
  menu.style.display = 'none';
  canvas.style.display = 'block';
  backgroundMusic.play().catch(console.error);
  coinSound.play().catch(console.error);
  isGameStarted = true;
  isPaused = false;
  requestAnimationFrame(gameLoop);
});

//настройка звука
const nastrButton = document.getElementById('nastrButton');
const settingsMenu = document.getElementById('settingsMenu');
const volumeSlider = document.getElementById('volumeSlider');

nastrButton.addEventListener('click', () => {
  settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
});

//громкость звуков
volumeSlider.addEventListener('input', () => {
  backgroundMusic.volume = volumeSlider.value;
  shootSound.volume = volumeSlider.value;
  explosionSound.volume = volumeSlider.value;
  powerUpSound.volume = volumeSlider.value;
  hpSound.volume = volumeSlider.value;
  superBulletSound.volume = volumeSlider.value;
  backgroundMusic.volume = volumeSlider.value;
  coinSound.volume = volumeSlider.value;
});

// Переменные игры
//игрок 
const playerFireRate = 100;
const maxBullets = 15; // патроны
const SUPER_BULLET_DAMAGE = 2;
const SUPER_BULLET_BOSS_DAMAGE = 1;
const reloadTime = 1000;//перезаряд
let playerX = 375, playerY = 550;
let playerHealth = 50; // здоровье игрока
let bullets = [];
const bulletSpeed = 300;
let isUltaActive = false;// для ульты
let ultaEndTime = 0;
let selectedSkin = 1;//скины

//враги
let enemySpeed = 100;
let enemy2Speed = 100;
let bossSpeed = 50;
const enemyFireRate = 1000;
const asteroidSpeed = 100;
let enemyBullets = [];
let asteroids = [];
let enemies = [];
let bosses = [];

//логика
let powerUps = [];
let score = 0;
let lastSpawnTime = 0;
let lastEnemyShotTime = 0;
let spawnInterval = 1000;
let keys = { left: false, right: false, up: false, down: false, space: false, pause: false };
let isPaused = true;
let level = 1;
let bossSpawned = false;
let playerCanShoot = true;
let lastTime = 0;
let explosions = [];
let totalEnemiesKilled = 0;
let difficulty = 'normal';
let difficulties = ['easy', 'normal', 'hard'];
let currentDifficultyIndex = 1;
const difficultySettings = { //настройка уровней сложности 
  easy: { enemySpeed: 50, enemy2Speed: 50, bossSpeed: 30, playerHealth: 50, enemyDamage: 1, spawnRate: 1.0 },
  normal: { enemySpeed: 100, bossSpeed: 50, playerHealth: 50, enemyDamage: 10, spawnRate: 1.5 },
  hard: { enemySpeed: 180, bossSpeed: 100, playerHealth: 50, enemyDamage: 30, spawnRate: 2.0 },
};

// Переменные для перезарядки
let currentAmmo = maxBullets;
let isReloading = false;
let reloadStartTime = 0;

// Переменные для отрисовки уведов уровня
let levelNotification = "";
let notificationDuration = 15000;
let notificationStartTime = 0;

//кацена
let isGameOver = false;
let cutsceneMusic = null;
let isCutscene = false;
let cutsceneTimeoutId = null;

// Звуки
const shootSound = new Audio('resources/music/shoot.mp3');
const explosionSound = new Audio('resources/music/explosion.mp3');
const hpSound = new Audio('resources/music/hp rebot.mp3');
const powerUpSound = new Audio('resources/music/powerup.mp3');
const superBulletSound = new Audio('resources/music/superbullet.mp3');
const backgroundMusic = new Audio('resources/music/background.mp3');
backgroundMusic.loop = true;
const coinSound = new Audio('resources/music/Start.mp3');

// Список всех звуков
const allSounds = [
  shootSound,
  explosionSound,
  hpSound,
  powerUpSound,
  superBulletSound,
  backgroundMusic,
  coinSound
];

const savedVolume = localStorage.getItem('volume');
const initialVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.35;

volumeSlider.value = initialVolume;
allSounds.forEach(sound => {
  sound.volume = initialVolume;
});

// Обработчик изменения громкости
volumeSlider.addEventListener('input', () => {
  const volume = parseFloat(volumeSlider.value);
  allSounds.forEach(sound => {
    sound.volume = volume;
  });
  localStorage.setItem('volume', volume);
});

// Изображения
//тексутуры
const backgroundImage = new Image();
backgroundImage.src = 'resources/images/level1-bg.png';
const coinImg = new Image();
coinImg.src = 'resources/images/star.png';
const gameOverImg = new Image();
gameOverImg.src = 'resources/images/gameover.png';
const heartImg = new Image();
heartImg.src = 'resources/images/heart.png';
let cutsceneImg = new Image();
cutsceneImg.src = 'resources/images/cutscene.png';

//игрок
const playerImg = new Image();
playerImg.src = 'resources/images/ship.png';
const bulletImg = new Image();

//враги
const bossImgs = [
  { img: new Image(), src: 'resources/images/Boss1.png', xp: 100 },
  { img: new Image(), src: 'resources/images/Boss2.png', xp: 150 },
  { img: new Image(), src: 'resources/images/Boss3.png', xp: 200 },
  { img: new Image(), src: 'resources/images/Boss4.png', xp: 300 },
  { img: new Image(), src: 'resources/images/FinalBoss.png', xp: 500 }
];
const enemyImg = new Image();
const enemy2Img = new Image();
const armoredEnemyImg = new Image();
const dodgingEnemyImg = new Image();
const teleportingEnemyImg = new Image();
const asteroidImg = new Image();
dodgingEnemyImg.src = 'resources/images/DodgingEnemy.png';
teleportingEnemyImg.src = 'resources/images/TeleportingEnemy.png';
armoredEnemyImg.src = 'resources/images/ArmoredEnemy.png';
enemyImg.src = 'resources/images/enemy.png';
enemy2Img.src = 'resources/images/enemy2.png';
asteroidImg.src = 'resources/images/asteroid.png';

//доп предметы
const powerUpImg = new Image();
const explosionImg = new Image();
const hpImg = new Image();
const shieldImg = new Image();
const superBulletImg = new Image();
superBulletImg.src = 'resources/images/superbullet.png';
shieldImg.src = 'resources/images/shield.png';
bulletImg.src = 'resources/images/bullet.png';
powerUpImg.src = 'resources/images/powerup.png';
explosionImg.src = 'resources/images/explosion.png';
hpImg.src = 'resources/images/HP.png';

bossImgs.forEach(boss => boss.img.src = boss.src);

// Класс игрока
class Player {
  constructor() {
    this.x = playerX;
    this.y = playerY;
    this.width = 50;
    this.height = 50;
    this.health = playerHealth;
    this.dead = false;
    this.isShielded = false;
    this.shieldDuration = 10000; //время щита 
    this.shieldStartTime = 0;
    this.superBulletDuration = 10000; // время супер пули
    this.superBulletStartTime = 0;
  }

  takeDamage() {
    if (this.isShielded) return;
    this.health--;
    if (this.health <= 0) {
      this.dead = true;
      explosions.push(new Explosion(this.x, this.y));
      showGameOver(); 
    }
  }

  draw() {
    ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
    if (this.isShielded) {
      ctx.globalAlpha = 0.5;
      ctx.drawImage(shieldImg, this.x - 5, this.y - 5, this.width + 10, this.height + 10);
      ctx.globalAlpha = 1;
    }
  }

  update(deltaTime) {
    if (this.dead) return;
    const baseSpeed = score >= 200 ? 300 : 200;
    const speed = baseSpeed + score / 100;
    if (keys.left && this.x > 0) this.x -= speed * deltaTime;
    if (keys.right && this.x + this.width < canvas.width) this.x += speed * deltaTime;
    if (keys.up && this.y > 0) this.y -= speed * deltaTime;
    if (keys.down && this.y + this.height < canvas.height) this.y += speed * deltaTime;

    if (this.isShielded && performance.now() - this.shieldStartTime >= this.shieldDuration) {
      this.isShielded = false;
    }

    if (this.superBulletStartTime && performance.now() - this.superBulletStartTime >= this.superBulletDuration) {
      this.superBulletStartTime = 0;
    }
  }

  takeDamage() {
    if (this.isShielded) {
      return;
    }
    this.health--;
    if (this.health <= 0) {
      this.dead = true;
      explosions.push(new Explosion(this.x, this.y));
      showGameOver();
    }
  }

  activateShield() {
    this.isShielded = true;
    this.shieldStartTime = performance.now();
  }

  activateSuperBullet() {
    this.superBulletStartTime = performance.now();
  }

  isSuperBulletActive() {
    return this.superBulletStartTime !== 0;
  }
}

const player = new Player(); // спавн игрока

// Класс астероида
class DestructibleObject {
  constructor(x, y, width, height, health) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.health = health;
  }

  draw() {
    ctx.drawImage(asteroidImg, this.x, this.y, this.width, this.height);
  }

  update(deltaTime) {
    this.y += asteroidSpeed * deltaTime;
  }
}

// Функция для спавна разрушаемых объектов
function spawnDestructibleObject() {
  const x = Math.random() * (canvas.width - 50);
  const y = Math.random() * (canvas.height - 50);
  destructibleObjects.push(new DestructibleObject(x, y, 50, 50, 3));
}

let destructibleObjects = [];

setInterval(spawnDestructibleObject, 5000);

// Класс врагов
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.health = 2; 
    this.hitEffect = 0;
    this.lastShotTime = performance.now();
    this.shootCooldown = 1000 + Math.random() * 1000;
  }

  draw() {
    if (this.hitEffect > 0) {
      const pulse = 1 + 0.1 * Math.sin(this.hitEffect * 0.5);
      const alpha = 0.5 + 0.5 * Math.sin(this.hitEffect * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(enemyImg,
        this.x - (this.width * (pulse - 1)) / 2,
        this.y - (this.height * (pulse - 1)) / 2,
        this.width * pulse,
        this.height * pulse);
      ctx.restore();

      this.hitEffect--;
    } else {
      ctx.drawImage(enemyImg, this.x, this.y, this.width, this.height);
    }
  }

  update(deltaTime) {
    this.y += enemySpeed * deltaTime;
    if (performance.now() - this.lastShotTime > this.shootCooldown) {
      this.shoot();
      this.lastShotTime = performance.now();
    }
  }

  shoot() {
    enemyBullets.push(new Bullet(this.x + 22.5, this.y + this.height, 'enemy'));
  }
}

class Enemy2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.health = 2;
    this.direction = 1;
    this.speedX = 50;
    this.lastShotTime = performance.now();
    this.shootCooldown = 1000 + Math.random() * 1000;
    this.hitEffect = 0;
  }

  draw() {
    if (this.hitEffect > 0) {
      const pulse = 1 + 0.1 * Math.sin(this.hitEffect * 0.5);
      const alpha = 0.5 + 0.5 * Math.sin(this.hitEffect * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(enemy2Img,
        this.x - (this.width * (pulse - 1)) / 2,
        this.y - (this.height * (pulse - 1)) / 2,
        this.width * pulse,
        this.height * pulse);
      ctx.restore();

      this.hitEffect--;
    } else {
      ctx.drawImage(enemy2Img, this.x, this.y, this.width, this.height);
    }
  }

  update(deltaTime) {
    this.y += enemy2Speed * deltaTime;
    this.x += this.direction * this.speedX * deltaTime;
    if (this.x <= 0 || this.x + this.width >= canvas.width) {
      this.direction *= -1;
    }

    if (performance.now() - this.lastShotTime > this.shootCooldown) {
      this.shoot();
      this.lastShotTime = performance.now();
    }
  }

  shoot() {
    enemyBullets.push(new Bullet(this.x + 22.5, this.y + this.height, 'enemy'));
  }
}

class ArmoredEnemy { //броняха
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.health = 5;
    this.lastShotTime = performance.now();
    this.shootCooldown = 1500 + Math.random() * 1000;
    this.hitEffect = 0;
  }

  draw() {
    if (this.hitEffect > 0) {
      const pulse = 1 + 0.1 * Math.sin(this.hitEffect * 0.5);
      const alpha = 0.5 + 0.5 * Math.sin(this.hitEffect * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(armoredEnemyImg,
        this.x - (this.width * (pulse - 1)) / 2,
        this.y - (this.height * (pulse - 1)) / 2,
        this.width * pulse,
        this.height * pulse);
      ctx.restore();

      this.hitEffect--;
    } else {
      ctx.drawImage(armoredEnemyImg, this.x, this.y, this.width, this.height);
    }
  }

  update(deltaTime) {
    this.y += enemySpeed * deltaTime;
    if (performance.now() - this.lastShotTime > this.shootCooldown) {
      this.shoot();
      this.lastShotTime = performance.now();
    }
  }

  shoot() {
    enemyBullets.push(new Bullet(this.x + 22.5, this.y + this.height, 'enemy'));
  }
}

class TeleportingEnemy { //телепорт
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.health = 3;
    this.teleportInterval = 2000; // интервал телепортации 
    this.lastTeleportTime = 0;
  }

  draw() {
    if (this.hitEffect > 0) {
      const pulse = 1 + 0.1 * Math.sin(this.hitEffect * 0.5);
      const alpha = 0.5 + 0.5 * Math.sin(this.hitEffect * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(teleportingEnemyImg,
        this.x - (this.width * (pulse - 1)) / 2,
        this.y - (this.height * (pulse - 1)) / 2,
        this.width * pulse,
        this.height * pulse);
      ctx.restore();

      this.hitEffect--;
    } else {
      ctx.drawImage(teleportingEnemyImg, this.x, this.y, this.width, this.height);
    }
  }

  update(deltaTime) {
    this.y += enemySpeed * deltaTime;

    // Телепортация
    let now = performance.now();
    if (now - this.lastTeleportTime > this.teleportInterval) {
      this.x = Math.random() * (canvas.width - this.width);
      this.lastTeleportTime = now;
    }
  }

  shoot() {
    enemyBullets.push(new Bullet(this.x + 22.5, this.y + this.height, 'enemy'));
  }
}

class DodgingEnemy { //уклонялка
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.health = 3;
    this.dodgeSpeed = 100;
  }

  draw() {
    if (this.hitEffect > 0) {
      const pulse = 1 + 0.1 * Math.sin(this.hitEffect * 0.5);
      const alpha = 0.5 + 0.5 * Math.sin(this.hitEffect * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(dodgingEnemyImg,
        this.x - (this.width * (pulse - 1)) / 2,
        this.y - (this.height * (pulse - 1)) / 2,
        this.width * pulse,
        this.height * pulse);
      ctx.restore();

      this.hitEffect--;
    } else {
      ctx.drawImage(dodgingEnemyImg, this.x, this.y, this.width, this.height);
    }
  }

  update(deltaTime) {
    this.y += enemySpeed * deltaTime;

    bullets.forEach(bullet => {
      if (bullet.type === 'player' && Math.abs(bullet.x - this.x) < 50) {
        this.x += (bullet.x < this.x ? 1 : -1) * this.dodgeSpeed * deltaTime;
      }
    });
  }

  shoot() {
    enemyBullets.push(new Bullet(this.x + 22.5, this.y + this.height, 'enemy'));
  }
}

// БОСС
class Boss {
  constructor(x, y, health, level) {
    this.x = x;
    this.y = y;
    this.health = health;
    this.maxHealth = health;
    this.width = 100;
    this.height = 100;
    this.speed = bossSpeed;
    this.direction = 1;
    this.level = level;
    this.image = bossImgs[Math.min(level - 1, bossImgs.length - 1)].img;
    this.shootCooldown = 1000;
    this.lastShotTime = 0;
    this.hitEffect = 0;
    this.burstInterval = 5000; 
    this.spawnTime = performance.now(); 
    this.appearDuration = 2000;      
    this.lastBurstTime = 0;
    this.lastSuperBulletTime = 0;
  }

  update(deltaTime) {
    this.x += this.speed * deltaTime * this.direction;
    if (this.x <= 0 || this.x + this.width >= canvas.width) {
      this.direction *= -1;
    }
  }

  draw() {
    const now = performance.now();
    const timeSinceSpawn = now - this.spawnTime;

    let alpha = 1;

    if (timeSinceSpawn < this.appearDuration) {
      const flash = Math.sin(now / 100) * 0.5 + 0.5;
      alpha = Math.min(1, timeSinceSpawn / this.appearDuration) * flash;
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.hitEffect > 0) {
      const pulse = 1 + 0.1 * Math.sin(this.hitEffect * 0.5);
      ctx.drawImage(
        this.image,
        this.x - (this.width * (pulse - 1)) / 2,
        this.y - (this.height * (pulse - 1)) / 2,
        this.width * pulse,
        this.height * pulse
      );
      this.hitEffect--;
    } else {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    ctx.restore();

    // Полоса HP
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x, this.y - 10, this.width, 5);
    ctx.fillStyle = 'lime';
    ctx.fillRect(this.x, this.y - 10, this.width * (this.health / this.maxHealth), 5);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(this.x, this.y - 10, this.width, 5);
  }

  shoot() {
    const now = performance.now();

    if (now - this.lastShotTime > this.shootCooldown) {
      this.lastShotTime = now;
      this.fireAtPlayer();
    }

    if (now - this.lastBurstTime > this.burstInterval) {
      this.lastBurstTime = now;
      for (let i = -2; i <= 2; i++) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x) + i * 0.2;
        const dx = Math.cos(angle) * bulletSpeed;
        const dy = Math.sin(angle) * bulletSpeed;
        enemyBullets.push(new EnemyBullet(this.x + this.width / 2, this.y + this.height / 2, dx, dy));
      }
    }

  }

  fireAtPlayer() {
    let bulletX = this.x + this.width / 2;
    let bulletY = this.y + this.height;
    let targetX = player.x + player.width / 2;
    let targetY = player.y + player.height / 2;
    let diffX = targetX - bulletX;
    let diffY = targetY - bulletY;
    let distance = Math.sqrt(diffX * diffX + diffY * diffY);
    let dx = (diffX / distance) * bulletSpeed;
    let dy = (diffY / distance) * bulletSpeed;
    enemyBullets.push(new EnemyBullet(bulletX, bulletY, dx, dy));
  }
}

// Класс пули Враг
class EnemyBullet {
  constructor(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 15;
    this.dx = dx;
    this.dy = dy;
    this.type = 'enemy';
  }

  draw() {
    ctx.drawImage(bulletImg, this.x, this.y, this.width, this.height);
  }

  update(deltaTime) {
    this.x += this.dx * deltaTime;
    this.y += this.dy * deltaTime;
  }

  isOutOfBounds() {
    return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
  }
}

// Класс пули
class Bullet {
  constructor(x, y, type = 'player') {
    this.x = x;
    this.y = y;
    this.width = 5;
    this.height = 15;
    this.type = type;
  }

  draw() {
    ctx.drawImage(bulletImg, this.x, this.y, this.width, this.height);
  }

  update(deltaTime) {
    this.y += this.type === 'player' ? -bulletSpeed * deltaTime : bulletSpeed * deltaTime;
  }

  isOutOfBounds() {
    return this.y < 0 || this.y > canvas.height;
  }
}

// Класс супер-пули
class SuperBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 10;
    this.height = 30;
    this.type = 'player';
  }

  draw() {
    const pulse = 1 + 0.1 * Math.sin(performance.now() / 100);

    ctx.save();
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 20;

    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.scale(pulse, pulse);
    ctx.drawImage(superBulletImg, -this.width / 2, -this.height / 2, this.width, this.height);

    ctx.restore();
  }

  update(deltaTime) {
    this.y -= bulletSpeed * deltaTime;
  }

  isOutOfBounds() {
    return this.y < 0 || this.y > canvas.height;
  }
}

class SuperBulletPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 50;
  }

  update(deltaTime) {
    this.y += this.speed * deltaTime;
  }

  draw() {
    ctx.drawImage(superBulletImg, this.x, this.y, this.width, this.height);
  }

  activate() {
    isUltaActive = true;
    ultaEndTime = performance.now() + 15000;
    player.activateSuperBullet();
  }
}

// Класс для взрыва
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.duration = 200;
    this.startTime = performance.now();
  }

  draw() {
    ctx.drawImage(explosionImg, this.x, this.y, this.width, this.height);
  }

  isDone() {
    return performance.now() - this.startTime > this.duration;
  }
}

// Класс для щита
class ShieldPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 50;
  }

  update(deltaTime) {
    this.y += this.speed * deltaTime;
  }

  draw() {
    ctx.drawImage(shieldImg, this.x, this.y, this.width, this.height);
  }

  activate() {
    player.activateShield();
  }
}

// Класс для HP-подбора
class HealthPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 50;
  }

  update(deltaTime) {
    this.y += this.speed * deltaTime;
  }

  draw() {
    ctx.drawImage(hpImg, this.x, this.y, this.width, this.height);
  }
}

// Отрисовка иконок патронов (патроны, здоровье, очки) 
function drawAmmoBar() {
  if (isCutscene || isGameOver) return;

  const iconWidth = 20;
  const iconHeight = 20;
  const spacing = 5;
  const startX = 10;
  const startY = canvas.height - iconHeight - 10;

  for (let i = 0; i < maxBullets; i++) {
    const posX = startX + i * (iconWidth + spacing);
    if (i < currentAmmo) {
      ctx.drawImage(powerUpImg, posX, startY, iconWidth, iconHeight);
    } else {
      ctx.globalAlpha = 0.3;
      ctx.drawImage(powerUpImg, posX, startY, iconWidth, iconHeight);
      ctx.globalAlpha = 1;
    }
  }

  ctx.fillStyle = '#FFF';
  ctx.font = '10px "Press Start 2P"';
  ctx.textBaseline = 'top';
  if (isReloading) {
    ctx.fillText('Recharge', startX + maxBullets * (iconWidth + spacing) + 10, startY + iconHeight - 5);
  } else {
    ctx.fillText('Battery charge' + currentAmmo + '/' + maxBullets, startX + maxBullets * (iconWidth + spacing) + 10, startY + iconHeight - 5);
  }
}

function drawScore() {
  if (isCutscene || isGameOver) return;

  const iconSize = 15;
  ctx.drawImage(coinImg, 15, 35, iconSize, iconSize);
  const boxWidth = 200, boxHeight = 20;
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(10, 10, boxWidth, boxHeight);
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(40, 35, boxWidth, boxHeight);
  ctx.fillStyle = "#FA8B0C";
  ctx.font = '10px "Press Start 2P"';
  ctx.textBaseline = 'top';
  ctx.fillText("" + score, 70, 40);
}

function drawHealthBar() {
  if (isCutscene || isGameOver) return;

  const barWidth = 200;
  const barHeight = 20;
  const startX = 10, startY = 10;
  const heartSize = 24;
  ctx.drawImage(heartImg, startX, startY - 2, heartSize, heartSize);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(startX + heartSize + 5, startY, barWidth, barHeight);
  const healthPercentage = player.health / 50;
  ctx.fillStyle = healthPercentage > 0.3 ? "green" : "red";
  ctx.fillRect(startX + heartSize + 5, startY, barWidth * healthPercentage, barHeight);
}


//таймер для щита и пули
function drawEffectTimers() {
  const now = performance.now();
  const barX = 130; 
  const width = 200;
  const height = 12;

  // Суперпуля
  if (player.isSuperBulletActive()) {
    const remaining = Math.max(0, player.superBulletDuration - (now - player.superBulletStartTime));
    const percent = remaining / player.superBulletDuration;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, 65, width, height);
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(barX, 65, width * percent, height);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(barX, 65, width, height);

    ctx.fillStyle = '#00FFFF';
    ctx.font = '10px "Press Start 2P"';
    ctx.textBaseline = 'top';
    ctx.fillText('SUPER BULLET', 10, 63);
  }

  // Щит
  if (player.isShielded) {
    const remaining = Math.max(0, player.shieldDuration - (now - player.shieldStartTime));
    const percent = remaining / player.shieldDuration;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, 82, width, height);
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.fillRect(barX, 82, width * percent, height);
    ctx.strokeStyle = '#FFF';
    ctx.strokeRect(barX, 82, width, height);

    ctx.fillStyle = '#FFD700';
    ctx.font = '10px "Press Start 2P"';
    ctx.textBaseline = 'top';
    ctx.fillText('SHIELD', 10, 80); 
  }
}

//функция стрельбы
function shoot() {
  if (!playerCanShoot) return;

  const isSuper = player.isSuperBulletActive();

  if (!isSuper) {
    if (isReloading) return;
    if (currentAmmo <= 0) {
      isReloading = true;
      reloadStartTime = performance.now();
      return;
    }
  }

  const bullet = isSuper
    ? new SuperBullet(player.x + 22.5, player.y)
    : new Bullet(player.x + 22.5, player.y, 'player');

  bullets.push(bullet);
  playerCanShoot = false;

  if (isSuper) {
    superBulletSound.play();
  } else {
    currentAmmo--;
    shootSound.play();
  }

  setTimeout(() => playerCanShoot = true, playerFireRate);

  if (!isSuper && currentAmmo <= 0) {
    isReloading = true;
    reloadStartTime = performance.now();
  }
}

// Спавн врагов
function spawnEnemies() {
  let now = performance.now();
  if (now - lastSpawnTime > spawnInterval) {
    let x = Math.random() * (canvas.width - 50);
    let rand = Math.random();
    let enemyType;

    if (rand < 0.4) {
      enemyType = Enemy;
    } else if (rand < 0.6) {
      enemyType = Enemy2;
    } else if (level >= 2 && rand < 0.7) { // Броневраг появляется только со 2 уровня
      enemyType = ArmoredEnemy;
    } else if (level >= 3 && rand < 0.8) { // Уклоняющийся враг появляется только с 3 уровня
      enemyType = DodgingEnemy;
    } else if (level >= 4) { // Телепортирующийся враг появляется только с 4 уровня
      enemyType = TeleportingEnemy;
    } else {
      enemyType = Enemy; // По умолчанию спавним обычного врага
    }
    enemies.push(new enemyType(x, 0));
    lastSpawnTime = now;
  }
}

// Функция спавна босса
function spawnBoss() {
  if (!bossSpawned) {
    bossSpawned = true;
    bosses.push(new Boss(canvas.width / 2 - 50, 50, level * 10, level));
    console.log("Boss spawned on level", level);
  }
}

// Проверка столкновений
function checkCollisions() {
  enemyBullets.forEach((bullet, index) => {
    if (
      bullet.x < player.x + player.width &&
      bullet.x + bullet.width > player.x &&
      bullet.y < player.y + player.height &&
      bullet.y + bullet.height > player.y
    ) {
      player.takeDamage();
      enemyBullets.splice(index, 1);
    }
  });

  // Проверка столкновений пуль игрока с врагами
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (
        bullet.type === 'player' &&
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        if (isUltaActive) {
          enemy.health -= SUPER_BULLET_DAMAGE;
        } else {
          enemy.health--;
          bullets.splice(bIndex, 1);
        }

        if (!isUltaActive || enemy.health > 0) {
          bullets.splice(bIndex, 1);
        }

        enemy.hitEffect = 5;

        if (enemy.health <= 0) {
          explosions.push(new Explosion(enemy.x, enemy.y));

          if (Math.random() < 0.30) powerUps.push(new HealthPowerUp(enemy.x, enemy.y));
          if (Math.random() < 0.20) powerUps.push(new ShieldPowerUp(enemy.x, enemy.y));
          if (score >= 150 && Math.random() < 0.20) powerUps.push(new SuperBulletPowerUp(enemy.x, enemy.y));

          enemies.splice(eIndex, 1);
          score += 10;
          totalEnemiesKilled++;
          explosionSound.play();
        }
      }
    });
  });

  //скрипт для появления босса на уровнях
  bosses.forEach((boss, bossIndex) => {
    bullets.forEach((bullet, bulletIndex) => {
      if (
        bullet.type === 'player' &&
        bullet.x < boss.x + boss.width &&
        bullet.x + bullet.width > boss.x &&
        bullet.y < boss.y + boss.height &&
        bullet.y + bullet.height > boss.y
      ) {

        if (isUltaActive) {
          boss.health -= SUPER_BULLET_BOSS_DAMAGE;
        } else {
          boss.health--;
          bullets.splice(bulletIndex, 1);
        }

        if (!isUltaActive || boss.health > 0) {
          bullets.splice(bulletIndex, 1);
        }

        boss.hitEffect = 5;

        if (boss.health <= 0) {
          explosions.push(new Explosion(boss.x, boss.y));
          bosses.splice(bossIndex, 1);
          score += bossImgs[boss.level - 1].xp;
          explosionSound.play();
          nextLevel();
        }
      }
    });
  });

  // Подбор power-ups
  powerUps.forEach((powerUp, index) => {
    if (
      powerUp.x < player.x + player.width &&
      powerUp.x + powerUp.width > player.x &&
      powerUp.y < player.y + player.height &&
      powerUp.y + powerUp.height > player.y
    ) {
      powerUps.splice(index, 1);

      if (powerUp instanceof ShieldPowerUp) {
        powerUp.activate();
      } else if (powerUp instanceof SuperBulletPowerUp) {
        powerUp.activate(); 
      } else {
        player.health = Math.min(player.health + 1, 50); 
        hpSound.play();
      }
    }
  });

  // Пули по разрушаемым объектам
  bullets.forEach((bullet, bIndex) => {
    destructibleObjects.forEach((obj, oIndex) => {
      if (
        bullet.x < obj.x + obj.width &&
        bullet.x + bullet.width > obj.x &&
        bullet.y < obj.y + obj.height &&
        bullet.y + bullet.height > obj.y
      ) {
        obj.health--;
        bullets.splice(bIndex, 1);
        if (obj.health <= 0) {
          destructibleObjects.splice(oIndex, 1);
          score += 5;
        }
      }
    });
  });

  // Столкновение игрока с астероидами
  destructibleObjects.forEach((obj, index) => {
    if (
      obj.x < player.x + player.width &&
      obj.x + obj.width > player.x &&
      obj.y < player.y + player.height &&
      obj.y + obj.height > player.y
    ) {
      explosions.push(new Explosion(obj.x, obj.y));
      destructibleObjects.splice(index, 1);
      player.takeDamage();
    }
  });

  // Столкновение игрока с врагами
  enemies.forEach((enemy, index) => {
    if (
      enemy.x < player.x + player.width &&
      enemy.x + enemy.width > player.x &&
      enemy.y < player.y + player.height &&
      enemy.y + enemy.height > player.y
    ) {
      explosions.push(new Explosion(enemy.x, enemy.y));
      enemies.splice(index, 1);
      player.takeDamage();
    }
  });
}

//кац сцена
function showFinalCutscene() {
  isGameOver = true;
  isPaused = true;
  isCutscene = true;

  backgroundMusic.pause();

  cutsceneMusic.currentTime = 0;
  cutsceneMusic.play().catch(console.error);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const drawCutsceneAndStats = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(cutsceneImg, 0, 0, canvas.width, canvas.height);
    drawStats();
  };

  if (cutsceneImg.complete) {
    drawCutsceneAndStats();
  } else {
    cutsceneImg.onload = () => {
      drawCutsceneAndStats();
    };
  }

  cutsceneTimeoutId = setTimeout(() => {
    cutsceneMusic.pause();
    cutsceneMusic.currentTime = 0;

    menu.style.display = 'block';
    canvas.style.display = 'none';
    restartButton.style.display = 'none';
    mainMenuButton.style.display = 'inline-block';
    continueButton.style.display = 'none';
    startButton.style.display = 'none';
    nastrButton.style.display = 'inline-block';

    isCutscene = false;
  }, 5000);
}


// Функция рисования статистики
function drawStats() {
  ctx.font = '20px "Press Start 2P"';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFF';
  ctx.strokeStyle = '#FFF';
  ctx.lineWidth = 2;

  const padding = 10;
  const statsX = 100;
  const statsY = 250;
  const lineHeight = 50;
  const scoreText = 'Score: ' + score;
  const killedText = 'Enemies killed: ' + totalEnemiesKilled;
  const scoreWidth = ctx.measureText(scoreText).width;
  const killedWidth = ctx.measureText(killedText).width;
  const scoreHeight = 24;

  ctx.strokeRect(statsX - padding, statsY - padding, scoreWidth + padding * 2, scoreHeight + padding * 2);
  ctx.fillText(scoreText, statsX, statsY);

  ctx.strokeRect(statsX - padding, statsY + lineHeight - padding, killedWidth + padding * 2, scoreHeight + padding * 2);
  ctx.fillText(killedText, statsX, statsY + lineHeight);
}

// Функция перехода на следующий уровень
function nextLevel() {
  level++;
  bossSpawned = false;
  enemySpeed += 20;
  bossSpeed += 10;
  spawnInterval = Math.max(100, spawnInterval - 100);
  score += 100;

  playerHealth = Math.min(playerHealth + 10, 50);

  if (level > 5) {
    // Если уровень больше 5 показывает сцену
    showFinalCutscene();
    return;
  }

  switch (level) {
    case 2:
      backgroundImage.src = 'resources/images/level2-bg.png';
      enemySpeed += 10;
      break;
    case 3:
      backgroundImage.src = 'resources/images/level3-bg.png';
      enemySpeed += 15;
      bossSpeed += 5;
      break;
    case 4:
      backgroundImage.src = 'resources/images/level4-bg.png';
      spawnInterval = Math.max(100, spawnInterval - 200);
      break;
    case 5:
      backgroundImage.src = 'resources/images/level5-bg.png';
      bossSpeed += 15;
      break;
  }

  levelNotification = "Level " + level + " Start!";
  notificationStartTime = performance.now();
}

// Проверка перехода на новый уровень
function checkLevelProgress() {
  if (!bossSpawned) {
    if (level === 1 && score >= 1000) {
      spawnBoss();
    } else if (level === 2 && score >= 2500) {
      spawnBoss();
    } else if (level === 3 && score >= 3500) {
      spawnBoss();
    } else if (level === 4 && score >= 4500) {
      spawnBoss();
    } else if (level === 5 && score >= 5500) {
      spawnBoss();
    }
  }

  function bossIsDead() {

    return bosses.every(boss => boss.health <= 0);
  }

  if (bossSpawned && bossIsDead()) {
    nextLevel();
  }
}

// Функция отображения уровня
function displayLevelInfo() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(10, 60, 200, 30);
  ctx.fillStyle = '#FFD700';
  ctx.font = '10px "Press Start 2P"';
  ctx.textBaseline = 'top';
  ctx.fillText('Level: ' + level, 20, 65);
}

// Фуенкция отрисовки визуальноого уведомление
function drawLevelNotification() {
  if (!levelNotification) return;

  const now = performance.now();
  if (now - notificationStartTime < notificationDuration) {
    ctx.save(); 

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
    ctx.fillStyle = '#FFD700';
    ctx.font = '25px "Press Start 2P"';
    ctx.textBaseline = 'top';
    ctx.textAlign = "center"; 
    ctx.fillText(levelNotification, canvas.width / 2, canvas.height / 2 + 10);

    ctx.restore(); 
  } else {
    levelNotification = "";
  }
}

// Основной игровой цикл
function gameLoop(timestamp) {
  if (isPaused || isGameOver || isCutscene) return;
  if (player.dead) {
    showGameOverScreen();
    return;
  }

  let deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (isUltaActive && performance.now() > ultaEndTime) {
    isUltaActive = false;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Отрисовываем фон
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);;

  // 2. Обновляем и отрисовываем игрока
  player.update(deltaTime);
  player.draw();

  // 3. Обновляем и отрисовываем пули игрока
  bullets.forEach(bullet => bullet.update(deltaTime));
  bullets.forEach(bullet => bullet.draw());
  bullets = bullets.filter(bullet => !bullet.isOutOfBounds());

  // 4. Обновляем и отрисовываем пули врагов
  enemyBullets.forEach(bullet => bullet.update(deltaTime));
  enemyBullets.forEach(bullet => bullet.draw());
  enemyBullets = enemyBullets.filter(bullet => !bullet.isOutOfBounds());

  // 5. Обновляем и отрисовываем разрушаемые объекты
  destructibleObjects.forEach(obj => obj.update(deltaTime));
  destructibleObjects.forEach(obj => obj.draw());

  // 6. Спавним и отрисовываем врагов
  spawnEnemies();
  enemies.forEach(enemy => {
    enemy.update(deltaTime);
    enemy.draw();
  });

  // 7. Проверяем условие спавна босса и отрисовываем его
  checkLevelProgress();
  bosses.forEach(boss => {
    boss.update(deltaTime);
    boss.draw();
    boss.shoot(); 
  });

  // 8. Обновляем и отрисовываем power-ups
  powerUps.forEach(powerUp => {
    powerUp.update(deltaTime);
    powerUp.draw();
  });

  // 9. Проверяем столкновения
  checkCollisions();

  // 10. Обновляем и отрисовываем взрывы
  explosions.forEach((explosion, index) => {
    explosion.draw();
    if (explosion.isDone()) {
      explosions.splice(index, 1);
    }
  });

  // 11. Обработка перезарядки
  if (isReloading && (performance.now() - reloadStartTime >= reloadTime)) {
    currentAmmo = maxBullets;
    isReloading = false;
    powerUpSound.play();
  }

  // 12. Отрисовка уведомления уровня, счета, здоровья и патронов
  drawLevelNotification();
  drawScore();
  drawEffectTimers();
  drawHealthBar();
  drawAmmoBar();



  // 13. Обработка периодического выстрела врагов (если требуется)
  let now = performance.now();
  if (now - lastEnemyShotTime > enemyFireRate) {
    enemies.forEach(enemy => enemy.shoot());
    bosses.forEach(boss => boss.shoot());
    lastEnemyShotTime = now;
  }

  if (!isPaused) {
    requestAnimationFrame(gameLoop);
  }
}

function resetGame() {
  score = 0;
  level = 1;
  isGameOver = false;
  isReloading = false;
  bossSpawned = false;
  isUltaActive = false;
  ultaEndTime = 0;
  totalEnemiesKilled = 0;
  isPaused = false;
  levelNotification = "";

  if (difficultySettings[difficulty]) {
    const s = difficultySettings[difficulty];
    enemySpeed = s.enemySpeed;
    bossSpeed = s.bossSpeed;
    player.health = s.playerHealth;
    enemyDamage = s.enemyDamage;
    enemySpawnRate = s.spawnRate;
  } 
  else {
    enemySpeed = 100;
    bossSpeed = 50;
    player.health = 50;
    enemyDamage = 10;
    enemySpawnRate = 1.5;
  }

  player.x = 375;
  player.y = 550;
  player.dead = false;
  player.isShielded = false;
  player.superBulletStartTime = 0;

  bullets = [];
  enemyBullets = [];
  asteroids = [];
  enemies = [];
  bosses = [];
  powerUps = [];
  explosions = [];
  destructibleObjects = [];

  backgroundImage.src = 'resources/images/level1-bg.png';

  startButton.style.display = 'inline-block';
  continueButton.style.display = 'none';
  restartButton.style.display = 'none';
  mainMenuButton.style.display = 'none';
  nastrButton.style.display = 'inline-block';

}

// Функция показа экрана Game Over и возврата в меню
function showGameOver() {
  isGameOver = true;
  destructibleObjects = [];

  ctx.drawImage(gameOverImg, 0, 0, canvas.width, canvas.height);

  ctx.font = '20px "Press Start 2P"';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#FFF';
  ctx.strokeStyle = '#FFF'; 
  ctx.lineWidth = 2;

  const padding = 10;
  const statsX = 100;
  const statsY = 250;
  const lineHeight = 50;

  // Score
  const scoreText = 'Score: ' + score;
  const scoreWidth = ctx.measureText(scoreText).width;
  const scoreHeight = 24; 
  ctx.strokeRect(statsX - padding, statsY - padding, scoreWidth + padding * 2, scoreHeight + padding * 2);
  ctx.fillText(scoreText, statsX, statsY);

  // Enemies killed
  const killedText = 'Enemies killed: ' + totalEnemiesKilled;
  const killedWidth = ctx.measureText(killedText).width;
  ctx.strokeRect(statsX - padding, statsY + lineHeight - padding, killedWidth + padding * 2, scoreHeight + padding * 2);
  ctx.fillText(killedText, statsX, statsY + lineHeight);

  setTimeout(() => {
    menu.style.display = 'block';
    canvas.style.display = 'none';
    restartButton.style.display = 'inline-block';
    mainMenuButton.style.display = 'inline-block';
    continueButton.style.display = 'none';
    startButton.style.display = 'none';
    nastrButton.style.display = 'inline-block';

  }, 3000);
}

requestAnimationFrame(gameLoop);

// Функция пуза
function pauseGame() {
  isPaused = true;

  menu.style.display = 'block';
  canvas.style.display = 'none';

  startButton.style.display = 'none';
  continueButton.style.display = 'inline-block';
  restartButton.style.display = 'none';
  mainMenuButton.style.display = 'inline-block';
  nastrButton.style.display = 'inline-block';
}

//вовзрат в меню
function returnToMenu() {

  if (cutsceneTimeoutId) {
    clearTimeout(cutsceneTimeoutId);
    cutsceneTimeoutId = null;
  }

  if (cutsceneMusic) {
    cutsceneMusic.pause();
    cutsceneMusic.currentTime = 0;
  }

  resetGame(); 

  menu.style.display = 'block';
  canvas.style.display = 'none';

  restartButton.style.display = 'none';
  mainMenuButton.style.display = 'none';
  continueButton.style.display = 'none';
  startButton.style.display = 'inline-block';
  nastrButton.style.display = 'inline-block';

  isCutscene = false;
  isGameOver = false;
  isPaused = false;
}

//Управление
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') keys.left = true;
  if (event.key === 'ArrowRight') keys.right = true;
  if (event.key === 'ArrowUp') keys.up = true;
  if (event.key === 'ArrowDown') keys.down = true;
  if (event.key === ' ' && playerCanShoot) {
    shoot();
  }

});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft') keys.left = false;
  if (event.key === 'ArrowRight') keys.right = false;
  if (event.key === 'ArrowUp') keys.up = false;
  if (event.key === 'ArrowDown') keys.down = false;
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !isGameOver && isGameStarted) {
    pauseGame();
  }
});
