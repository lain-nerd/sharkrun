function randomChoice(arr) {
  return arr[Math.floor(arr.length * Math.random())]
}

let generatedPlatforms = {}

function generatePlatform(width) {
  if (generatedPlatforms[width] && generatedPlatforms[width].length >= 5) {
    return randomChoice(generatedPlatforms[width])
  }
  const tetrominos = [
    //I
    [[true,true,true,true]],
    [[true],[true],[true],[true]],
    
    //O
    [[true,true],[true,true]],
    
    //L
    [[true,true,true],[true]],
    [[true,true],[false,true],[false,true]],
    [[false,false,true],[true,true,true]],
    [[true],[true],[true,true]],

    //J
    [[true,true,true],[false,false,true]],
    [[false,true],[false,true],[true,true]],
    [[true],[true,true,true]],
    [[true,true],[true],[true]],

    //T
    [[true,true,true],[false,true]],
    [[false,true],[true,true],[false,true]],
    [[false,true],[true,true,true]],
    [[true],[true,true],[true,false]],
    
    //S
    [[true,true],[false,true,true]],
    [[false,true],[true,true],[true]],

    //Z
    [[false,true,true],[true,true]],
    [[true],[true,true],[false,true]],
  ]

  const platform = []
  for(let x=0;x<width;x++) {
    platform[x] = ['black','black','black','black']
  }
  
  const canPieceFit = (piece, xLocation) => {
    let maxX = 0
    for(let y=0; y<piece.length; y++) {
      if (piece[y].length > maxX) maxX = piece[y].length
      for(let x=0; x<piece[y].length; x++) {
        //If we intersect non-platform, can't work:
        if (platform[x+xLocation] === undefined) {
          return false
        }
        if (!piece[y][x]) {
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

    if (piece[0].length < maxX && xLocation == width - maxX) {
      return false
    }

    return true
  }

  const fillPieceIn = (piece, xLocation, color) => {
    for(let y=0; y<piece.length; y++) {
      for(let x=0; x<piece[y].length; x++) {
        if (!piece[y][x]) continue;
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
    let piece;
    let fits = false
    let remainingPieces = tetrominos.slice()
    do {
      piece = randomChoice(remainingPieces)
      remainingPieces = remainingPieces.filter(p => p !== piece)
      fits = canPieceFit(piece, firstX)
      if (!fits && remainingPieces.length == 0) {
        firstX++
        remainingPieces = tetrominos.slice()
      }
    } while (!fits && firstX < width)
    if (fits) {
      fillPieceIn(piece, firstX, color)
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
