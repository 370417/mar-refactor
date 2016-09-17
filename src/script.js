// ===== //
// #PRNG //
// ===== //

const mainSeed = Math.random() + '';
const mainPrng = new Math.seedrandom(mainSeed);

// entrance has a tunnel level
// const levelSeed = '0.5994896435923509';

const levelSeed = Math.random() + '';
console.log(levelSeed);
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
const STAIRSDOWN = 3;

const TILES = {
    WALL,
    FLOOR,
    GRASS,
    STAIRSDOWN,
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

// Scheduler
const createSchedule = () => ({
    add(event, delta = 0, prev = this) {
        let next = prev.next;
        while (next && next.delta <= delta) {
            delta -= next.delta;
            prev = next;
            next = next.next;
        }
        if (next) {
            next.delta -= delta;
        }
        prev.next = {event, delta, next};
        return prev.next;
    },
    advance() {
        if (!this.next) {
            return undefined;
        }
        const next = this.next;
        this.next = this.next.next;
        return next;
    },
});

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
    reveal(ox, oy, 0);

    const revealWall = (x, y, radius) => {
        if (!transparent(x, y)) {
            reveal(x, y, radius);
        }
    };

    for (const key in directions) {
        const {dx, dy} = directions[key];
        revealWall(ox + dx, oy + dy, 1);
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
                    reveal(x, y, radius);
                    someRevealed = true;
                    if (radius < range) {
                        if (current >= 0 && current <= 2) { revealWall(x + 1, y - 1, radius + 1); }
                        if (current >= 1 && current <= 3) { revealWall(x    , y - 1, radius + 1); }
                        if (current >= 2 && current <= 4) { revealWall(x - 1, y    , radius + 1); }
                        if (current >= 3 && current <= 5) { revealWall(x - 1, y + 1, radius + 1); }
                        if (current >= 4 && current <= 6) { revealWall(x    , y + 1, radius + 1); }
                        if (current <= 1 || current >= 5) { revealWall(x + 1, y    , radius + 1); }
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
// #Actor //
// ====== //

const baseActor = {
    delay: 100,
};

// turn an onject into an actor prototype
const asActor = attributes => {
    const base = Object.create(baseActor);
    for (const key in attributes) {
        base[key] = attributes[key];
    }
    return base;
};

const actors = {
    player: {

    },
};

// manually do inhertance for actors
for (const key in actors) {
    actors[key].name = key;
    actors[key] = asActor(actors[key]);
}

const createActor = name => {
    const actor = Object.create(actors[name]);
    return actor;
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
    player,
}) => {
    let last;
    const animTile = (x, y, type, delta = 1) => {
        last = animationQueue.add({x, y, type: 'setTile', tile: {
            type,
            visible: level[x][y].visible,
            seen: true,
        }}, delta, last);
    };

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
    animTile(startx, starty, FLOOR);
    
    // animate border
    for (let x = Math.floor(height / 2), y = 0; x < width; x++) {
        animTile(x, y, WALL);
    }
    for (let x = width - 1, y = 1; y < height; y++, x = width - Math.floor(y / 2) - 1) {
        animTile(x, y, WALL);
    }
    for (let x = width - Math.floor(height / 2) - 1, y = height - 1; x >= 0; x--) {
        animTile(x, y, WALL);
    }
    for (let x = 0, y = height - 1; y > 0; y--, x = Math.floor((height - y) / 2)) {
        animTile(x, y, WALL);
    }

    // start animating main algo while border is animating
    last = animationQueue;

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
            animTile(x, y, FLOOR, i % 6 ? 0 : 1);
        } else if (level[x][y].type === WALL) {
            animTile(x, y, WALL, i % 6 ? 0 : 1);
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
                animTile(x, y, FLOOR);
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
            animTile(x, y, WALL);
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
        if (!level[x][y].tunnel || countGroups(x, y, (x, y) => level[x][y].type === FLOOR) > 1) {
            return;
        }

        level[x][y] = { type: WALL };
        animTile(x, y, WALL);

        for (const key in directions) {
            const {dx, dy} = directions[key];
            if (x === startx && y === starty && level[x+dx][y+dy].type === FLOOR) {
                startx = x + dx;
                starty + x + dy;
            }
            fillDead(x + dx, y + dy);
        }
    };
    const fillDeadEnds = () => {
        forEachInnerTile((x, y) => {
            if (level[x][y].cave && surrounded(x, y, isNotCave)) {
                level[x][y].tunnel = true;
                fillDead(x, y);
            }
        });
    }
    fillDeadEnds();

    // find groups of wall totally surrounded by tunnel and turn them to floor
    const carveTunnelLoops = () => {
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
                    animTile(x, y, FLOOR);
                });
            }
        });
    }

    // recalculate cave/tunnel status and fill any new dead ends
    findCavesTunnels();
    fillDeadEnds();

    // look for any new tunnel loops
    carveTunnelLoops();

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
    findCaves();

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
            animTile(fillCoords.x, fillCoords.y, WALL);

            level[keepCoords.x][keepCoords.y].tunnel = true;
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
        if (size < 314) {
            // clear animationQueue so that previous level and this one don't get drawn at the same time
            animationQueue.next = undefined;
            return createLevel({
                width,
                height,
                prng,
                startx,
                starty,
                player,
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
                level[x][y].seen = true;
                level[x][y].light++;
            };
            fov(x, y, transparent, reveal);
        }
    });


    let lastBeforeFov = last;
    // for animation, erase walls with no light value
    forEachTile((x, y) => {
        if (!level[x][y].light) {
            if (x > Math.floor((height - y) / 2)) {
                last = animationQueue.add({x, y, type: 'setTile', tile: {
                    type: WALL,
                    visible: false,
                    seen: false,
                }}, 0, last);
            } else {
                last = animationQueue.add({x, y, type: 'setTile', tile: {
                    type: WALL,
                    visible: false,
                    seen: false,
                }}, 3, last);
            }
        }
    });

    // place exit
    let placedExit = false;
    for (let i = 0; i < scrambledTiles.length; i++) {
        const {x, y} = scrambledTiles[i];
        if (!placedExit && level[x][y].cave && level[x][y].type === FLOOR && level[x][y].cave.tiles.length <= 12) {
            level[x][y].type = STAIRSDOWN;
            animTile(x, y, STAIRSDOWN);
            placedExit = true;
        }
    }
    if (!placedExit) {
        for (let i = 0; i < scrambledTiles.length; i++) {
            const {x, y} = scrambledTiles[i];
            if (!placedExit && level[x][y].type === FLOOR) {
                level[x][y].type = STAIRSDOWN;
                animTile(x, y, STAIRSDOWN);
                placedExit = true;
            }
        }
    }

    // place player
    player.x = startx;
    player.y = starty;
    level[startx][starty].actor = player;

    animationQueue.add({
        x: player.x,
        y: player.y,
        type: 'createActor',
        actor: {
            type: 'player',
            hp: 100,
    }}, 1, lastBeforeFov);

    // animate fov
    {
        const transparent = (x, y) => level[x][y].type === FLOOR;
        const reveal = (x, y, radius) => {
            level[x][y].visible = true;
            animationQueue.add({x, y, type: 'setTile', tile: {
                type: level[x][y].type,
                visible: true,
                seen: true,
            }}, 3 * radius + 1, lastBeforeFov);
        };
        fov(player.x, player.y, transparent, reveal);
    }
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
}) => {
    const game = {};

    const forEachTile = forEachTileOfLevel.bind(null, width, height);

    // create player
    const player = createActor('player');

    let level = createLevel({
        width,
        height,
        prng: levelPrng,
        player,
    });

    inputMode.push('animating');
    animate();
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
        color: 'hsl(40, 10%, 75%)',
    },
    FLOOR: {
        spritex: 1,
        spritey: 0,
        color: 'hsl(0, 0%, 100%)',
    },
    GRASS: {
        spritex: 2,
        spritey: 0,
        color: 'hsl(120, 50%, 50%)',
    },
    STAIRSDOWN: {
        spritex: 8,
        spritey: 0,
        color: 'hsl(40, 0%, 75%)',
    },
};

const displayActors = {
    player: {
        spritex: 0,
        spritey: 1,
        color: 'hsl(0, 0%, 100%)',
    },
};

const cacheTile = (tile) => {
    const canvas = document.createElement('canvas');
    canvas.width = XU;
    canvas.height = TILEHEIGHT;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(tileset, tile.spritex * XU, tile.spritey * TILEHEIGHT, XU, TILEHEIGHT, 0, 0, XU, TILEHEIGHT);
    ctx.fillStyle = tile.color;
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillRect(0, 0, XU, TILEHEIGHT);
    tile.canvas = canvas;

    const bgcanvas = document.createElement('canvas');
    bgcanvas.width = XU;
    bgcanvas.height = TILEHEIGHT;
    const bgctx = bgcanvas.getContext('2d');
    bgctx.drawImage(canvas, 0, 0, XU, TILEHEIGHT);
    bgctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    bgctx.globalCompositeOperation = 'source-atop';
    bgctx.fillRect(0, 0, XU, TILEHEIGHT);
    tile.bgcanvas = bgcanvas;
};

const cacheTiles = () => {
    for (const TILE in TILES) {
        const displayTile = displayTiles[TILE];
        cacheTile(displayTile);
        displayTiles[TILES[TILE]] = displayTiles[TILE];
    }
    for (const type in displayActors) {
        const displayActor = displayActors[type];
        cacheTile(displayActor);
    }
};

const displayLevel = [];
for (let x = 0; x < WIDTH; x++) {
    displayLevel[x] = [];
    for (let y = 0; y < HEIGHT; y++) {
        displayLevel[x][y] = {};
    }
}

const forEachTile = forEachTileOfLevel.bind(null, WIDTH, HEIGHT);

const drawTile = (x, y, {type, seen, visible}) => {
    if (!seen || displayLevel[x][y].actor) {
        return;
    }
    const ctx = ctxs[y];
    const displayTile = displayTiles[type];
    const realx = (x - (HEIGHT - y - 1) / 2) * XU;
    ctx.clearRect(realx, 0, XU, TILEHEIGHT);
    if (visible) {
        ctx.drawImage(displayTile.canvas, 0, 0, XU, TILEHEIGHT, realx, 0, XU, TILEHEIGHT);
    } else {
        ctx.drawImage(displayTile.bgcanvas, 0, 0, XU, TILEHEIGHT, realx, 0, XU, TILEHEIGHT);
    }
};

const drawActor = (x, y, {type}) => {
    const ctx = ctxs[y];
    const displayActor = displayActors[type];
    const realx = (x - (HEIGHT - y - 1) / 2) * XU;
    ctx.clearRect(realx, 0, XU, TILEHEIGHT);
    ctx.drawImage(displayActor.canvas, 0, 0, XU, TILEHEIGHT, realx, 0, XU, TILEHEIGHT);
};

// ========== //
// #Animation //
// ========== //

const animationQueue = createSchedule();

const setTickout = (fun, tick) => {
    if (tick <= 0) {
        fun();
    } else {
        requestAnimationFrame(() => {
            setTickout(fun, tick - 1);
        });
    }
};

const animate = () => {
    const next = animationQueue.advance();
    if (!next) {
        inputMode.pop();
        return;
    }
    let nextFrame;
    const {event: {x, y, type, tile, actor}, delta} = next;
    if (type === 'setTile') {
        nextFrame = () => {
            for (const key in tile) {
                displayLevel[x][y][key] = tile[key];
            }
            drawTile(x, y, tile);
            animate();
        };
    } else if (type === 'createActor') {
        nextFrame = () => {
            displayLevel[x][y].actor = actor;
            drawActor(x, y, actor);
            animate();
        };
    }
    if (delta && currMode() === 'animating') {
        setTickout(nextFrame, delta);
    } else {
        nextFrame();
    }
};

let game;
const startGame = () => {
    cacheTiles();
    game = createGame({
        width: WIDTH,
        height: HEIGHT,
        mainPrng,
        levelPrng,
    });
};

// ====== //
// #Input //
// ====== //

const keyCode2code = {
    '27': 'Escape',
    '32': 'Space',
    '37': 'ArrowLeft',
    '38': 'ArrowUp',
    '39': 'ArrowRight',
    '40': 'ArrowDown',
    '65': 'KeyA',
    '66': 'KeyB',
    '67': 'KeyC',
    '68': 'KeyD',
    '69': 'KeyE',
    '70': 'KeyF',
    '71': 'KeyG',
    '72': 'KeyH',
    '73': 'KeyI',
    '74': 'KeyJ',
    '75': 'KeyK',
    '76': 'KeyL',
    '77': 'KeyM',
    '78': 'KeyN',
    '79': 'KeyO',
    '80': 'KeyP',
    '81': 'KeyQ',
    '82': 'KeyR',
    '83': 'KeyS',
    '84': 'KeyT',
    '85': 'KeyU',
    '86': 'KeyV',
    '87': 'KeyW',
    '88': 'KeyX',
    '89': 'KeyY',
    '90': 'KeyZ',
};

// stack of modes for input
const inputMode = ['playing'];
const currMode = () => inputMode[inputMode.length-1];

// handles keydown for each mode
const modalKeydown = {
    animating: (code) => {
        // skip animation
        inputMode[inputMode.length-1] = 'skipping';
    },
    playing: (code) => {
        
    },
};

const keydown = (e) => {
    const code = e.code || keyCode2code[e.keyCode];

    modalKeydown[currMode()](code);
};

// start game
tileset.addEventListener('load', startGame);
tileset.src = 'tileset2.png';

// add listeners
window.addEventListener('keydown', keydown);
