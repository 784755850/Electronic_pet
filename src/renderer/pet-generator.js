// Pet Appearance Generator
// Generates procedural pixel art sprites for the pet
// @ts-check

(function() {

const GRID_SIZE = 16

/** @typedef {number[][]} Grid */

// Helper to create empty grid
/**
 * @returns {Grid}
 */
function createGrid() {
  return Array(16).fill(0).map(() => Array(16).fill(0))
}

// Pseudo-random number generator based on seed
/**
 * @param {number} a 
 * @returns {() => number}
 */
function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

/**
 * @param {number} seed 
 * @returns {{[key: string]: Grid}}
 */
// @ts-ignore
window.generatePetAppearance = function(seed) {
  const rng = mulberry32(seed || Date.now())
  
  // Base body parameters
  const bodyWidth = 6 + Math.floor(rng() * 5) // 6-10
  const bodyHeight = 6 + Math.floor(rng() * 6) // 6-11
  const bodyY = 16 - bodyHeight - 1 // Bottom aligned with 1px padding
  
  // Generate base body (symmetric)
  const baseGrid = createGrid()
  
  // Draw body shape
  for (let y = 0; y < bodyHeight; y++) {
    for (let x = 0; x < bodyWidth / 2; x++) {
      // Simple noise for body shape
      const isSolid = rng() > 0.3
      if (isSolid) {
        const py = bodyY + y
        // Left side
        const px1 = 8 - Math.floor(bodyWidth/2) + x
        // Right side
        const px2 = 8 + Math.floor(bodyWidth/2) - 1 - x
        
        // Main color (2: mid) or Highlight (3: light)
        const color = rng() > 0.8 ? 3 : 2
        
        // Outline (1: dark) logic is usually post-processing, 
        // but here we just fill body first
        if (px1 >= 0 && px1 < 16) baseGrid[py][px1] = color
        if (px2 >= 0 && px2 < 16) baseGrid[py][px2] = color
      }
    }
  }
  
  // Ensure connectivity / Fill holes (simple pass)
  // ... (Skip complex hole filling for now, basic noise might be enough if dense)
  
  // Add Eyes
  const eyeY = bodyY + Math.floor(bodyHeight * 0.4)
  const eyeX = 8 - Math.floor(bodyWidth/4) - 1
  if (baseGrid[eyeY] && eyeX >= 0) {
    baseGrid[eyeY][eyeX] = 1 // Dark eye
    baseGrid[eyeY][15 - eyeX] = 1
  }

  // Apply Outline
  const finalGrid = applyOutline(baseGrid)
  
  // Generate variations
  return {
    idle: finalGrid,
    walk1: offsetGrid(finalGrid, 0, -1),
    walk2: offsetGrid(finalGrid, 0, 0), // Use base as walk2? Or squash?
    sit: squashGrid(finalGrid),
    sleep: addZzz(squashGrid(finalGrid)),
    sick: recolor(finalGrid, 3, 9), // Sick color
    happy: addEmote(finalGrid, 'heart'),
    sad: addEmote(finalGrid, 'tear')
  }
}

/**
 * @param {Grid} grid 
 * @returns {Grid}
 */
function applyOutline(grid) {
  const out = grid.map(row => [...row])
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (grid[y][x] !== 0) {
        // Check neighbors
        const neighbors = [
          [x-1, y], [x+1, y], [x, y-1], [x, y+1]
        ]
        neighbors.forEach(([nx, ny]) => {
          if (nx >= 0 && nx < 16 && ny >= 0 && ny < 16) {
            if (grid[ny][nx] === 0) {
              out[ny][nx] = 1 // Outline color
            }
          }
        })
      }
    }
  }
  return out
}

/**
 * @param {Grid} grid 
 * @param {number} dx 
 * @param {number} dy 
 * @returns {Grid}
 */
function offsetGrid(grid, dx, dy) {
  const newGrid = createGrid()
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (grid[y][x] !== 0) {
        const ny = y + dy
        const nx = x + dx
        if (ny >= 0 && ny < 16 && nx >= 0 && nx < 16) {
          newGrid[ny][nx] = grid[y][x]
        }
      }
    }
  }
  return newGrid
}

/**
 * @param {Grid} grid 
 * @returns {Grid}
 */
function squashGrid(grid) {
  // Simple squash: move top down by 1px
  return offsetGrid(grid, 0, 1)
}

/**
 * @param {Grid} grid 
 * @returns {Grid}
 */
function addZzz(grid) {
  const g = grid.map(row => [...row])
  // Draw Zzz at top right
  if (g[2]) { g[2][12] = 1; g[2][13] = 1; }
  if (g[3]) { g[3][13] = 1; }
  if (g[4]) { g[4][12] = 1; g[4][13] = 1; }
  return g
}

/**
 * @param {Grid} grid 
 * @param {string} type 
 * @returns {Grid}
 */
function addEmote(grid, type) {
  const g = grid.map(row => [...row])
  // Add emote above head
  if (type === 'heart') {
    // 5: pink
    g[1][7] = 5; g[1][9] = 5;
    g[2][6] = 5; g[2][8] = 5; g[2][10] = 5;
    g[3][7] = 5; g[3][9] = 5;
    g[4][8] = 5;
  } else if (type === 'tear') {
    // 9: blue/light
    g[3][4] = 9; g[4][4] = 9;
  }
  return g
}

/**
 * @param {Grid} grid 
 * @param {number} oldColor 
 * @param {number} newColor 
 * @returns {Grid}
 */
function recolor(grid, oldColor, newColor) {
  return grid.map(row => row.map(c => c === oldColor ? newColor : c))
}

})();
