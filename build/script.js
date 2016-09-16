'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

// ===== //
// #PRNG //
// ===== //

var mainSeed = Math.random() + '';
var mainPrng = new Math.seedrandom(mainSeed);

// entrance has a tunnel level
// const levelSeed = '0.5994896435923509';

var levelSeed = Math.random() + '';
console.log(levelSeed);
var levelPrng = new Math.seedrandom(levelSeed);

Math.random = undefined;

// =========== //
// #Directions //
// =========== //

// direction names are based on clock directions
var DIR1 = {
    dx: 1,
    dy: -1,
    dz: 0
};
var DIR3 = {
    dx: 1,
    dy: 0,
    dz: -1
};
var DIR5 = {
    dx: 0,
    dy: 1,
    dz: -1
};
var DIR7 = {
    dx: -1,
    dy: 1,
    dz: 0
};
var DIR9 = {
    dx: -1,
    dy: 0,
    dz: 1
};
var DIR11 = {
    dx: 0,
    dy: -1,
    dz: 1
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

var directions = { DIR1: DIR1, DIR3: DIR3, DIR5: DIR5, DIR7: DIR7, DIR9: DIR9, DIR11: DIR11 };

// ====== //
// #Tiles //
// ====== //

var WALL = 0;
var FLOOR = 1;
var GRASS = 2;
var BLANK = -1;
var STAIRSDOWN = 3;

var TILES = {
    WALL: WALL,
    FLOOR: FLOOR,
    GRASS: GRASS,
    BLANK: BLANK,
    STAIRSDOWN: STAIRSDOWN
};

// ========== //
// #Utilities //
// ========== //

// generate a random integer in the interval [min, max]
var randInt = function randInt(min, max, prng) {
    if (min > max) {
        console.error('randInt: min > max');
        return NaN;
    }
    return min + (max - min + 1) * prng() << 0;
};

// pick a random element of an array or object
var randElement = function randElement(array, prng) {
    var keys = Object.keys(array);
    return array[keys[randInt(0, array.length - 1, prng)]];
};

var forEachTileOfLevel = function forEachTileOfLevel(width, height, fun) {
    for (var y = 0; y < height; y++) {
        for (var x = Math.floor((height - y) / 2); x < width - Math.floor(y / 2); x++) {
            fun(x, y);
        }
    }
};

var forEachInnerTileOfLevel = function forEachInnerTileOfLevel(width, height, fun) {
    for (var y = 1; y < height - 1; y++) {
        for (var x = Math.floor((height - y) / 2) + 1; x < width - Math.floor(y / 2) - 1; x++) {
            fun(x, y);
        }
    }
};

var inBounds = function inBounds(width, height, x, y) {
    return y >= 0 && y < height && x >= Math.floor((height - y) / 2) && x < width - Math.floor(y / 2);
};

var inInnerBounds = function inInnerBounds(width, height, x, y) {
    return y > 0 && y < height - 1 && x > Math.floor((height - y) / 2) && x < width - Math.floor(y / 2) - 1;
};

var surrounded = function surrounded(x, y, isType) {
    for (var key in directions) {
        var _directions$key = directions[key];
        var dx = _directions$key.dx;
        var dy = _directions$key.dy;

        if (!isType(x + dx, y + dy)) {
            return false;
        }
    }
    return true;
};

// count the number of contiguous groups of a tile type around a tile
var countGroups = function countGroups(x, y, isType) {
    var groups = 0;
    var prevx = x + DIR11.dx;
    var prevy = y + DIR11.dy;
    for (var i = 0, dir = DIR1; i < 6; i++, dir = dir.clockwise) {
        var currx = x + dir.dx;
        var curry = y + dir.dy;
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

var floodFill = function floodFill(x, y, passable, callback) {
    if (passable(x, y)) {
        callback(x, y);
        for (var key in directions) {
            var _directions$key2 = directions[key];
            var dx = _directions$key2.dx;
            var dy = _directions$key2.dy;

            floodFill(x + dx, y + dy, passable, callback);
        }
    }
};

// round a number, but round down in case of x.5
var roundTieDown = function roundTieDown(n) {
    return Math.ceil(n - 0.5);
};

// ==== //
// #FOV //
// ==== //

// displacement vector for moving tangent to a circle counterclockwise in a certain sector
var tangent = [{ x: 0, y: -1 }, //  \
{ x: -1, y: 0 }, //  -
{ x: -1, y: 1 }, //  /
{ x: 0, y: 1 }, //  \
{ x: 1, y: 0 }, //  -
{ x: 1, y: -1 }, //  /
{ x: 0, y: -1 }];

// displacement vector for moving normal to a circle outward in a certain sector
var normal = [{ x: 1, y: 0 }, // -
{ x: 1, y: -1 }, // /
{ x: 0, y: -1 }, // \
{ x: -1, y: 0 }, // -
{ x: -1, y: 1 }, // /
{ x: 0, y: 1 }, // \
{ x: 1, y: 0 }];

var fov = function fov(ox, oy, transparent, reveal) {
    var range = arguments.length <= 4 || arguments[4] === undefined ? 9e9 : arguments[4];

    reveal(ox, oy);

    var revealWall = function revealWall(x, y) {
        if (!transparent(x, y)) {
            reveal(x, y);
        }
    };

    for (var key in directions) {
        var _directions$key3 = directions[key];
        var dx = _directions$key3.dx;
        var dy = _directions$key3.dy;

        revealWall(ox + dx, oy + dy);
    }

    var polar2rect = function polar2rect(radius, angle) {
        var sector = Math.floor(angle);
        var arc = roundTieDown((angle - sector) * (radius - 0.5));
        return {
            x: ox + radius * normal[sector].x + arc * tangent[sector].x,
            y: oy + radius * normal[sector].y + arc * tangent[sector].y,
            arc: radius * sector + arc
        };
    };

    var scan = function scan(radius, start, end) {
        if (radius > range) {
            return;
        }
        var someRevealed = false;

        var _polar2rect = polar2rect(radius, start);

        var x = _polar2rect.x;
        var y = _polar2rect.y;
        var arc = _polar2rect.arc;

        var current = start;
        while (current < end) {
            if (transparent(x, y)) {
                current = arc / radius;
                if (current >= start && current <= end) {
                    reveal(x, y);
                    someRevealed = true;
                    if (radius < range) {
                        if (current >= 0 && current <= 2) {
                            revealWall(x + 1, y - 1);
                        }
                        if (current >= 1 && current <= 3) {
                            revealWall(x, y - 1);
                        }
                        if (current >= 2 && current <= 4) {
                            revealWall(x - 1, y);
                        }
                        if (current >= 3 && current <= 5) {
                            revealWall(x - 1, y + 1);
                        }
                        if (current >= 4 && current <= 6) {
                            revealWall(x, y + 1);
                        }
                        if (current <= 1 || current >= 5) {
                            revealWall(x + 1, y);
                        }
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
            var displacement = tangent[Math.floor(arc / radius)];
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

var baseActor = {
    delay: 100
};

// turn an onject into an actor prototypw
var asActor = function asActor(attributes) {
    var base = Object.create(baseActor);
    for (var key in attributes) {
        base[key] = attributes[key];
    }
    return base;
};

var actors = {
    player: {}
};

// manually do inhertance for actors
for (var key in actors) {
    actors[key].name = key;
    actors[key] = asActor(actors[key]);
}

var createActor = function createActor(name) {
    var actor = Object.create(actors[name]);
    return actor;
};

// ====== //
// #Level //
// ====== //

var createLevel = function createLevel(_ref) {
    var width = _ref.width;
    var height = _ref.height;
    var prng = _ref.prng;
    var _ref$startx = _ref.startx;
    var startx = _ref$startx === undefined ? 24 : _ref$startx;
    var _ref$starty = _ref.starty;
    var starty = _ref$starty === undefined ? 15 : _ref$starty;
    var _ref$animatedUpdatedT = _ref.animatedUpdatedTile;
    var animatedUpdatedTile = _ref$animatedUpdatedT === undefined ? function () {} : _ref$animatedUpdatedT;
    var player = _ref.player;

    var level = [];

    for (var x = 0; x < width; x++) {
        level[x] = [];
        for (var y = 0; y < height; y++) {
            level[x][y] = {
                type: WALL
            };
        }
    }

    var forEachTile = forEachTileOfLevel.bind(null, width, height);
    var forEachInnerTile = forEachInnerTileOfLevel.bind(null, width, height);

    var findCavesTunnels = function findCavesTunnels() {
        var isFloor = function isFloor(x, y) {
            return level[x][y].type === FLOOR;
        };
        forEachInnerTile(function (x, y) {
            var tile = level[x][y];
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
    forEachTile(function (x, y) {
        if (!inInnerBounds(width, height, x, y)) {
            if (y === 0 || y === height - 1) {
                animatedUpdateTile(x, y, WALL, 10);
            } else {
                animatedUpdateTile(x, y, WALL, 5);
            }
        }
    });

    // main algorithm
    var scrambledTiles = [];
    forEachInnerTile(function (x, y) {
        scrambledTiles.splice(randInt(0, scrambledTiles.length, prng), 0, { x: x, y: y });
    });

    var isWall = function isWall(x, y) {
        return level[x][y].type === WALL;
    };

    for (var i = 0; i < scrambledTiles.length; i++) {
        var _scrambledTiles$i = scrambledTiles[i];
        var _x2 = _scrambledTiles$i.x;
        var _y = _scrambledTiles$i.y;

        if (surrounded(_x2, _y, isWall) || countGroups(_x2, _y, isWall) !== 1) {
            level[_x2][_y].type = FLOOR;
            animatedUpdateTile(_x2, _y, FLOOR, 5);
        } else if (level[_x2][_y].type === WALL) {
            animatedUpdateTile(_x2, _y, WALL, 5);
        }
    }

    // find size of wall groups
    forEachTile(function (x, y) {
        if (level[x][y].type === FLOOR || level[x][y].wallGroup) {
            return;
        }
        var wallGroup = { size: 0 };
        var passable = function passable(x, y) {
            return inBounds(width, height, x, y) && level[x][y].type === WALL && !level[x][y].wallGroup;
        };
        var callback = function callback(x, y) {
            level[x][y].wallGroup = wallGroup;
            wallGroup.size++;
        };
        floodFill(x, y, passable, callback);
    });

    // remove wall groups with <6 walls
    forEachTile(function (x, y) {
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
        (function () {
            var mainCaveSize = 0;
            var passable = function passable(x, y) {
                return level[x][y].type === FLOOR && !level[x][y].flooded;
            };
            var callback = function callback(x, y) {
                level[x][y].flooded = true;
                mainCaveSize++;
            };
            floodFill(startx, starty, passable, callback);
        })();
    }

    // fill in other discontinuous caves
    forEachInnerTile(function (x, y) {
        if (level[x][y].type === FLOOR && !level[x][y].flooded) {
            level[x][y] = { type: WALL };
            animatedUpdateTile(x, y, WALL);
        }
    });

    // clear flooded flag
    forEachTile(function (x, y) {
        level[x][y].flooded = false;
    });

    findCavesTunnels();

    // fill in dead ends
    var isNotCave = function isNotCave(x, y) {
        return !level[x][y].cave;
    };
    var fillDead = function fillDead(x, y) {
        if (!level[x][y].tunnel || countGroups(x, y, function (x, y) {
            return level[x][y].type === FLOOR;
        }) > 1) {
            return;
        }
        if (x === startx && y === starty) {
            level[x][y].tunnel = false;
            level[x][y].cave = true;
            return;
        }

        level[x][y] = { type: WALL };
        animatedUpdateTile(x, y, WALL);

        for (var _key in directions) {
            var _directions$_key = directions[_key];
            var dx = _directions$_key.dx;
            var dy = _directions$_key.dy;

            fillDead(x + dx, y + dy);
        }
    };
    var fillDeadEnds = function fillDeadEnds() {
        forEachInnerTile(function (x, y) {
            if (level[x][y].cave && surrounded(x, y, isNotCave)) {
                level[x][y].tunnel = true;
                fillDead(x, y);
            }
        });
    };
    fillDeadEnds();

    // find groups of wall totally surrounded by tunnel and turn them to floor
    var carveTunnelLoops = function carveTunnelLoops() {
        forEachInnerTile(function (x, y) {
            if (level[x][y].type === FLOOR || level[x][y].flooded) {
                return;
            }
            var surroundedByTunnel = true;
            var passable = function passable(x, y) {
                if (!inInnerBounds(width, height, x, y) || level[x][y].cave) {
                    surroundedByTunnel = false;
                }
                return inBounds(width, height, x, y) && level[x][y].type === WALL && !level[x][y].flooded;
            };
            var callback = function callback(x, y) {
                level[x][y].flooded = true;
            };
            floodFill(x, y, passable, callback);

            if (surroundedByTunnel) {
                floodFill(x, y, function (x, y) {
                    return level[x][y].type === WALL;
                }, function (x, y) {
                    level[x][y].type = FLOOR;
                    animatedUpdateTile(x, y, FLOOR);
                });
            }
        });
    };

    // recalculate cave/tunnel status and fill any new dead ends
    findCavesTunnels();
    fillDeadEnds();

    // look for any new tunnel loops
    carveTunnelLoops();

    // floodfill caves
    var findCaves = function findCaves() {
        forEachInnerTile(function (x, y) {
            if (level[x][y].cave === true) {
                (function () {
                    var cave = {
                        tiles: []
                    };
                    var passable = function passable(x, y) {
                        return level[x][y].cave === true;
                    };
                    var callback = function callback(x, y) {
                        cave.tiles.push({ x: x, y: y });
                        level[x][y].cave = cave;
                    };
                    floodFill(x, y, passable, callback);
                })();
            }
        });
    };
    findCaves();

    // remove 2-tile caves
    forEachInnerTile(function (x, y) {
        var tile = level[x][y];
        if (tile.cave && tile.cave !== true && tile.cave.tiles.length === 2) {
            console.log('double found!');
            var keep = Math.round(prng());
            var fill = 1 - keep;
            var keepCoords = tile.cave.tiles[keep];
            var fillCoords = tile.cave.tiles[fill];
            tile.cave.tiles.splice(fill, 1);

            level[fillCoords.x][fillCoords.y] = { type: WALL };
            animatedUpdateTile(fillCoords.x, fillCoords.y, WALL);

            level[keepCoords.x][keepCoords.y].tunnel = true;
            fillDead(keepCoords.x, keepCoords.y);
        }
    });

    // recalc caves/tunnels
    findCavesTunnels();
    findCaves();

    // remake level if too small
    {
        var _ret3 = function () {
            var size = 0;
            var passable = function passable(x, y) {
                return level[x][y].type === FLOOR && !level[x][y].flooded;
            };
            var callback = function callback(x, y) {
                size++;
                level[x][y].flooded = true;
            };
            floodFill(startx, starty, passable, callback);
            if (size < 314) {
                return {
                    v: createLevel({
                        width: width,
                        height: height,
                        prng: prng,
                        startx: startx,
                        starty: starty
                    })
                };
            }
        }();

        if ((typeof _ret3 === 'undefined' ? 'undefined' : _typeof(_ret3)) === "object") return _ret3.v;
    }

    // calculate light values
    forEachTile(function (x, y) {
        level[x][y].light = 0;
    });
    forEachInnerTile(function (x, y) {
        var tile = level[x][y];
        if (tile.type === FLOOR) {
            var transparent = function transparent(x, y) {
                return level[x][y].type === FLOOR;
            };
            var reveal = function reveal(x, y) {
                level[x][y].light++;
            };
            fov(x, y, transparent, reveal);
        }
    });

    // for animation, erase walls with no light value
    forEachTile(function (x, y) {
        if (!level[x][y].light) {
            animatedUpdateTile(x, y, BLANK);
        }
    });

    // place exit
    var placedExit = false;
    for (var _i = 0; _i < scrambledTiles.length; _i++) {
        var _scrambledTiles$_i = scrambledTiles[_i];
        var _x3 = _scrambledTiles$_i.x;
        var _y2 = _scrambledTiles$_i.y;

        if (!placedExit && level[_x3][_y2].cave && level[_x3][_y2].type === FLOOR && level[_x3][_y2].cave.tiles.length <= 12) {
            level[_x3][_y2].type = STAIRSDOWN;
            animatedUpdateTile(_x3, _y2, STAIRSDOWN);
            placedExit = true;
        }
    }
    if (!placedExit) {
        for (var _i2 = 0; _i2 < scrambledTiles.length; _i2++) {
            var _scrambledTiles$_i2 = scrambledTiles[_i2];
            var _x4 = _scrambledTiles$_i2.x;
            var _y3 = _scrambledTiles$_i2.y;

            if (!placedExit && level[_x4][_y3].type === FLOOR) {
                level[_x4][_y3].type = STAIRSDOWN;
                animatedUpdateTile(_x4, _y3, STAIRSDOWN);
                placedExit = true;
            }
        }
    }

    // place player
    player.x = startx;
    player.y = starty;
    level[startx][starty].actor = player;

    return level;
};

// ===== //
// #Game //
// ===== //

var createGame = function createGame(_ref2) {
    var width = _ref2.width;
    var height = _ref2.height;
    var mainPrng = _ref2.mainPrng;
    var levelPrng = _ref2.levelPrng;
    var updateTile = _ref2.updateTile;
    var animatedUpdateTile = _ref2.animatedUpdateTile;
    var updateDraw = _ref2.updateDraw;

    var game = {};

    var forEachTile = forEachTileOfLevel.bind(null, width, height);

    // create player
    var player = createActor('player');

    var level = createLevel({
        width: width,
        height: height,
        prng: levelPrng,
        animatedUpdateTile: animatedUpdateTile,
        player: player
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

var WIDTH = 48;
var HEIGHT = 31;

var XU = 18;
var TILEHEIGHT = 24;
var YU = 16;

var $game = document.getElementById('game');
$game.style.width = (WIDTH - HEIGHT / 2 + 1) * XU + 'px';
$game.style.height = TILEHEIGHT + (HEIGHT - 1) * YU + 'px';

var canvases = [];
var bgcanvases = [];
var ctxs = [];
var bgctxs = [];
for (var i = 0; i < HEIGHT; i++) {
    var canvas = document.createElement('canvas');
    canvas.width = (WIDTH - HEIGHT / 2 + 1) * XU;
    canvas.height = TILEHEIGHT;
    canvas.style.top = i * YU + 'px';
    var ctx = canvas.getContext('2d');
    canvases[i] = canvas;
    ctxs[i] = ctx;

    var bgcanvas = document.createElement('canvas');
    bgcanvas.width = canvas.width;
    bgcanvas.height = canvas.height;
    bgcanvas.style.top = canvas.style.top;
    var bgctx = bgcanvas.getContext('2d');
    bgcanvases[i] = bgcanvas;
    bgctxs[i] = bgctx;

    $game.appendChild(bgcanvas);
    $game.appendChild(canvas);
}

// Visual info for tiles
var tileset = document.createElement('img');

var displayTiles = {
    WALL: {
        spritex: 0,
        spritey: 0,
        color: 'hsl(40, 10%, 75%)',
        darker: 'hsl(40, 10%, 30%)'
    },
    FLOOR: {
        spritex: 1,
        spritey: 0,
        color: 'hsl(0, 0%, 100%)',
        darker: 'hsl(0, 0%, 40%)'
    },
    GRASS: {
        spritex: 2,
        spritey: 0,
        color: 'hsl(120, 50%, 50%)',
        darker: 'hsl(120, 50%, 20%)'
    },
    BLANK: {
        spritex: 0,
        spritey: 0,
        color: 'transparent',
        darker: 'transparent'
    },
    STAIRSDOWN: {
        spritex: 8,
        spritey: 0,
        color: 'hsl(40, 0%, 75%)',
        darker: 'hsl(40, 0%, 30%)'
    }
};

var cacheTiles = function cacheTiles() {
    for (var TILE in TILES) {
        var displayTile = displayTiles[TILE];
        var _canvas = document.createElement('canvas');
        _canvas.width = XU;
        _canvas.height = TILEHEIGHT;
        var _ctx = _canvas.getContext('2d');
        _ctx.drawImage(tileset, displayTile.spritex * XU, displayTile.spritey * TILEHEIGHT, XU, TILEHEIGHT, 0, 0, XU, TILEHEIGHT);
        _ctx.fillStyle = displayTile.color;
        _ctx.globalCompositeOperation = 'source-in';
        _ctx.fillRect(0, 0, XU, TILEHEIGHT);
        displayTile.canvas = _canvas;

        displayTiles[TILES[TILE]] = displayTiles[TILE];
    }
};

var level = [];
for (var x = 0; x < WIDTH; x++) {
    level[x] = [];
    for (var y = 0; y < HEIGHT; y++) {
        level[x][y] = { type: WALL };
    }
}

var forEachTile = forEachTileOfLevel.bind(null, WIDTH, HEIGHT);

var drawTile = function drawTile(x, y, type) {
    var ctx = ctxs[y];
    var displayTile = displayTiles[type];
    var realx = (x - (HEIGHT - y - 1) / 2) * XU;
    ctx.clearRect(realx, 0, XU, TILEHEIGHT);
    ctx.drawImage(displayTile.canvas, 0, 0, XU, TILEHEIGHT, realx, 0, XU, TILEHEIGHT);
};

var draw = function draw() {
    forEachTile(function (x, y) {
        if (level[x][y].light) {
            var _ctx2 = ctxs[y];
            var displayTile = displayTiles[level[x][y].type];
            var realx = (x - (HEIGHT - y - 1) / 2) * XU;
            _ctx2.drawImage(displayTile.canvas, 0, 0, XU, TILEHEIGHT, realx, 0, XU, TILEHEIGHT);
        }
    });
};

// animate level generation animation
var tileAnimationQueue = [];

var animateTile = function animateTile() {
    var tileAnim = tileAnimationQueue.shift();
    if (!tileAnim) {
        inputMode.pop();
        return;
    }
    var x = tileAnim.x;
    var y = tileAnim.y;
    var type = tileAnim.type;
    var delay = tileAnim.delay;

    drawTile(x, y, type);
    if (currMode() === 'animating') {
        setTimeout(animateTile, delay);
    } else {
        animateTile();
    }
};

var animatedUpdateTile = function animatedUpdateTile(x, y, type) {
    var delay = arguments.length <= 3 || arguments[3] === undefined ? 16 : arguments[3];

    tileAnimationQueue.push({ x: x, y: y, type: type, delay: delay });
    if (currMode() !== 'animating') {
        inputMode.push('animating');
        animateTile();
    }
};

var updateTile = function updateTile(x, y, attributes) {
    for (var _key2 in attributes) {
        level[x][y][_key2] = attributes[_key2];
    }
};

// Remove this later ;  display should decide to draw when the player actor is updated
var updateDraw = function updateDraw() {
    draw();
};

var game = void 0;
var startGame = function startGame() {
    cacheTiles();
    game = createGame({
        width: WIDTH,
        height: HEIGHT,
        mainPrng: mainPrng,
        levelPrng: levelPrng,
        updateTile: updateTile,
        animatedUpdateTile: animatedUpdateTile,
        updateDraw: updateDraw
    });
};

// ====== //
// #Input //
// ====== //

var keyCode2code = {
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
    '90': 'KeyZ'
};

// stack of modes for input
var inputMode = ['playing'];
var currMode = function currMode() {
    return inputMode[inputMode.length - 1];
};

// handles keydown for each mode
var modalKeydown = {
    animating: function animating(code) {
        // skip animation
        inputMode[inputMode.length - 1] = 'skipping';
    },
    playing: function playing(code) {}
};

var keydown = function keydown(e) {
    var code = e.code || keyCode2code[e.keyCode];

    modalKeydown[currMode()](code);
};

// start game
tileset.addEventListener('load', startGame);
tileset.src = 'tileset2.png';

// add listeners
window.addEventListener('keydown', keydown);