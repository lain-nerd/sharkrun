function loadImage(url, callback) {
  const image = new Image()
  image.onload = callback
  image.src = url
}

function randomChoice(arr) {
  return arr[Math.floor(arr.length * Math.random())]
}

function isMobileDevice() {
  return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1)
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
const landingGrace = 20 //extra width for sharky's front to land on things
const jumpSpeed = 12
const defaultGravity = 50
const maxHeightAbovePreviousPlatform = 200
const minimumPlatformWidth = 100
const maximumPlatformWidth = 800
const sharkLeftPosition = 100
const dashSpeedIncrease = 5
const maxStimCount = 10
const startingStims = 3
//const stimRadius = 15
const platformHeight = 20
const maxDashTime = 0.3
const maxDistanceToTopOfScreen = 200
const chanceOfStim = 0.1
const maxDistanceBetweenPlatforms = 500
const minDistanceBetweenPlatforms = sharkWidth

const canvas = document.getElementById('game')
const context = canvas.getContext('2d')
context.imageSmoothingQuality = 'high'

let Game = function() {
  let sharkVPos,sharkHPos,sharkVSpeed,sharkHSpeed,gravity,score,stimCount,world,jumpCount,dashTime,jumpTime,jumping,newRecord,bestScore,cooldown=0
  let lastScene=null

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
      hasStim: true,
      stimSprite: sprites['ice2']
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
    jumping = true
    jumpTime = 0
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

  this.gameState = gameOptions.fullScreen ? 'prestart' : 'start'  //adds an extra touch before starting the game, so it goes full screen on first touch

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
        hasStim: Math.random() > (1 - chanceOfStim),
        stimSprite: sprites['ice'+Math.floor(Math.random() * 6)]
      })
    }
  }

  this.dead = function() {
    lastScene = context.getImageData(0,0,screenWidth,screenHeight)
    this.gameState = 'end'
    bestScore = window.localStorage.getItem('best-score')
    if (score > bestScore) {
      window.localStorage.setItem('best-score', score)
    }
    cooldown = 1
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
        if (sharkHPos+sharkWidth+landingGrace > platform.posX && sharkHPos < platform.posX+platform.width) {
          if (sharkVPos < platform.posY) {
            sharkVPos = platform.posY
            jumpCount = 0
            sharkVSpeed = 0
          }
        }
      }
      if (platform.hasStim) {
        const sprite = platform.stimSprite
        stimX = platform.posX + platform.width/2 - sprite.width/2
        stimY = platform.posY
        if (
          sharkHPos+sharkWidth > stimX &&
          sharkHPos < stimX+sprite.width &&
          sharkVPos < stimY + sprite.height &&
          sharkVPos+sharkHeight >= stimY &&
          stimCount < maxStimCount
        ) {
          platform.hasStim = false
          stimCount++
          score += 100
        }
      }
    })
  
  }

  this.render = function() {
    if (this.gameState == 'start' || this.gameState == 'prestart') {
      context.drawImage(sprites['start'], 0, 0)
      context.font = "30px Arial"
      context.fillStyle = 'yellow'
      context.textAlign="left"
      
      if (gameOptions.showTouchControls) {
        context.fillText('Touch right side - jump',50,300)
        context.fillText('Touch left side - use crystal',50,350)
        context.fillText('Touch to begin',50,450)
      } else {
        context.fillText('Z - jump',50,300)
        context.fillText('X - use crystal',50,350)
        context.fillText('Press Z or X to start',50,450)
      }
      return
    }
    if (this.gameState == 'end') {
      if (lastScene !== null) {
        context.putImageData(lastScene, 0,0)
        let alpha = 1-cooldown
        if (alpha > 0.9) {
          alpha = 0.9
        }
        context.fillStyle = 'rgba(0,0,0,' + alpha + ')'
        context.fillRect(0, 0, screenWidth, screenHeight)
      } else {
        context.clearRect(0,0,screenWidth,screenHeight)
      }
      context.font = "80px Arial"
      context.fillStyle = 'white'
      context.textAlign="center"
      context.fillText('GAME OVER', screenWidth/2,150)
      context.font = "60px Arial"
      context.fillText('YOU SCORED', screenWidth/2,250)
      context.font = "80px Arial"
      context.fillStyle = 'yellow'
      context.fillText(score, screenWidth/2,350)
      context.font = "60px Arial"
      context.fillStyle = 'white'
      if (score >= bestScore) {
        context.fillText('NEW PERSONAL BEST!!', screenWidth/2,500)
      } else {
        context.fillText('PREVIOUS BEST: '+ bestScore, screenWidth/2,500)
      }
      return
    }
    for (let i=0; i<2; i++) {
      const x = (-sharkHPos*0.5 % sprites['bg'].width) + sprites['bg'].width*i
      context.drawImage(sprites['bg'], x, 0)
    }
    world.forEach(platform => {
      screenX = platform.posX - sharkHPos + sharkWidth
      context.fillStyle = platform.color
      context.fillRect(screenX, screenHeight-platform.posY, platform.width, 20)
      if (platform.hasStim) {
        const sprite = platform.stimSprite
        context.drawImage(sprite, screenX + platform.width / 2 - sprite.width/2, screenHeight-platform.posY-sprite.height)
      }
    })
    if (dashTime > 0) {
      for (let i=0; i<100; i+=3) {
        context.drawImage(sprites['shark'], i, screenHeight-sharkVPos-sharkHeight)
      }
    }
    context.drawImage(sprites['shark'], 100, screenHeight-sharkVPos-sharkHeight)
    context.font = "40px Arial"
    context.fillStyle = 'white'
    context.textAlign='start'
    context.fillText(score, 10, 35)

    for (let i=0; i<stimCount; i++) {
      context.drawImage(sprites['iceSymbol'], 10+35*i, 40)
    }

    context.font = "20px Arial"
    context.textAlign="end"
    context.fillText('BEST: '+bestScore, screenWidth-10,20) 
  }

  this.action = function(action) {
    if ((this.gameState == 'prestart' || this.gameState == 'end') && cooldown <= 0) {
      this.init()
      this.gameState = 'start'
      return
    }

    if (action !== '' && this.gameState == 'start') {
      this.gameState = 'playing'
      return
    }

    if (action == 'jump') { //z
      this.jump()
      return
    }
    if (action == 'dash') { //x
      this.dash()
      return
    }
  }
  this.endAction = function(action) {
    if (action == 'jump') { //z
      jumping = false
    }
  }

}
function startGame() {
  let game = new Game()

  let lastTime
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
  window.requestAnimationFrame(loop)

  window.addEventListener('keydown', function(event) {
    if (event.repeat) return
    let action = ''
    if (event.keyCode == 90) { //z
      action = 'jump'
    }
    if (event.keyCode == 88) { //x
      action = 'dash'
    }
    game.action(action)
    return false
  })

  window.addEventListener('keyup', function(event) {
    game.endAction(event.keyCode == 90 ? 'jump' : '')
  })

  const actionFromCanvasLocation = (x, y) => x < canvas.clientWidth / 2 ? 'dash' : 'jump'

  canvas.addEventListener('touchstart', function(event) {
    for(let i=0;i<event.changedTouches.length;i++) {
      game.action(actionFromCanvasLocation(event.changedTouches[i].clientX, event.changedTouches[i].clientY))
    }
    
    return false
  })

  canvas.addEventListener('touchend', function(event) {
    for(let i=0;i<event.changedTouches.length;i++) {
      game.endAction(actionFromCanvasLocation(event.changedTouches[i].clientX, event.changedTouches[i].clientY))
    }

    return false
  })

  if (gameOptions.fullScreen) {
    canvas.addEventListener('click', function makeFS(event) {
      if (screenfull.enabled)
        screenfull.request(document.getElementById('gameArea'))
      canvas.removeEventListener('click', makeFS)
    })
  }
}


loadSprites({
  'shark': './sharkynobg.png',
  'bg': './background.jpg',
  'start': './start.png',
  'ice0': 'crystals/ice_1.png',
  'ice1': 'crystals/ice_2.png',
  'ice2': 'crystals/ice_3.png',
  'ice3': 'crystals/ice_4.png',
  'ice4': 'crystals/ice_5.png',
  'ice5': 'crystals/ice_6.png',
  'iceSymbol': 'crystals/symbol.png'
}, () => {
  startGame()
});