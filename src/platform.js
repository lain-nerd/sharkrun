function randomChoice(arr) {
  return arr[Math.floor(arr.length * Math.random())]
}

let generatedPlatforms = []

function generatePlatform(width) {
  if (generatedPlatforms[width] && generatedPlatforms[width].length >= 2) {
    return randomChoice(generatedPlatforms[width])
  }
  const tetrominos = [
    //I
    [[true,true,true,true]],
    [[true],[true],[true],[true]],
    
    //O
    [[true,true],[true,true]],
    
    //L
    [[true,true,true],[true,false,false]],
    [[true,true],[false,true],[false,true]],
    [[false,false,true],[true,true,true]],
    [[true,false],[true,false],[true,true]],

    //J
    [[true,true,true],[false,false,true]],
    [[false,true],[false,true],[true,true]],
    [[true,false,false],[true,true,true]],
    [[true,true],[true,false],[true,false]],

    //T
    [[true,true,true],[false,true,false]],
    [[false,true],[true,true],[false,true]],
    [[false,true,false],[true,true,true]],
    [[true,false],[true,true],[true,false]],
    
    //S
    [[true,true,false],[false,true,true]],
    [[false,true],[true,true],[true, false]],

    //Z
    [[false,true,true],[true,true,false]],
    [[true,false],[true,true],[false,true]],
    
  ]

  const tetrominoWidth = 8
  const platform = []
  for(let x=0;x<width;x++) {
    platform[x] = ['black','black','black','black']
  }
  
  const canPieceFit = (piece, xLocation) => {
    for(let x=0; x<piece.length; x++) {
      for(let y=0; y<piece[x].length; y++) {
        //If we intersect non-platform, can't work:
        if (platform[x+xLocation] === undefined) {
          return false
        }
        if (!piece[x][y]) {
          // If we're checking the top of the piece, then make sure the platform is already filled at this location:
          if (y===0 && platform[x+xLocation][y] === 'black') {
            return false
          }
          continue
        }
        // We get here if the piece is filled in this location, so check that the platform is empty:
        if (platform[x+xLocation][y] !== 'black') {
          return false
        }
      }
    }
    return true
  }

  const fillPieceIn = (piece, xLocation, color) => {
    for(let x=0; x<piece.length; x++) {
      for(let y=0; y<piece[x].length; y++) {
        if (!piece[x][y]) continue;
        platform[x+xLocation][y] = color
      }
    }
  }

  const getFirstPotentialLocation = () => {
    for (let x = width-1;x>=0;x--) {
      if (platform[x][0] !== 'black') {
        return x-1
      }
    }
    return 0
  }
  
  let finished = false
  let color = '';
  while (true) {
    color = randomChoice(['orange','red','green','blue','aqua'].filter(x => x !== color))
    let firstX = getFirstPotentialLocation()
    let tetromino;
    let fits = false
    let remainingPieces = tetrominos.slice()
    do {
      tetromino = randomChoice(remainingPieces)
      remainingPieces = remainingPieces.filter(p => p !== tetromino)
      fits = canPieceFit(tetromino, firstX)
      if (!fits && remainingPieces.length == 0) {
        firstX++
        remainingPieces = tetrominos.slice()
      }
    } while (!fits && firstX < width)
    if (fits) {
      fillPieceIn(tetromino, firstX, color)
    } else {
      break
    }
  }
  if (!generatedPlatforms[width]) {
    generatedPlatforms[width] = []
  }

  generatedPlatforms[width].push(platform)
  return platform
}
