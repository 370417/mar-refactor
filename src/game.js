const createGame = (() => {

let player;
let level;
let width;
let height;
let animation;
let prng;
let levelPrng;

// the schedule object for the last animation that was added to the animation queue
let prevAnimation;

//========================================
//                                   TILES

const createTile = (() => {
    const tiles = {
        wall: {
            passable: false,
            transparent: false,
            permeable: false,
            cost: Infinity,
        },
        floor: {
            passable: true,
            transparent: true,
            permeable: true,
            cost: 1,
        },
        stairsDown: {
            passable: true,
            transparent: true,
            permeable: true,
            cost: 1,
        },
        tripwire1_7: {
            passable: true,
            transparent: true,
            permeable: true,
            cost: Infinity,
        },
        tripwire3_9: {
            passable: true,
            transparent: true,
            permeable: true,
            cost: Infinity,
        },
        tripwire5_11: {
            passable: true,
            transparent: true,
            permeable: true,
            cost: Infinity,
        },
    };

    // add explicit types
    for (const type in tiles) {
        tiles[type].type = type;
    }

    return (type) => {
        return Object.create(tiles[type]);
    };
})();

//========================================
//                                SCHEDULE

const schedule = createSchedule();

const nextMove = () => {
    const prev = schedule.advance();
    const {event: actor, delta} = prev;
    actor.act(delta);
};

//========================================
//                                  ACTORS

const act = function(delta) {
    return this[this.state](delta);
};

const rest = function(delta) {
    prevAnimation = animation.wait(delta, prevAnimation);

    schedule.add(this, this.delay);
    nextMove();
};

const move = function(dx, dy, delta = 0) {
    if (dx === 0 && dy === 0) {
        this.rest(delta);
    }
    if (level[this.x+dx][this.y+dy].passable) {
        prevAnimation = animation.moveActor(this.x, this.y, dx, dy, delta, prevAnimation);

        level[this.x][this.y].actor = undefined;
        this.x += dx;
        this.y += dy;
        level[this.x][this.y].actor = this;

        this.lastMove = {dx, dy};

        if (this === player) {
            this.see();
        }

        schedule.add(this, this.delay);
        nextMove();
    } else {
        // tell display this accidentally bumped something
    }
};

const wandering = function(delta) {
    const moves = [];
    for (const key in directions) {
        const {dx, dy} = directions[key];
        const tile = level[this.x+dx][this.y+dy];
        if (tile.passable && !tile.actor) {
            moves.push({dx, dy});
        }
    }
    if (moves.length) {
        const {dx, dy} = randElement(moves, prng);
        this.move(dx, dy, delta);
    } else {
        this.rest(delta);
    }
};

// create an actor
const createActor = (() => {
    const baseActor = {
        act,
        move,
        lastMove: { dx: 0, dy: 0 },
        rest,
        delay: 24,
    };

    const actors = {
        player: {
            state: 'playing',
            see() {
                const transparent = (x, y) => level[x][y].transparent;
                const reveal = (x, y) => {
                    const tile = level[x][y];
                    tile.newvisible = true;
                    tile.seen = true;
                };
                fov(this.x, this.y, transparent, reveal);
                forEachTileOfLevel(width, height, (x, y) => {
                    const tile = level[x][y];
                    if (!!tile.newvisible === !tile.visible) {
                        tile.newvisible = false;
                        tile.visible = !tile.visible;
                        animation.queueTile(x, y, level[x][y].type, level[x][y].visible, true, 0, prevAnimation);
                    }
                    tile.newvisible = false;
                });
            },
        },
        wolf: {
            state: 'wandering',
            wandering,
            delay: 12,
        },
    };

    // turn an object into an actor prototype
    const asActor = attributes => {
        const base = Object.create(baseActor);
        for (const key in attributes) {
            base[key] = attributes[key];
        }
        return base;
    };

    // make all actors inherit from baseActor
    for (const type in actors) {
        actors[type].type = type;
        actors[type] = asActor(actors[type]);
    }

    return (type, x, y) => {
        const actor = Object.create(actors[type]);
        actor.x = x;
        actor.y = y;
        return actor;
    };
})();

//========================================
//                                   INPUT

const input = (action) => {
    if (action.type === 'move') {
        const {dx, dy} = action.direction;
        if (level[player.x+dx][player.y+dy].passable) {
            player.move(dx, dy);
        } else {
            // tell display that player hit something
        }
    } else if (action.type === 'rest') {
        player.rest();
    } else if (action.type === 'interact') {
        if (level[player.x][player.y].type === 'stairsDown') {
            descend();
        }
    }
};

//========================================
//                                   LEVEL

const createLevel = ({
    prng,
    startx = 24,
    starty = 15,
    depth = 1,
}) => {

    let last;
    const animTile = (x, y, type, delta = 1) => {
        last = animation.queueTile(x, y, type, false, true, delta, last);
    };

    const level = [];
    level.depth = depth;
    level.width = width;
    level.height = height;

    for (let x = 0; x < width; x++) {
        level[x] = [];
        for (let y = 0; y < height; y++) {
            level[x][y] = {
                type: 'wall',
            };
        }
    }

    const forEachTile = forEachTileOfLevel.bind(null, width, height);
    const forEachInnerTile = forEachInnerTileOfLevel.bind(null, width, height);
    const inBounds = inBoundsOfLevel.bind(null, width, height);
    const inInnerBounds = inInnerBoundsOfLevel.bind(null, width, height);

    const findCavesTunnels = () => {
        const isFloor = (x, y) => level[x][y].type === 'floor';
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
    level[startx][starty].type = 'floor';
    animTile(startx, starty, 'floor');
    
    // animate border
    for (let x = Math.floor(height / 2), y = 0; x < width; x++) {
        animTile(x, y, 'wall');
    }
    for (let x = width - 1, y = 1; y < height; y++, x = width - Math.floor(y / 2) - 1) {
        animTile(x, y, 'wall');
    }
    for (let x = width - Math.floor(height / 2) - 1, y = height - 1; x >= 0; x--) {
        animTile(x, y, 'wall');
    }
    for (let x = 0, y = height - 1; y > 0; y--, x = Math.floor((height - y) / 2)) {
        animTile(x, y, 'wall');
    }

    // start animating main algo while border is animating
    last = undefined;

    // main algorithm
    const scrambledTiles = [];
    forEachInnerTile((x, y) => {
        scrambledTiles.splice(randInt(0, scrambledTiles.length, prng), 0, {x, y});
    });

    const isWall = (x, y) => level[x][y].type === 'wall';

    for (let i = 0; i < scrambledTiles.length; i++) {
        const {x, y} = scrambledTiles[i];
        if (surrounded(x, y, isWall) || countGroups(x, y, isWall) !== 1) {
            level[x][y].type = 'floor';
            animTile(x, y, 'floor', i % 6 ? 0 : 1);
        } else if (level[x][y].type === 'wall') {
            animTile(x, y, 'wall', i % 6 ? 0 : 1);
        }
    }

    // find size of wall groups
    forEachTile((x, y) => {
        if (level[x][y].type === 'floor' || level[x][y].wallGroup) {
            return;
        }
        const wallGroup = { size: 0 };
        const passable = (x, y) => inBounds(x, y) && level[x][y].type === 'wall' && !level[x][y].wallGroup;
        const callback = (x, y) => {
            level[x][y].wallGroup = wallGroup;
            wallGroup.size++;
        }
        floodFill(x, y, passable, callback);
    });

    // remove wall groups with <6 walls
    forEachTile((x, y) => {
        if (level[x][y].type === 'wall') {
            if (level[x][y].wallGroup.size < 6) {
                level[x][y] = { type: 'floor' };
                animTile(x, y, 'floor');
            } else {
                level[x][y] = { type: 'wall' };
            }
        }
    });

    // find the size of the open space around the starting point
    {
        let mainCaveSize = 0;
        const passable = (x, y) => level[x][y].type === 'floor' && !level[x][y].flooded;
        const callback = (x, y) => {
            level[x][y].flooded = true;
            mainCaveSize++;
        };
        floodFill(startx, starty, passable, callback);
    }

    // fill in other discontinuous caves
    forEachInnerTile((x, y) => {
        if (level[x][y].type === 'floor' && !level[x][y].flooded) {
            level[x][y] = { type: 'wall' };
            animTile(x, y, 'wall');
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
        if (!level[x][y].tunnel || countGroups(x, y, (x, y) => level[x][y].type === 'floor') > 1) {
            return;
        }

        level[x][y] = { type: 'wall' };
        animTile(x, y, 'wall');

        for (const key in directions) {
            const {dx, dy} = directions[key];
            if (x === startx && y === starty && level[x+dx][y+dy].type === 'floor') {
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
            if (level[x][y].type === 'floor' || level[x][y].flooded) {
                return;
            }
            let surroundedByTunnel = true;
            const passable = (x, y) => {
                if (!inInnerBounds(x, y) || level[x][y].cave) {
                    surroundedByTunnel = false;
                }
                return inBounds(x, y) && level[x][y].type === 'wall' && !level[x][y].flooded;
            }
            const callback = (x, y) => {
                level[x][y].flooded = true;
            }
            floodFill(x, y, passable, callback);

            if (surroundedByTunnel) {
                floodFill(x, y, (x, y) => level[x][y].type === 'wall', (x, y) => {
                    level[x][y].type = 'floor';
                    animTile(x, y, 'floor');
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
                    exits: [],
                };
                const hasExit = (x, y) => {
                    for (let i = 0; i < cave.exits.length; i++) {
                        const exit = cave.exits[i];
                        if (x === exit.x && y === exit.y) {
                            return true;
                        }
                    }
                    return false;
                };
                const passable = (x, y) => {
                    if (level[x][y].type === 'floor' && !level[x][y].cave && !hasExit(x, y)) {
                        cave.exits.push({x, y});
                    }
                    return level[x][y].cave === true;
                }
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

            level[fillCoords.x][fillCoords.y] = { type: 'wall' };
            animTile(fillCoords.x, fillCoords.y, 'wall');

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
        const passable = (x, y) => level[x][y].type === 'floor' && !level[x][y].flooded;
        const callback = (x, y) => {
            size++;
            level[x][y].flooded = true;
        }
        floodFill(startx, starty, passable, callback);
        if (size < 314) {
            // clear animationQueue so that previous level and this one don't get drawn at the same time
            animation.clearQueue();
            return createLevel({
                prng,
                startx,
                starty,
                depth,
            });
        }
    }

    // add prototypes to tiles
    forEachTile((x, y) => {
        const oldTile = level[x][y];
        level[x][y] = createTile(oldTile.type);
        for (const key in oldTile) {
            level[x][y][key] = oldTile[key];
        }
    });

    // calculate light values
    forEachTile((x, y) => {
        level[x][y].light = 0;
    });
    forEachInnerTile((x, y) => {
        const tile = level[x][y];
        if (tile.type === 'floor') {
            const transparent = (x, y) => level[x][y].type === 'floor';
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
                last = animation.clearTile(x, y, 0, last);
            } else {
                last = animation.clearTile(x, y, 3, last);
            }
        }
    });

    // place exit
    let placedExit = false;
    for (let i = 0; i < scrambledTiles.length; i++) {
        const {x, y} = scrambledTiles[i];
        if (!placedExit && level[x][y].cave && level[x][y].type === 'floor' && level[x][y].cave.tiles.length <= 12) {
            level[x][y].type = 'stairsDown';
            level[x][y].cave.type = 'exit';
            animTile(x, y, 'stairsDown');
            placedExit = true;
        }
    }
    if (!placedExit) {
        for (let i = 0; i < scrambledTiles.length; i++) {
            const {x, y} = scrambledTiles[i];
            if (!placedExit && level[x][y].type === 'floor') {
                level[x][y].type = 'stairsDown';
                animTile(x, y, 'stairsDown');
                placedExit = true;
            }
        }
    }

    // place player
    player.x = startx;
    player.y = starty;
    level[startx][starty].actor = player;
    if (level[player.x][player.y].cave) {
        level[player.x][player.y].cave.type = 'entrance';
    }

    animation.createActor(player.x, player.y, {
        type: 'player',
    }, 1, lastBeforeFov);

    // animate fov
    {
        forEachTile((x, y) => {
            level[x][y].seen = false;
        });
        const transparent = (x, y) => level[x][y].transparent;
        const reveal = (x, y, radius) => {
            level[x][y].visible = true;
            level[x][y].seen = true;
            animation.queueTile(x, y, level[x][y].type, true, true, 3 * radius + 1, lastBeforeFov);
        };
        fov(player.x, player.y, transparent, reveal);
    }

    // change a tile's type
    const setTileType = (x, y, type) => {
        const oldTile = level[x][y];
        const newTile = createTile(type);
        newTile.actor = oldTile.actor;
        newTile.light = oldTile.light;
        newTile.cave = oldTile.cave;
        level[x][y] = newTile;
        return newTile;
    };

    // decorate caves
    const caveTypes = {
        tripwire: {
            weight(cave) {
                let centerx, centery;
                let maxlight = 0;
                cave.tiles.forEach(({x, y}) => {
                    if (level[x][y].light > maxlight && surrounded(x, y, (x, y) => level[x][y].passable)) {
                        centerx = x;
                        centery = y;
                        maxlight = level[x][y];
                    }
                });

                if (centerx === undefined || cave.exits.length > 1) {
                    return 0;
                }
                return 1;
            },
            generate(cave) {
                let centerx, centery;
                let maxlight = 0;
                cave.tiles.forEach(({x, y}) => {
                    if (level[x][y].light > maxlight && surrounded(x, y, (x, y) => level[x][y].passable)) {
                        centerx = x;
                        centery = y;
                        maxlight = level[x][y];
                    }
                });

                if (centerx === undefined) {
                    return;
                }

                const countTile = (x, y, dir) => {
                    if (level[x][y].passable) {
                        if (level[x][y].cave) {
                            return 1 + countTile(x + dir.dx, y + dir.dy, dir);
                        } else {
                            return 100 + countTile(x + dir.dx, y + dir.dy, dir);
                        }
                    } else {
                        return 0;
                    }
                };

                const dir1_7 = countTile(centerx, centery, DIR1) + countTile(centerx, centery, DIR7);
                const dir3_9 = countTile(centerx, centery, DIR3) + countTile(centerx, centery, DIR9);
                const dir5_11 = countTile(centerx, centery, DIR5) + countTile(centerx, centery, DIR11);

                const placeWire = (x, y, dir, type) => {
                    if (level[x][y].passable) {
                        setTileType(x, y, type);
                        placeWire(x + dir.dx, y + dir.dy, dir, type);
                    }
                };

                if (dir3_9 <= dir1_7 && dir3_9 <= dir5_11) {
                    placeWire(centerx, centery, DIR3, 'tripwire3_9');
                    placeWire(centerx, centery, DIR9, 'tripwire3_9');
                } else if (dir1_7 <= dir5_11) {
                    placeWire(centerx, centery, DIR1, 'tripwire1_7');
                    placeWire(centerx, centery, DIR7, 'tripwire1_7');
                } else {
                    placeWire(centerx, centery, DIR5, 'tripwire5_11');
                    placeWire(centerx, centery, DIR11, 'tripwire5_11');
                }
            },
        },
        wolf: {
            weight(cave) {
                if (cave.exits.length > 1) {
                    return 1;
                }
                return 0;
            },
            generate(cave) {
                const {x, y} = randElement(cave.tiles, prng);
                const wolf = createActor('wolf', x, y);
                level[x][y].actor = wolf;
                schedule.add(wolf);
                animation.createActor(x, y, {
                    type: 'wolf',
                }, 1, lastBeforeFov);
            },
        },
    };
    forEachInnerTile((x, y) => {
        const cave = level[x][y].cave;
        if (cave && !cave.type) {
            const possibleTypes = [];
            for (const type in caveTypes) {
                for (let i = caveTypes[type].weight(cave); i > 0; i--) {
                    possibleTypes.push(type);
                }
            }
            if (possibleTypes.length) {
                const type = randElement(possibleTypes, prng);
                cave.type = type;
                caveTypes[type].generate(cave);
            }
        }
    });

    // cancel animation if not first level
    if (depth > 1) {
        animation.clearQueue();
        forEachTile((x, y) => {
            animation.queueTile(x, y, level[x][y].type, level[x][y].visible, level[x][y].seen);
            if (level[x][y].actor) {
                animation.createActor(x, y, {
                    type: level[x][y].actor.type,
                });
            }
        });
    }
    return level;
};

const descend = () => {
    schedule.next = undefined;
    schedule.add(player, 0);
    animation.clearAll();
    animation.animate();
    level = createLevel({
        prng: levelPrng,
        startx: player.x,
        starty: player.y,
        depth: level.depth + 1,
    });
    nextMove();
};

//========================================
//                             CREATE GAME

/// create a game
///
/// width {number} max width of each level
/// height {number} max height of each level
/// seed {string} determines starting state of prng
/// queueAnimation {function()} output an animation to the display
return ({
    width: _width,
    height: _height,
    seed,
    animation: _animation,
}) => {
    width = _width;
    height = _height;
    animation = _animation;

    // main prng used for combat and ai
    const mainPrng = new Math.seedrandom(seed);
    prng = mainPrng;

    // prng used for all level generation
    levelPrng = new Math.seedrandom(seed);

    // create player
    player = createActor('player');
    // let the player launch animation on its turn
    player.playing = function() {
        prevAnimation = undefined;
        animation.animate();
    };
    schedule.add(player, 0);

    // generate first level
    level = createLevel({
        prng: levelPrng,
    });

    // begin game
    nextMove();

    return input;
};

})();
