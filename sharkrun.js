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

function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
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

const GAMESTATE = Object.freeze({
  prestart: Symbol(),
  start:    Symbol(),
  playing:  Symbol(),
  end:      Symbol(),
})

const ACTION = Object.freeze({
  none: Symbol(),
  jump: Symbol(),
  dash: Symbol()
})

const screenWidth = 1000
const screenHeight = 600
const sharkHeight = 113
const sharkWidth = 100
const sharkStartSpeed = 15
const speedIncrementor = 0.2
const landingGrace = 20 //extra width for sharky's front to land on things
const jumpSpeed = 12
const gravity = 50
const maxHeightAbovePreviousPlatform = 200
const minimumPlatformWidth = 100
const maximumPlatformWidth = 800
const sharkLeftPosition = 100
const dashSpeedIncrease = 5
const maxStimCount = 10
const startingStims = 3
const platformHeight = 20
const maxDashTime = 0.3
const maxDistanceToTopOfScreen = 200
const chanceOfStim = 0.1
const maxDistanceBetweenPlatforms = 500
const minDistanceBetweenPlatforms = sharkWidth
const minSharkVSpeed = -300
const maxSharkVSpeed = 300
const deathHeight = -200
const tetrisPieceSize = 25
const crystalSymbolWidth = 35

const canvas = document.getElementById('game')
const context = canvas.getContext('2d')
context.imageSmoothingQuality = 'low'

let Game = function() {
  let sharkVPos,sharkHPos,sharkVSpeed,sharkHSpeed,score,stimCount,world,jumpCount,dashTime,jumpTime,jumping,newRecord,bestScore,cooldown=0
  let lastScene=null

  const init = () => {
    sharkVPos = screenHeight/2
    sharkHPos = 0
    sharkVSpeed = 0
    sharkHSpeed = sharkStartSpeed
    score = 0
    stimCount = startingStims
    world = [{
      posX: -50,
      posY: 100,
      width: 2000,
      color: 'white',
      hasStim: true,
      tetrominos: generatePlatform(Math.floor(2000/tetrisPieceSize)),
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

  init()

  const jump = () => {
    if (jumpCount >= 2) {
      return
    }
    sharkVSpeed = jumpSpeed
    jumping = true
    jumpTime = 0
    jumpCount++
  }

  const updateJumping = (dt) => {
    if (dashTime > 0) return

    jumpTime+=dt
    if (jumpTime < 0.3) {
      sharkVSpeed = jumpSpeed
    }
  }

  const dash = () => {
    if (stimCount <= 0 || dashTime > 0) return

    jumpCount = 0
    jumping = false
    sharkHSpeed += dashSpeedIncrease
    sharkVSpeed = 0 // shark stops moving up or down when dashing
    dashTime = maxDashTime
    stimCount--
  }

  const updateDashing = (dt) => {
    dashTime -= dt
    if (dashTime <= 0) {
      dashTime = 0
      sharkHSpeed -= dashSpeedIncrease
    }
    sharkVSpeed = 0
  }

  //adds an extra touch before starting the game, so it goes full screen on first touch
  this.gameState = gameOptions.fullScreen ? GAMESTATE.prestart : GAMESTATE.start  

  generateWorld = function() {
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
      let width = Math.random() * (maximumPlatformWidth - minimumPlatformWidth) + minimumPlatformWidth
      width = Math.floor(width/tetrisPieceSize)*tetrisPieceSize
      world.push({
        posX: rightMost + Math.random()*maxDistanceBetweenPlatforms + minDistanceBetweenPlatforms,
        posY: Math.floor(Math.random() * (lastPosY+maxHeightAbovePreviousPlatform) + platformHeight),
        width,
        color: randomChoice(['white', 'yellow', 'purple', 'red']),
        hasStim: Math.random() > (1 - chanceOfStim),
        tetrominos: generatePlatform(width/tetrisPieceSize),
        stimSprite: sprites['ice'+Math.floor(Math.random() * 6)]
      })
    }
  }

  const dead = () => {
    try {
      lastScene = context.getImageData(0,0,screenWidth,screenHeight)
    } catch (e) {}
    this.gameState = GAMESTATE.end
    if (score > window.localStorage.getItem('best-score')) {
      window.localStorage.setItem('best-score', score)
    }
    cooldown = 1
  }

  this.update = (dt) => {
    if (this.gameState != GAMESTATE.playing) {
      cooldown -= dt
      return
    }
    const prevSharkVPos = sharkVPos
    score += Math.floor(dt * 100)
    sharkVSpeed -= dt * gravity
    if (dashTime > 0) {
      updateDashing(dt)
    }
    if (jumping) {
      updateJumping(dt)
    }
    
    sharkVSpeed = clamp(sharkVSpeed, minSharkVSpeed, maxSharkVSpeed)
    sharkVPos += sharkVSpeed
    if (sharkVPos < deathHeight) {
      dead()
      return
    }

    sharkHPos += sharkHSpeed
    sharkHSpeed += speedIncrementor * dt
    generateWorld()

    world.forEach(platform => {
      // shark is within the platform
      // only handle platform collisions if we are moving down:
      if (
        sharkVSpeed < 0 && 
        prevSharkVPos >= platform.posY &&
        sharkHPos+sharkWidth+landingGrace > platform.posX &&
        sharkHPos < platform.posX+platform.width &&
        sharkVPos < platform.posY
      ) {
        sharkVPos = platform.posY
        jumpCount = 0
        sharkVSpeed = 0
      }

      if (platform.hasStim) {
        stimX = platform.posX + platform.width/2 - platform.stimSprite.width/2
        stimY = platform.posY
        if (
          sharkHPos+sharkWidth > stimX &&
          sharkHPos < stimX + platform.stimSprite.width &&
          sharkVPos < stimY + platform.stimSprite.height &&
          sharkVPos+sharkHeight >= stimY
        ) {
          platform.hasStim = false
          if (stimCount < maxStimCount) {
            stimCount++
            score += 100
          } else {
            score += 500
          }
        }
      }
    })
  }

  const renderStartScreen = () => {
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
  }

  const renderGameOverScreen = () => {
    if (lastScene !== null) {
      context.putImageData(lastScene, 0,0)
      const alpha = clamp(1-cooldown, 0, 0.9)
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
  }

  const renderGame = () => {
    for (let i=0; i<2; i++) {
      const x = Math.floor((-sharkHPos*0.5 % sprites['bg'].width) + sprites['bg'].width*i)
      context.drawImage(sprites['bg'], x, 0)
    }
    world.forEach((platform,i) => {
      const screenX = Math.floor(platform.posX - sharkHPos + sharkWidth)
      for(let x=0;x<platform.tetrominos.length;x++) {
        for(let y=0;y<platform.tetrominos[x].length;y++) {
          const color = platform.tetrominos[x][y]
          if (color === 'black') continue
          context.fillStyle = color
          //context.strokeStyle = 'black'
          //context.lineWidth = 1
          context.fillRect(screenX+x*tetrisPieceSize, screenHeight-platform.posY+y*tetrisPieceSize, tetrisPieceSize, tetrisPieceSize)
          //context.strokeRect(screenX+x*tetrisPieceSize, screenHeight-platform.posY+y*tetrisPieceSize, tetrisPieceSize, tetrisPieceSize)
        }
      }
      context.fillStyle = 'white'
      context.fillRect(screenX, screenHeight-platform.posY-3, platform.width, 3)
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

    context.drawImage(sprites['iceSymbol'], 0, 0, crystalSymbolWidth*stimCount, crystalSymbolWidth, 5, 40, crystalSymbolWidth*stimCount, crystalSymbolWidth)

    context.font = "20px Arial"
    context.textAlign="end"
    context.fillText('BEST: '+bestScore, screenWidth-10,20) 
  }

  this.render = function() {
    switch (this.gameState) {
      case GAMESTATE.prestart:
      case GAMESTATE.start:
        renderStartScreen()
        return
      case GAMESTATE.end:
        renderGameOverScreen()
        return
      case GAMESTATE.playing:
        renderGame()
        return
    }
  }

  this.action = function(action) {
    switch (this.gameState) {
      case GAMESTATE.prestart:
      case GAMESTATE.end:
        if (cooldown <= 0) {
          init()
          this.gameState = GAMESTATE.start
        }
        break
      case GAMESTATE.start:
        this.gameState = GAMESTATE.playing
        break
      case GAMESTATE.playing:    
        if (action == ACTION.jump) { //z
          jump()
        } else if (action == ACTION.dash) { //x
          dash()
        }
        break
    }
  }
  
  this.endAction = function(action) {
    if (action == ACTION.jump) { //z
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
    let action = ACTION.none
    if (event.keyCode == 90) { //z
      action = ACTION.jump
    }
    if (event.keyCode == 88) { //x
      action = ACTION.dash
    }
    game.action(action)
    return false
  })

  window.addEventListener('keyup', function(event) {
    game.endAction(event.keyCode == 90 ? ACTION.jump : ACTION.none)
  })

  const actionFromCanvasLocation = (x, y) => x < canvas.clientWidth / 2 ? ACTION.dash : ACTION.jump

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
}, startGame);