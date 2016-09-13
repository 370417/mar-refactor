// ===== //
// #PRNG //
// ===== //

const prng = Math.random;
Math.random = undefined;

// =========== //
// #Directions //
// =========== //

// direction names are based on clock directions
const DIR1 = {
    dx: 1,
    dy:-1,
    dz: 0,
};
const DIR3 = {
    dx: 1,
    dy: 0,
    dz:-1,
};
const DIR5 = {
    dx: 0,
    dy: 1,
    dz:-1,
};
const DIR7 = {
    dx:-1,
    dy: 1,
    dz: 0,
};
const DIR9 = {
    dx:-1,
    dy: 0,
    dz: 1,
};
const DIR11 = {
    dx: 0,
    dy:-1,
    dz: 1,
};

DIR1.clockwise = DIR3;
DIR3.clockwise = DIR5;
DIR5.clockwise = DIR7;
DIR7.clockwise = DIR9;
DIR9.clockwise = DIR11;
DIR11.clockwise = DIR1;

DIR1.counterclockwise = DIR11;
DIR11.counterclockwise = DIR9;
DIR9.counterclockwise = DIR7;
DIR7.counterclockwise = DIR5;
DIR5.counterclockwise = DIR3;
DIR3.counterclockwise = DIR1;

const directions = {DIR1, DIR3, DIR5, DIR7, DIR9, DIR11};

// ====== //
// #Tiles //
// ====== //

const WALL = 0;
const FLOOR = 1;

const TILES = {
    WALL,
    FLOOR,
};

// ========== //
// #Utilities //
// ========== //

// generate a random integer in the interval [min, max]
const randInt = (min, max, prng) => {
    if (min > max) {
        console.error('randInt: min > max');
        return NaN;
    }
    return min + ((max - min + 1) * prng()) << 0;
};

// pick a random element of an array or object
const randElement = (array, prng) => {
    const keys = Object.keys(array);
    return array[keys[randInt(0, array.length - 1, prng)]];
};

// ====== //
// #Level //
// ====== //

const forEachTileOfLevel = (width, height, fun) => {
    for (let y = 0; y < height; y++) {
        for (let x = Math.floor((height - y) / 2); x < width - Math.floor(y / 2); x++) {
            fun(x, y);
        }
    }
};

const forEachInnerTileOfLevel = (width, height, fun) => {
    for (let y = 1; y < height - 1; y++) {
        for (let x = Math.floor((height - y) / 2) + 1; x < width - Math.floor(y / 2) - 1; x++) {
            fun(x, y);
        }
    }
};

const inBounds = (width, height, x, y) => {
    return y >= 0 &&
           y < height &&
           x >= Math.floor((height - y) / 2) &&
           x < width - Math.floor(y / 2);
};

const inInnerBounds = (width, height, x, y) => {
    return y > 0 &&
           y < height - 1 &&
           x > Math.floor((height - y) / 2) &&
           x < width - Math.floor(y / 2) - 1;
};

const surrounded = (x, y, isType) => {
    for (const key in directions) {
        const {dx, dy} = directions[key];
        if (!isType(x + dx, y + dy)) {
            return false;
        }
    }
    return true;
};

// count the number of contiguous groups of a tile type around a tile
const countGroups = (x, y, isType) => {
    let groups = 0;
    let prevx = x + DIR11.dx;
    let prevy = y + DIR11.dy;
    for (let i = 0, dir = DIR1; i < 6; i++, dir = dir.clockwise) {
        const currx = x + dir.dx;
        const curry = y + dir.dy;
        // count the number of transitions between types
        if (!isType(prevx, prevy) && isType(currx, curry)) {
            groups++;
        }
        prevx = currx;
        prevy = curry;
    }
    // if there are no transitions, check if all neighbors are the correct type
    if (!groups && isType(prevx, prevy)) {
        return 1;
    } else {
        return groups;
    }
};

const floodFill = (x, y, passable, callback) => {
    if (passable(x, y)) {
        callback(x, y);
        for (const key in directions) {
            const {dx, dy} = directions[key];
            floodFill(x + dx, y + dy, passable, callback);
        }
    }
};

const createLevel = ({
    width,
    height,
    prng,
    startx = 24,
    starty = 15,
}) => {
    const level = [];

    for (let x = 0; x < width; x++) {
        level[x] = [];
        for (let y = 0; y < height; y++) {
            level[x][y] = {
                type: WALL,
            };
        }
    }

    const forEachTile = forEachTileOfLevel.bind(null, width, height);
    const forEachInnerTile = forEachInnerTileOfLevel.bind(null, width, height);

    // floor at starting point
    level[startx][starty].type = FLOOR;
    
    // main algorithm
    const scrambledTiles = [];
    forEachInnerTile((x, y) => {
        scrambledTiles.splice(randInt(0, scrambledTiles.length, prng), 0, {x, y});
    });

    const isWall = (x, y) => level[x][y].type === WALL;

    for (let i = 0; i < scrambledTiles.length; i++) {
        const {x, y} = scrambledTiles[i];
        if (surrounded(x, y, isWall) || countGroups(x, y, isWall) !== 1) {
            level[x][y].type = FLOOR;
        }
    }

    // find size of wall groups
    forEachTile((x, y) => {
        if (level[x][y].type === FLOOR || level[x][y].wallGroup) {
            return;
        }
        const wallGroup = { size: 0 };
        const passable = (x, y) => inBounds(width, height, x, y) && level[x][y].type === WALL && !level[x][y].wallGroup;
        const callback = (x, y) => {
            level[x][y].wallGroup = wallGroup;
            wallGroup.size++;
        }
        floodFill(x, y, passable, callback);
    });

    // remove wall groups with <6 walls
    forEachTile((x, y) => {
        if (level[x][y].type === WALL) {
            if (level[x][y].wallGroup.size < 6) {
                level[x][y] = { type: FLOOR };
            } else {
                level[x][y] = { type: WALL };
            }
        }
    });

    // find the size of the open space around the starting point
    let mainCaveSize = 0;
    const passable = (x, y) => level[x][y].type === FLOOR && !level[x][y].flooded;
    const callback = (x, y) => {
        level[x][y].flooded = true;
        mainCaveSize++;
    };
    floodFill(startx, starty, passable, callback);

    // fill in other discontinuous caves
    forEachTile((x, y) => {
        if (level[x][y].type === FLOOR && !level[x][y].flooded) {
            level[x][y] = { type: WALL };
        }
    });

    alert(mainCaveSize);

    return level;
};

// ===== //
// #Game //
// ===== //

const createGame = ({
    width,
    height,
    prng,
    updateTile,
    updateDraw,
}) => {
    const game = {};

    const forEachTile = forEachTileOfLevel.bind(null, width, height);

    let level = createLevel({
        width,
        height,
        prng,
    });

    forEachTile((x, y) => {
        updateTile(x, y, {
            type: level[x][y].type,
        });
    });

    updateDraw();
};

// ======== //
// #Display //
// ======== //

const WIDTH = 48;
const HEIGHT = 31;

const XU = 18;
const TILEHEIGHT = 24;
const YU = 16;

const $game = document.getElementById('game');
$game.style.width = (WIDTH - HEIGHT / 2 + 1)* XU + 'px';
$game.style.height = TILEHEIGHT + (HEIGHT - 1) * YU + 'px';

const canvases = [];
const bgcanvases = [];
const ctxs = [];
const bgctxs = [];
for (let i = 0; i < HEIGHT; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = (WIDTH - HEIGHT / 2 + 1)* XU;
    canvas.height = TILEHEIGHT;
    canvas.style.top = i * YU + 'px';
    const ctx = canvas.getContext('2d');
    canvases[i] = canvas;
    ctxs[i] = ctx;

    const bgcanvas = document.createElement('canvas');
    bgcanvas.width = canvas.width;
    bgcanvas.height = canvas.height;
    bgcanvas.style.top = canvas.style.top;
    const bgctx = bgcanvas.getContext('2d');
    bgcanvases[i] = bgcanvas;
    bgctxs[i] = bgctx;

    $game.appendChild(bgcanvas);
    $game.appendChild(canvas);
}

// Visual info for tiles
let tileset = document.createElement('img');

const displayTiles = {
    WALL: {
        spritex: 0,
        spritey: 0,
        color: '#FFF',
    },
    FLOOR: {
        spritex: 1,
        spritey: 0,
        color: '#FFF',
    },
};

const cacheTiles = () => {
    for (const TILE in TILES) {
        const displayTile = displayTiles[TILE];
        const canvas = document.createElement('canvas');
        canvas.width = XU;
        canvas.height = TILEHEIGHT;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(tileset, displayTile.spritex * XU, displayTile.spritey * TILEHEIGHT, XU, TILEHEIGHT, 0, 0, XU, TILEHEIGHT);
        ctx.fillStyle = displayTile.color;
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillRect(0, 0, XU, TILEHEIGHT);
        displayTile.canvas = canvas;

        displayTiles[TILES[TILE]] = displayTiles[TILE];
    }
};

const level = [];
for (let x = 0; x < WIDTH; x++) {
    level[x] = [];
    for (let y = 0; y < HEIGHT; y++) {
        level[x][y] = {};
    }
}

const forEachTile = forEachTileOfLevel.bind(null, WIDTH, HEIGHT);

const draw = () => {
    forEachTile((x, y) => {
        const ctx = ctxs[y];
        const displayTile = displayTiles[level[x][y].type];
        const realx = (x - (HEIGHT - y - 1) / 2) * XU;
        ctx.drawImage(displayTile.canvas, 0, 0, XU, TILEHEIGHT, realx, 0, XU, TILEHEIGHT);
    });
};

const updateTile = (x, y, attributes) => {
    for (const key in attributes) {
        level[x][y][key] = attributes[key];
    }
};

// Remove this later ;  display should decide to draw when the player actor is updated
const updateDraw = () => {
    draw();
};

let game;
const startGame = () => {
    cacheTiles();
    game = createGame({
        width: WIDTH,
        height: HEIGHT,
        prng,
        updateTile,
        updateDraw,
    });
};

tileset.addEventListener('load', startGame);
tileset.src = 'tileset2.png';
