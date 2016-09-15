// ===== //
// #PRNG //
// ===== //

const mainSeed = Math.random() + '';
const mainPrng = new Math.seedrandom(mainSeed);

const levelSeed = '0.8217183739623661';
//const levelSeed = Math.random() + '';
const levelPrng = new Math.seedrandom(levelSeed);

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
const GRASS = 2;

const TILES = {
    WALL,
    FLOOR,
    GRASS,
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

// round a number, but round down in case of x.5
const roundTieDown = n => Math.ceil(n - 0.5);

// ==== //
// #FOV //
// ==== //

// displacement vector for moving tangent to a circle counterclockwise in a certain sector
const tangent = [
    { x: 0, y:-1 },//  \
    { x:-1, y: 0 },//  -
    { x:-1, y: 1 },//  /
    { x: 0, y: 1 },//  \
    { x: 1, y: 0 },//  -
    { x: 1, y:-1 },//  /
    { x: 0, y:-1 },//  \
];

// displacement vector for moving normal to a circle outward in a certain sector
const normal = [
    { x: 1, y: 0 },// -
    { x: 1, y:-1 },// /
    { x: 0, y:-1 },// \
    { x:-1, y: 0 },// -
    { x:-1, y: 1 },// /
    { x: 0, y: 1 },// \
    { x: 1, y: 0 },// -
];

const fov = (ox, oy, transparent, reveal, range = 9e9) => {
    reveal(ox, oy);

    const revealWall = (x, y) => {
        if (!transparent(x, y)) {
            reveal(x, y);
        }
    };

    for (const key in directions) {
        const {dx, dy} = directions[key];
        revealWall(ox + dx, oy + dy);
    }

    const polar2rect = (radius, angle) => {
        const sector = Math.floor(angle);
        const arc = roundTieDown((angle - sector) * (radius - 0.5));
        return {
            x: ox + radius * normal[sector].x + arc * tangent[sector].x,
            y: oy + radius * normal[sector].y + arc * tangent[sector].y,
            arc: radius * sector + arc,
        };
    };

    const scan = (radius, start, end) => {
        if (radius > range) { return; }
        let someRevealed = false;
        let {x, y, arc} = polar2rect(radius, start);
        let current = start;
        while (current < end) {
            if (transparent(x, y)) {
                current = arc / radius;
                if (current >= start && current <= end) {
                    reveal(x, y);
                    someRevealed = true;
                    if (radius < range) {
                        if (current >= 0 && current <= 2) { revealWall(x + 1, y - 1); }
                        if (current >= 1 && current <= 3) { revealWall(x    , y - 1); }
                        if (current >= 2 && current <= 4) { revealWall(x - 1, y    ); }
                        if (current >= 3 && current <= 5) { revealWall(x - 1, y + 1); }
                        if (current >= 4 && current <= 6) { revealWall(x    , y + 1); }
                        if (current <= 1 || current >= 5) { revealWall(x + 1, y    ); }
                    }
                }
            } else {
                current = (arc + 0.5) / radius;
                if (someRevealed) {
                    scan(radius + 1, start, (arc - 0.5) / radius);
                }
                start = current;
            }
            // increment everything
            const displacement = tangent[Math.floor(arc / radius)];
            x += displacement.x;
            y += displacement.y;
            arc++;
        }
        if (someRevealed) {
            scan(radius + 1, start, end);
        }
    };
    scan(1, 0, 6);
};

// ====== //
// #Level //
// ====== //

const createLevel = ({
    width,
    height,
    prng,
    startx = 24,
    starty = 15,
    animatedUpdatedTile = () => {},
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

    const findCavesTunnels = () => {
        const isFloor = (x, y) => level[x][y].type === FLOOR;
        forEachInnerTile((x, y) => {
            const tile = level[x][y];
            tile.cave = false;
            tile.tunnel = false;
            if (isFloor(x, y)) {
                if (countGroups(x, y, isFloor) === 1) {
                    tile.cave = true;
                } else {
                    tile.tunnel = true;
                }
            }
        });
    };

    // floor at starting point
    level[startx][starty].type = FLOOR;
    animatedUpdateTile(startx, starty, FLOOR, 4);
    
    // animate border
    forEachTile((x, y) => {
        if (!inInnerBounds(width, height, x, y)) {
            if (y === 0 || y === height - 1) {
                animatedUpdateTile(x, y, WALL, 10);
            } else {
                animatedUpdateTile(x, y, WALL, 5);
            }
        }
    });

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
            animatedUpdateTile(x, y, FLOOR, 5);
        } else if (level[x][y].type === WALL) {
            animatedUpdateTile(x, y, WALL, 5);
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
                animatedUpdateTile(x, y, FLOOR);
            } else {
                level[x][y] = { type: WALL };
            }
        }
    });

    // find the size of the open space around the starting point
    {
        let mainCaveSize = 0;
        const passable = (x, y) => level[x][y].type === FLOOR && !level[x][y].flooded;
        const callback = (x, y) => {
            level[x][y].flooded = true;
            mainCaveSize++;
        };
        floodFill(startx, starty, passable, callback);
    }

    // fill in other discontinuous caves
    forEachInnerTile((x, y) => {
        if (level[x][y].type === FLOOR && !level[x][y].flooded) {
            level[x][y] = { type: WALL };
            animatedUpdateTile(x, y, WALL);
        }
    });

    // clear flooded flag
    forEachTile((x, y) => {
        level[x][y].flooded = false;
    });

    findCavesTunnels();

    // fill in dead ends
    const isNotCave = (x, y) => !level[x][y].cave;
    const fillDead = (x, y) => {
        if (!level[x][y].cave || !surrounded(x, y, isNotCave)) {
            return;
        }

        level[x][y] = { type: WALL };
        animatedUpdateTile(x, y, WALL);

        for (const key in directions) {
            const {dx, dy} = directions[key];
            const tile = level[x+dx][y+dy];
            if (tile.type === FLOOR && tile.tunnel) {
                if (countGroups(x + dx, y + dy, (x, y) => level[x][y].type === FLOOR) === 1) {
                    tile.tunnel = false;
                    tile.cave = true;
                }
            }
        }

        for (const key in directions) {
            const {dx, dy} = directions[key];
            fillDead(x + dx, y + dy);
        }
    };
    forEachInnerTile((x, y) => {
        fillDead(x, y);
    });

    // find groups of wall totally surrounded by tunnel and turn them to floor
    forEachInnerTile((x, y) => {
        if (level[x][y].type === FLOOR || level[x][y].flooded) {
            return;
        }
        let surroundedByTunnel = true;
        const passable = (x, y) => {
            if (!inInnerBounds(width, height, x, y) || level[x][y].cave) {
                surroundedByTunnel = false;
            }
            return inBounds(width, height, x, y) && level[x][y].type === WALL && !level[x][y].flooded;
        }
        const callback = (x, y) => {
            level[x][y].flooded = true;
        }
        floodFill(x, y, passable, callback);

        if (surroundedByTunnel) {
            floodFill(x, y, (x, y) => level[x][y].type === WALL, (x, y) => {
                level[x][y].type = FLOOR;
                animatedUpdateTile(x, y, FLOOR);
            });
        }
    });

    // recalculate cave/tunnel status and fill any new dead ends
    findCavesTunnels();
    forEachInnerTile((x, y) => {
        fillDead(x, y);
    });

    // floodfill caves
    const findCaves = () => {
        forEachInnerTile((x, y) => {
            if (level[x][y].cave === true) {
                const cave = {
                    tiles: [],
                };
                const passable = (x, y) => level[x][y].cave === true;
                const callback = (x, y) => {
                    cave.tiles.push({x, y});
                    level[x][y].cave = cave;
                };
                floodFill(x, y, passable, callback);
            }
        });
    };

    // remove 2-tile caves
    forEachInnerTile((x, y) => {
        const tile = level[x][y];
        if (tile.cave && tile.cave !== true && tile.cave.tiles.length === 2) {
            const keep = Math.round(prng());
            const fill = 1 - keep;
            const keepCoords = tile.cave.tiles[keep];
            const fillCoords = tile.cave.tiles[fill];
            tile.cave.tiles.splice(fill, 1);

            level[fillCoords.x][fillCoords.y] = { type: WALL };
            animatedUpdateTile(fillCoords.x, fillCoords.y, WALL);

            fillDead(keepCoords.x, keepCoords.y);
        }
    });

    // recalc caves/tunnels
    findCavesTunnels();
    findCaves();

    // remake level if too small
    {
        let size = 0;
        const passable = (x, y) => level[x][y].type === FLOOR && !level[x][y].flooded;
        const callback = (x, y) => {
            size++;
            level[x][y].flooded = true;
        }
        floodFill(startx, starty, passable, callback);
        if (size < 350) {
            return createLevel({
                width,
                height,
                prng,
                startx,
                starty,
            });
        }
    }

    // calculate light values
    forEachTile((x, y) => {
        level[x][y].light = 0;
    });
    forEachInnerTile((x, y) => {
        const tile = level[x][y];
        if (tile.type === FLOOR) {
            const transparent = (x, y) => level[x][y].type === FLOOR;
            const reveal = (x, y) => {
                level[x][y].light++;
            };
            fov(x, y, transparent, reveal);
        }
    });

    forEachInnerTile((x, y) => {
        if (level[x][y].cave) {
            //level[x][y].type = GRASS;
        }
    });

    return level;
};

// ===== //
// #Game //
// ===== //

const createGame = ({
    width,
    height,
    mainPrng,
    levelPrng,
    updateTile,
    animatedUpdateTile,
    updateDraw,
}) => {
    const game = {};

    const forEachTile = forEachTileOfLevel.bind(null, width, height);

    let level = createLevel({
        width,
        height,
        prng: levelPrng,
        animatedUpdateTile,
    });

    /*forEachTile((x, y) => {
        updateTile(x, y, {
            type: level[x][y].type,
            light: level[x][y].light,
        });
    });*/

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
        color: '#BBB',
    },
    FLOOR: {
        spritex: 1,
        spritey: 0,
        color: '#FFF',
    },
    GRASS: {
        spritex: 2,
        spritey: 0,
        color: '#8F8',
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
        level[x][y] = { type: WALL };
    }
}

const forEachTile = forEachTileOfLevel.bind(null, WIDTH, HEIGHT);

const drawTile = (x, y, type) => {
    const ctx = ctxs[y];
    const displayTile = displayTiles[type];
    const realx = (x - (HEIGHT - y - 1) / 2) * XU;
    ctx.clearRect(realx, 0, XU, TILEHEIGHT);
    ctx.drawImage(displayTile.canvas, 0, 0, XU, TILEHEIGHT, realx, 0, XU, TILEHEIGHT);
};

const draw = () => {
    forEachTile((x, y) => {
        if (level[x][y].light) {
            const ctx = ctxs[y];
            const displayTile = displayTiles[level[x][y].type];
            const realx = (x - (HEIGHT - y - 1) / 2) * XU;
            ctx.drawImage(displayTile.canvas, 0, 0, XU, TILEHEIGHT, realx, 0, XU, TILEHEIGHT);
        }
    });
};

// level generation animation
let animating = false;

const tileAnimationQueue = [];

const animateTile = () => {
    const tileAnim = tileAnimationQueue.shift();
    if (!tileAnim) {
        animating = false;
        return;
    }
    const {x, y, type, delay} = tileAnim;
    drawTile(x, y, type);
    setTimeout(animateTile, delay);
};

const animatedUpdateTile = (x, y, type, delay = 100) => {
    tileAnimationQueue.push({x, y, type, delay});
    if (!animating) {
        animating = true;
        animateTile();
    }
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
        mainPrng,
        levelPrng,
        updateTile,
        animatedUpdateTile,
        updateDraw,
    });
};

tileset.addEventListener('load', startGame);
tileset.src = 'tileset2.png';
