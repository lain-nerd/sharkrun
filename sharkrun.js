function loadImage(url, callback) {
  const image = new Image()
  image.onload = callback
  image.src = url
}

function randomChoice(arr) {
  return arr[Math.floor(arr.length * Math.random())];
}

let sprites = {}

function loadSprites(spriteList, callback) {
  let count = 0
  Object.keys(spriteList).forEach(key => {
    loadImage(spriteList[key], function(img) {
      sprites[key] = this
      count++
      if (count == Object.keys(spriteList).length) {
        callback()
      }
    })
  })
}

const screenWidth = 1000
const screenHeight = 600
const sharkHeight = 113
const sharkWidth = 100
const sharkStartSpeed = 15
const speedIncrementor = 0.2
const jumpSpeed = 12
const defaultGravity = 50
const maxHeightAbovePreviousPlatform = 200
const minimumPlatformWidth = 100
const maximumPlatformWidth = 800
const sharkLeftPosition = 100
const dashSpeedIncrease = 5
const maxStimCount = 10
const startingStims = 3
const stimRadius = 15
const platformHeight = 20
const maxDashTime = 0.3
const maxDistanceToTopOfScreen = 200
const chanceOfStim = 0.1
const maxDistanceBetweenPlatforms = 500
const minDistanceBetweenPlatforms = sharkWidth

const context = document.getElementById('game').getContext('2d')
context.imageSmoothingQuality = 'high'

let Game = function() {
  let sharkVPos,sharkHPos,sharkVSpeed,sharkHSpeed,gravity,score,stimCount,world,jumpCount,dashTime,jumpTime,jumping,newRecord,bestScore,cooldown=0

  this.init = function() {
    sharkVPos = screenHeight/2
    sharkHPos = 0
    sharkVSpeed = 0
    sharkHSpeed = sharkStartSpeed
    gravity = defaultGravity
    score = 0
    stimCount = startingStims
    world = [{
      posX: -50,
      posY: 100,
      width: 2000,
      color: 'white',
      hasStim: true
    }]
    jumpCount = 0
    dashTime = 0
    jumpTime = 0
    jumping = false
    bestScore = window.localStorage.getItem('best-score')
    if (bestScore === null) {
      bestScore = 0
    }
    newRecord=false
  }

  this.init()

  this.jump = function() {
    if (jumpCount >= 2 || this.dashTime > 0) {
      return
    }
    sharkVSpeed = jumpSpeed
    jumping = true;
    jumpTime = 0;
    jumpCount++
  }

  this.dash = function() {
    if (stimCount <= 0 || dashTime > 0) {
      return
    }
    jumpCount = 0
    sharkHSpeed += dashSpeedIncrease
    sharkVSpeed = 0 // shark stops moving up or down when dashing
    gravity = 0
    dashTime = maxDashTime
    stimCount--
  }

  this.gameState = 'start'

  this.generateWorld = function() {
    let rightMost = sharkHPos
    let lastPosY = 0
    world.forEach((platform, index) => {
      if (platform.posX + platform.width+sharkLeftPosition < sharkHPos) {
        world.splice(index, 1)
      }
      if (rightMost < platform.posX + platform.width) {
        rightMost = platform.posX + platform.width
      }
      lastPosY = platform.posY
    })
    if (lastPosY > screenHeight - (maxDistanceToTopOfScreen+maxHeightAbovePreviousPlatform)) {
      lastPosY = screenHeight - (maxDistanceToTopOfScreen+maxHeightAbovePreviousPlatform)
    }
    if (rightMost - sharkHPos < screenWidth * 2) {
      world.push({
        posX: rightMost + Math.random()*maxDistanceBetweenPlatforms + minDistanceBetweenPlatforms,
        posY: Math.random() * (lastPosY+maxHeightAbovePreviousPlatform) + platformHeight,
        width: Math.random() * (maximumPlatformWidth - minimumPlatformWidth) + minimumPlatformWidth,
        color: randomChoice(['white', 'yellow', 'purple', 'red']),
        hasStim: Math.random() > (1 - chanceOfStim)
      })
    }
  }

  this.dead = function() {
    this.gameState = 'end'
    bestScore = window.localStorage.getItem('best-score')
    if (score > bestScore) {
      window.localStorage.setItem('best-score', score)
    }
    cooldown = 1.5
  }

  this.update = function(dt) {
    if (this.gameState != 'playing') {
      cooldown -= dt
      return
    }
    const prevSharkVPos = sharkVPos
    score += Math.floor(dt * 100)
    if (dashTime > 0) {
      dashTime -= dt
      if (dashTime <= 0) {
        dashTime = 0
        gravity = defaultGravity
        sharkHSpeed -= dashSpeedIncrease
      }
    }
    sharkVSpeed -= dt * gravity
    sharkVPos += sharkVSpeed
    if (sharkVPos < -200) {
      this.dead()
      return
    }
    if (jumping) {
      jumpTime+=dt
      if (jumpTime < 0.3) {
        sharkVSpeed = jumpSpeed
      }
    }
    sharkHPos += sharkHSpeed
    sharkHSpeed += speedIncrementor * dt
    this.generateWorld()

    world.forEach(platform => {
      //shark is within the platform
      //only handle platform collisions if we are moving down:
      if (sharkVSpeed < 0 && prevSharkVPos >= platform.posY) {
        if (sharkHPos+sharkWidth > platform.posX && sharkHPos < platform.posX+platform.width) {
          if (sharkVPos < platform.posY) {
            sharkVPos = platform.posY
            jumpCount = 0
            sharkVSpeed = 0
          }
        }
      }
      if (platform.hasStim) {
        stimX = platform.posX + platform.width/2
        stimY = platform.posY + stimRadius
        if (
          sharkHPos+sharkWidth > stimX-stimRadius &&
          sharkHPos < stimX+stimRadius &&
          sharkVPos < stimY+stimRadius &&
          sharkVPos+sharkHeight > stimY-stimRadius &&
          stimCount < maxStimCount
        ) {
          platform.hasStim = false
          stimCount++
        }
      }
    })
  
  }

  this.render = function() {
    if (this.gameState == 'start') {
      cooldown--
      context.drawImage(sprites['start'], 0, 0)
      context.font = "30px Arial"
      context.fillStyle = 'yellow'
      context.textAlign="left"; 
      context.fillText('Z - jump',50,300)
      context.fillText('X - use crystal',50,350)
      return
    }
    if (this.gameState == 'end') {
      context.clearRect(0,0,screenWidth,screenHeight)
      context.font = "60px Arial"
      context.fillStyle = 'white'
      context.textAlign="center"; 
      context.fillText('GAME OVER',screenWidth/2,200)
      context.fillText('YOUR SCORE: '+score,screenWidth/2,300)
      if (score >= bestScore) {
        context.fillText('NEW PERSONAL BEST!!',screenWidth/2,400)
      } else {
        context.fillText('PREVIOUS BEST: '+bestScore,screenWidth/2,400)
      }
      return
    }
    for (let i=0; i<2; i++) {
      const x = (-sharkHPos % 1000) + 1000*i
      context.drawImage(sprites['bg'], x, 0)
    }
    world.forEach(platform => {
      screenX = platform.posX - sharkHPos + sharkWidth
      context.fillStyle = platform.color
      context.fillRect(screenX, screenHeight-platform.posY, platform.width, 20)
      if (platform.hasStim) {
        context.beginPath()
        context.arc(screenX + platform.width / 2, screenHeight-platform.posY-15, 15, 0, 2 * Math.PI, false)
        context.fillStyle = 'white'
        context.fill()
        context.lineWidth = 1
        context.strokeStyle = 'yellow'
        context.stroke()
      }
    })
    if (dashTime > 0) {
      for (i=0; i<100; i+=3) {
        context.drawImage(sprites['shark'], i, screenHeight-sharkVPos-sharkHeight)
      }
    }
    context.drawImage(sprites['shark'], 100, screenHeight-sharkVPos-sharkHeight)
    context.font = "30px Arial"
    context.fillStyle = 'white'
    context.textAlign='start';
    context.fillText('SCORE: '+score,10,30)
    context.fillText('CRYSTALS: '+stimCount,10,60)

    context.font = "20px Arial"
    context.textAlign="end";
    context.fillText('PREVIOUS BEST: '+bestScore,screenWidth-20,20) 
  }

  this.keyDown = function(keyCode) {
    if (this.gameState == 'start') {
      this.gameState = 'playing'
      return
    }
    if (this.gameState == 'end' && cooldown <= 0) {
      this.init()
      this.gameState = 'start'
      return
    }
    if (keyCode == 90) { //z
      this.jump()
    }
    if (keyCode == 88) { //x
      this.dash()
    }
  }
  this.keyUp = function(keyCode) {
    if (keyCode == 90) { //z
      jumping = false
    }
  }
}

let game = new Game()

let lastTime;
let loop = function(now) {
  window.requestAnimationFrame(loop)
  if(!lastTime){ lastTime=now; return }
  let dt=(now - lastTime)/1000
  if (dt > 0.1) {
    dt = 0.1
  }
  lastTime = now
  game.update(dt)
  game.render()
}

window.addEventListener('keydown', function(event) {
  if (event.repeat) return
  game.keyDown(event.keyCode);
});

window.addEventListener('keyup', function(event) {
  game.keyUp(event.keyCode);
});

loadSprites({
  'shark': './sharkynobg.png',
  'bg': './background.jpg',
  'start': './start.png'
}, () => {
  window.requestAnimationFrame(loop)
})