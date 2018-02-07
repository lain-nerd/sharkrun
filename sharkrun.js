function loadImage(url, callback) {
  const image = new Image()
  image.onload = callback
  image.src = url
}

function randomChoice(arr) {
  return arr[Math.floor(arr.length * Math.random())];
}

let sprites = {}
const width = 1000
const height = 600
const sharkHeight = 113
const context = document.getElementById('game').getContext('2d')
const dashSpeed = 10
context.imageSmoothingQuality = 'high'

let Game = function() {
  let sharkVPos = height/2
  let sharkHPos = 0
  let sharkVSpeed = 0
  let sharkHSpeed = 10
  let gravity = 30
  let time = 0
  let stimCount = 0
  let world = [{
    posX: -50,
    posY: 100,
    width: 2000,
    color: 'white',
    hasStim: true
  }]
  let jumpCount = 0
  let dashTime = 0

  this.jump = function() {
    if (jumpCount >= 2) {
      return
    }
    sharkVSpeed = 12
    jumpCount++
  }
  this.dash = function() {
    if (dashTime > 0 || stimCount <= 0) {
      return
    }
    sharkHSpeed += dashSpeed
    dashTime = 1.0
    stimCount--
  }

  this.gameState = 'start'

  this.generateWorld = function() {
    let rightMost = sharkHPos
    let lastPosY = 0
    world.forEach((platform, index) => {
      if (platform.posX + platform.width+200 < sharkHPos) {
        world.splice(index, 1)
      }
      if (rightMost < platform.posX + platform.width) {
        rightMost = platform.posX + platform.width
      }
      lastPosY = platform.posY
    })
    if (lastPosY > height - 400) {
      lastPosY = height - 400
    }
    if (rightMost - sharkHPos < 2000) {
      world.push({ 
        posX: rightMost + Math.random()*200,
        posY: Math.random() * (lastPosY+200) + 20,
        width: Math.random() * 500 + 100,
        color: randomChoice(['white', 'yellow', 'purple', 'red']),
        hasStim: Math.random() > 0.9
      })
    }
  }

  this.update = function(dt) {
    if (this.gameState != 'playing') {
      return
    }
    time += dt
    if (dashTime > 0) {
      dashTime -= dt
      if (dashTime <= 0) {
        dashTime = 0
        sharkHSpeed -= dashSpeed
      }
    }
    sharkVSpeed -= dt * gravity * (dashTime > 0 ? 0.5 : 1)
    sharkVPos += sharkVSpeed
    if (sharkVPos < -200) {
      this.gameState = 'end'
      return
    }
    sharkHPos += sharkHSpeed
    sharkHSpeed += 0.1 * dt
    this.generateWorld()

    world.forEach(platform => {
      //shark is within the platform
      //only handle platform collisions if we are moving down:
      if (sharkVSpeed < 0) {
        if (sharkHPos+100 > platform.posX && sharkHPos < platform.posX+platform.width) {
          if (sharkVPos < platform.posY && sharkVPos > platform.posY - 20) {
            sharkVPos = platform.posY
            jumpCount = 0
            sharkVSpeed = 0
          }
        }
      }
      if (platform.hasStim) {
        stimX = platform.posX + platform.width/2
        stimY = platform.posY + 15
        if (
          sharkHPos+100 > stimX-15 &&
          sharkHPos < stimX+15 &&
          sharkVPos < stimY+15 &&
          sharkVPos+100 > stimY-15
        ) {
          platform.hasStim = false
          stimCount++
        }
      }
    })
  
  }

  this.render = function() {
    if (this.gameState == 'start') {
      context.drawImage(sprites['start'], 0, 0)
      return
    }
    if (this.gameState == 'end') {
      context.clearRect(0,0,width,height)
      context.font = "60px Arial"
      context.fillStyle = 'white'
      context.textAlign="center"; 
      context.fillText('GAME OVER',500,200)
      context.fillText('YOUR TIME: '+Math.floor(time*10)/10,500,400)
      context.textAlign="start"; 
      return
    }
    for (let i=0; i<2; i++) {
      const x = (-sharkHPos % 1000) + 1000*i
      context.drawImage(sprites['bg'], x, 0)
    }
    world.forEach(platform => {
      screenX = platform.posX - sharkHPos + 100
      context.fillStyle = platform.color
      context.fillRect(screenX, height-platform.posY, platform.width, 20)
      if (platform.hasStim) {
        context.beginPath()
        context.arc(screenX + platform.width / 2, height-platform.posY-15, 15, 0, 2 * Math.PI, false)
        context.fillStyle = 'white'
        context.fill()
        context.lineWidth = 1
        context.strokeStyle = 'yellow'
        context.stroke()
      }
    })
    if (dashTime > 0) {
      for (i=0; i<100; i+=3) {
        context.drawImage(sprites['shark'], i, height-sharkVPos-sharkHeight)
      }
    }
    context.drawImage(sprites['shark'], 100, height-sharkVPos-sharkHeight)
    context.font = "30px Arial"
    context.fillStyle = 'white'
    context.fillText('TIME: '+Math.floor(time),10,30)
    context.fillText('STIMS: '+stimCount,10,60)
  }

  this.keyDown = function(keyCode) {
    if (this.gameState == 'start') {
      this.gameState = 'playing'
      return
    }
    if (this.gameState == 'end') {
      this.gameState == 'start'
      return
    }
    if (keyCode == 90) { //z
      this.jump()
    }
    if (keyCode == 88) { //x
      this.dash()
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
  game.keyDown(event.keyCode);
});

loadImage('./sharkynobg.png', function() {
  sprites['shark'] = this
})
loadImage('./background.jpg', function() {
  sprites['bg'] = this
})
loadImage('./start.png', function() {
  sprites['start'] = this
  window.requestAnimationFrame(loop)
})