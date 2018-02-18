function randomChoice(arr) {
  return arr[Math.floor(arr.length * Math.random())]
}

function generatePlatform(width) {
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
        if (!piece[x][y]) continue;
        if (platform[x+xLocation] === undefined || platform[x+xLocation][y] !== 'black') {
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

  const getFirstBlackXLocation = () => {
    for (let x = 0;x<platform.length;x++) {
      if (platform[x][0] === 'black') {
        return x
      }
    }
    return false
  }
  
  let finished = false
  let color = '';
  while (true) {
    color = randomChoice(['orange','red','green','blue','aqua'].filter(x => x !== color))
    let firstX = getFirstBlackXLocation(0)
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
      return platform
    }
  }
}
