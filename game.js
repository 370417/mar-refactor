const createGame = function({width, height, seed, output}) {
    // main prng for everything but level generation
    const prng = new Math.seedrandom(seed);

    // make calling utility functions less painful
    const forEachTile = forEachTileOfLevel.bind(null, width, height);
    const forEachInnerTile = forEachInnerTileOfLevel.bind(null, width, height);
    const inBounds = inBoundsOfLevel.bind(null, width, height);
    const inInnerBounds = inInnerBoundsOfLevel.bind(null, width, height);

    //  level prng used for level generation
    const levelPrng = new Math.seedrandom(seed);

    const Tiles = {
        floor: {
            passable: true,
            transparent: true,
        },
        wall: {
            passable: false,
            transparent: false,
        }
    };

    const changeTileType = function(tile, type) {
        return Object.assign(tile, Tiles[type], {type});
    };

    // create schedule
    const schedule = Schedule();

    const Actor = function(type, level, x, y) {
        const setLevel = function(newLevel) {
            level = newLevel;
        };

        const act = function(delta) {
            return this[this.state](delta);
        };

        const passable = function(x, y) {
            return level[x][y].passable && !level[x][y].actor;
        };

        const move = function(dx, dy, delta = 0) {
            if (this.passable(this.x + dx, this.y + dy)) {
                level[this.x][this.y].actor = undefined;
                this.x += dx;
                this.y += dy;
                level[this.x][this.y].actor = this;
                output({
                    type: 'move actor',
                    value: {
                        type: this.type,
                        x1: this.x - dx,
                        y1: this.y - dy,
                        x2: this.x,
                        y2: this.y,
                    },
                    delta,
                });

                if (this === player) {
                    this.see();
                }
            } else {
                //output(not passable)
            }

            schedule.add(this, this.delay, this.priority);
            const {event: nextActor, delta: nextDelta} = schedule.advance();
            nextActor.act(nextDelta);
        };

        const see = function() {
            const transparent = (x, y) => level[x][y].transparent;
            const reveal = (x, y) => {
                const tile = level[x][y];
                tile.newVisible = true;
                level[x][y].seen = true;
            };
            fov(this.x, this.y, transparent, reveal);

            forEachTile((x, y) => {
                const tile = level[x][y];
                if (tile.newVisible) {
                    if (tile.visible) {
                        output({
                            type: 'change tile visibility',
                            value: { x, y, visible: true },
                        });
                    } else {
                        output({
                            type: 'new tile',
                            value: {
                                type: tile.type,
                                x, y,
                                seen: true,
                                visible: true,
                            },
                        });
                    }
                    if (tile.actor) {
                        output({
                            type: 'move actor',
                            value: {
                                type: tile.actor.type,
                                x1: x,
                                y1: y,
                                x2: x,
                                y2: y,
                            },
                        });
                    }
                }
                else if (tile.visible) {
                    output({
                        type: 'change tile visibility',
                        value: { x, y, visible: false },
                    });
                }
                tile.visible = tile.newVisible;
                tile.newVisible = false;
            });
        };

        const playing = function() {
            output({ type: 'done' });
        };

        const prototype = {
            setLevel,
            passable,
            act,
            move,
            state: 'sleeping',
            lastMove: DIR0,
            delay: 24,
            priority: 1,
        };

        const Actors = {
            player: {
                playing,
                see,
                state: 'playing',
                priority: 2,
            },
        };

        const actor = Object.assign(prototype, Actors[type], {type, x, y});
        
        schedule.add(actor, 0, actor.priority);

        if (level) {
            level[x][y].actor = actor;
        }

        return actor;
    };

    // create player
    const player = Actor('player');

    const defaultStartx = Math.floor(width / 2);
    const defaultStarty = Math.floor(height / 2);
    const Level = function(depth, startx = defaultStartx, starty = defaultStarty) {
        // don't use wrong prng accidentally
        const prng = levelPrng;

        // setup level
        const level = [];
        const init = function() {
            level.depth = depth;
            level.width = width;
            level.height = height;
            for (let x = 0; x < width; x++) {
                level[x] = [];
                for (let y = 0; y < height; y++) {
                    if (inBounds(x, y)) {
                        if (x === startx && y === starty) {
                            level[x][y] = changeTileType({}, 'floor');
                        } else {
                            level[x][y] = changeTileType({}, 'wall');
                        }
                    }
                }
            }
        };

        const isWall = (x, y) => level[x][y].type === 'wall';
        const isFloor = (x, y) => level[x][y].type === 'floor';

        const carveCaves = function() {
            // list all inner tiles in random order
            const scrambledTiles = [];
            forEachInnerTile((x, y) => {
                scrambledTiles.splice(randInt(0, scrambledTiles.length + 1, prng), 0, {x, y});
            });

            for (let i = 0; i < scrambledTiles.length; i++) {
                const {x, y} = scrambledTiles[i];
                if (countGroups(x, y, isFloor) !== 1) {
                    changeTileType(level[x][y], 'floor');
                }
            }
        };

        const removeSmallWalls = function() {
            // find size of wall groups
            const passable = (x, y) => inBounds(x, y) && level[x][y].type === 'wall' && !level[x][y].wallGroup;
            forEachInnerTile((x, y) => {
                if (level[x][y].type === 'wall' && !level[x][y].wallGroup) {
                    const wallGroup = { size: 0 };
                    const callback = (x, y) => {
                        level[x][y].wallGroup = wallGroup;
                        wallGroup.size++;
                    };
                    floodFill(x, y, passable, callback);
                }
            });
            // remove groups of <6 walls
            forEachInnerTile((x, y) => {
                const tile = level[x][y];
                if (tile.type === 'wall') {
                    if (tile.wallGroup.size < 6) {
                        changeTileType(tile, 'floor');
                    } else {
                        tile.wallGroup = undefined;
                    }
                }
            });
        };

        const removeOtherCaves = function() {
            // mark main cave
            const passable = (x, y) => level[x][y].type === 'floor' && !level[x][y].mainCave;
            const callback = (x, y) => level[x][y].mainCave = true;
            floodFill(startx, starty, passable, callback);
            // remove non-main caves
            forEachInnerTile((x, y) => {
                const tile = level[x][y];
                if (tile.type === 'floor') {
                    if (tile.mainCave) {
                        tile.mainCave = undefined;
                    } else {
                        changeTileType(tile, 'wall');
                    }
                }
            });
        };

        const isNotCave = (x, y) => !isFloor(x, y) || countGroups(x, y, isFloor) !== 1;
        const isDeadEnd = (x, y) => isFloor(x, y) && countGroups(x, y, isFloor) === 1 && surrounded(x, y, isNotCave);


        const fillDeadEnd = function(x, y) {
            if (!isDeadEnd(x, y)) {
                return;
            }
            changeTileType(level[x][y], 'wall');
            for (const key in directions) {
                const {dx, dy} = directions[key];
                if (x === startx && y === starty && isFloor(x + dx, y + dy)) {
                    startx = x + dx;
                    starty = y + dy;
                }
                fillDeadEnd(x + dx, y + dy);
            }
        };

        const fillDeadEnds = function() {
            forEachInnerTile((x, y) => {
                if (isDeadEnd(x, y)) {
                    fillDeadEnd(x, y);
                }
            });
        };

        const isCave = (x, y) => isFloor(x, y) && countGroups(x, y, isFloor) === 1;

        const remove2TileCaves = function() {
            // fill in the first tile of all 2-tile caves
            const passable = (x, y) => isCave(x, y) && !level[x][y].isCave;
            forEachInnerTile((x, y) => {
                let size = 0;
                const callback = (x, y) => {
                    level[x][y].isCave = true;
                    size++;
                };
                floodFill(x, y, passable, callback);
                if (size === 2) {
                    changeTileType(level[x][y], 'wall');
                }
            });
            // clear the isCave flag
            forEachInnerTile((x, y) => {
                level[x][y].isCave = undefined;
            });
        };

        const carveTunnelLoops = function() {
            forEachInnerTile((x, y) => {
                if (!isWall(x, y) || level[x][y].flooded) {
                    return;
                }
                // find groups of walls completely surrounded by tunnel
                let carve = true;
                const passable = (x, y) => {
                    if (!inBounds(x, y) || isCave(x, y)) {
                        carve = false;
                        return false;
                    }
                    return isWall(x, y) && !level[x][y].flooded;
                };
                const callback = (x, y) => level[x][y].flooded = true;
                floodFill(x, y, passable, callback);
                // turn those walls into floor
                if (carve) {
                    const passable = (x, y) => inBounds(x, y) && isWall(x, y);
                    const callback = (x, y) => {
                        level[x][y].flooded = undefined;
                        changeTileType(level[x][y], 'floor');
                    };
                    floodFill(x, y, passable, callback);
                }
            });
            // clear flooded flag
            forEachTile((x, y) => {
                level[x][y].flooded = undefined;
            });
        };

        const floorSize = function() {
            let size = 0;
            const passable = (x, y) => isFloor(x, y) && !level[x][y].flooded;
            const callback = (x, y) => {
                size++;
                level[x][y].flooded = true;
            }
            floodFill(startx, starty, passable, callback);
            forEachInnerTile((x, y) => {
                level[x][y].flooded = undefined;
            });
            return size;
        };

        const placePlayer = function() {
            player.x = startx;
            player.y = starty;
            level[startx][starty].actor = player;
        };

        const isGrass = (x, y) => level[x][y].type === 'grass';

        const testGrass = function() {
            // list all inner tiles in random order
            const scrambledTiles = [];
            forEachInnerTile((x, y) => {
                scrambledTiles.splice(randInt(0, scrambledTiles.length + 1, prng), 0, {x, y});
            });

            for (let i = 0; i < scrambledTiles.length; i++) {
                const {x, y} = scrambledTiles[i];
                if (isFloor(x, y) && countGroups(x, y, isGrass) !== 1) {
                    changeTileType(level[x][y], 'grass');
                }
            }
        };

        init();
        carveCaves();
        removeOtherCaves();
        removeSmallWalls();
        fillDeadEnds();
        remove2TileCaves();
        fillDeadEnds();
        carveTunnelLoops();
        if (floorSize() < 314) {
            return Level({depth, startx, starty});
        }
        //testGrass();
        placePlayer();

        return level;
    };

    // create level
    let level = Level();

    // tell player about level
    player.setLevel(level);

    // start game clock
    player.see();
    schedule.advance().event.act();

    const input = function({type, value}) {
        if (type === 'move') {
            const {dx, dy} = value;
            const {x, y} = player;
            if (player.passable(x + dx, y + dy)) {
                player.move(dx, dy);
            }
            else if (player.passable(x + value.clockwise.dx, y + value.clockwise.dy) &&
                    !player.passable(x + value.counterclockwise.dx, y + value.counterclockwise.dy)) {
                player.move(value.clockwise.dx, value.clockwise.dy, 8);
            }
            else if (!player.passable(x + value.clockwise.dx, y + value.clockwise.dy) &&
                    player.passable(x + value.counterclockwise.dx, y + value.counterclockwise.dy)) {
                player.move(value.counterclockwise.dx, value.counterclockwise.dy, 8);
            }
        }
    };

    return input;
};
