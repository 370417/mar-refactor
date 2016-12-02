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
        },
        pit: {
            passable: true,
            transparent: true,
        },
    };

    const setTileType = function(tile, type) {
        return Object.assign(tile, Tiles[type], {type});
    };

    // create schedule
    const schedule = Schedule();
    // ticks since the last player move
    let now = 0;
    const outputNow = function(event) {
        event.time = now;
        return output(event);
    };
    
    // advance to the next actor
    const nextTurn = function() {
        const {event: actor, delta} = schedule.advance();
        now += delta;
        actor.act();
    };

    //========================================
    //                             NOISE/SOUND

    /// level - the game level to make the sound on
    /// sound - the properties of the sound
    /// strength - how strong the sound is at the source
    /// mask - how strong auditory masking is for this sound as a proportion of strength
    /// ox, oy - origin of sound
    const makeNoise = function(level, sound, strength, mask, ox, oy) {
        const forEachNeighbor = ({x, y}, fun) => {
            if (level[x][y].distance >= strength) {
                return;
            }
            for (const key in directions) {
                const {dx, dy} = directions[key];
                if (level[x+dx][y+dy].passable) {
                    fun({x: x + dx, y: y + dy});
                }
            }
        };

        const getDistance = ({x, y}) => level[x][y].visited ? level[x][y].distance : Infinity;

        const setDistance = ({x, y}, distance) => level[x][y].distance = distance;

        const getCost = ({x, y}) => 1;

        const getVisited = ({x, y}) => level[x][y].visited;

        const setVisited = ({x, y}) => level[x][y].visited = true;

        level[ox][oy].distance = 0;
        influenceMap([{x: ox, y: oy}], forEachNeighbor, getDistance, setDistance, getCost, getVisited, setVisited);

        forEachInnerTile((x, y) => {
            const tile = level[x][y];
            if (tile.actor) {
                if (tile.distance < strength)
                tile.actor.hear(sound, strength - tile.distance, mask * (strength - tile.distance), ox, oy);
            }
            tile.distance = undefined;
            tile.visited = undefined;
        });
    };

    //========================================
    //                                 WEAPONS
    // sword - restores 25 init on hit
    // spear - restores 10 init per open neighbor per hit

    // active melee abilities, usable with any weapon
    // ?? - costs 25 init, restores 10 init on hit
    // 

    //========================================
    //                                  ACTORS
    let Actor;
    {
        const setLevel = function(level) {
            this.level = level;
        };

        const compareSound = function(a, b) {
            return a.strength - b.strength;
        };

        const hear = function(sound, strength, masking, x, y) {
            // if footsteps from this actor, masking is lowered
            // add sounds to schedule sorted by Number.MAX_SAFE_INTEGER - strength

            if (strength >= this.hearing) {
                this.sounds.push({sound, strength, x, y});
            }
            else if (2 * strength >= this.hearing) {
                this.sounds.push({sound, strength});
            }
        };

        const processNoise = function() {
            // advance and store first sound
            // schedule a cap at a time equal to the net auditory masking
            // each noise adds to masking
            this.sounds = [];
        };

        const act = function() {
            const tile = this.level[this.x][this.y];
            //this.hear(tile.ambience);
            this.processNoise()
            return this[this.state]();
        };

        const passable = function(x, y) {
            return this.level[x][y].passable && !this.level[x][y].actor;
        };

        const move = function(dx, dy) {
            if (this.passable(this.x + dx, this.y + dy)) {
                this.level[this.x][this.y].actor = undefined;
                this.x += dx;
                this.y += dy;
                this.level[this.x][this.y].actor = this;

                makeNoise(this.level, 'player footsteps', 6, 0.5, this.x, this.y);

                outputNow({
                    type: 'move actor',
                    value: {
                        type: this.type,
                        x1: this.x - dx,
                        y1: this.y - dy,
                        x2: this.x,
                        y2: this.y,
                    },
                });

                if (this === player) {
                    this.see();
                }
            } else {
                //outputNow(not passable)
            }

            schedule.add(this, this.delay, this.priority);
            nextTurn();
        };

        const takeDamage = function(damage) {
            if (this.level[this.x][this.y].visible) {
                outputNow({
                    type: 'take damage',
                    value: {
                        x: this.x,
                        y: this.y,
                        damage,
                    },
                });
            }
        };

        const attack = function(actor) {
            actor.takeDamage(20);
        };

        const see = function() {
            const transparent = (x, y) => this.level[x][y].transparent;
            const reveal = (x, y) => {
                const tile = this.level[x][y];
                tile.newVisible = true;
                this.level[x][y].seen = true;
            };
            fov(this.x, this.y, transparent, reveal);

            forEachTile((x, y) => {
                const tile = this.level[x][y];
                if (tile.newVisible) {
                    if (tile.visible) {
                        outputNow({
                            type: 'change tile visibility',
                            value: { x, y, visible: true },
                        });
                    } else {
                        outputNow({
                            type: 'new tile',
                            value: {
                                type: tile.type,
                                x, y,
                                seen: true,
                                visible: true,
                            },
                        });
                        if (tile.prop) {
                            outputNow({
                                type: 'set prop',
                                value: {
                                    type: tile.prop,
                                    x, y,
                                },
                            });
                        }
                    }
                    if (tile.actor) {
                        outputNow({
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
                    outputNow({
                        type: 'change tile visibility',
                        value: { x, y, visible: false },
                    });
                }
                tile.visible = tile.newVisible;
                tile.newVisible = false;
            });
        };

        const playing = function() {
            now = 0;
            outputNow({ type: 'done' });
        };

        const sleeping = function() {
            console.log('danger noodle');
            schedule.add(this, this.delay, this.priority);
            nextTurn();
        };

        const prototype = {
            setLevel,
            passable,
            hear,
            processNoise,
            act,
            takeDamage,
            attack,
            move,
            state: 'sleeping',
            lastMove: DIR0,
            delay: 24,
            priority: 1,
            hearing: 6,
        };

        const Actors = {
            player: {
                playing,
                see,
                state: 'playing',
                priority: 2,
            },
            snake: {
                sleeping,
            },
        };

        Actor = function(type, level, x, y) {
            const actor = Object.assign({}, prototype, Actors[type], {type, level, x, y});
            actor.sounds = new Heap(compareSound);

            schedule.add(actor, 0, actor.priority);

            if (level && x && y) {
                level[x][y].actor = actor;
            }

            return actor;
        };
    }

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
                            level[x][y] = setTileType({}, 'floor');
                        } else {
                            level[x][y] = setTileType({}, 'wall');
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
                    setTileType(level[x][y], 'floor');
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
                        setTileType(tile, 'floor');
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
                        setTileType(tile, 'wall');
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
            setTileType(level[x][y], 'wall');
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
                    setTileType(level[x][y], 'wall');
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
                        setTileType(level[x][y], 'floor');
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

        const placeStairs = function() {
            const valid = [];
            forEachInnerTile((x, y) => {
                const tile = level[x][y];
                if (isCave(x, y) && tile.passable && !tile.actor) {
                    valid.push({x, y});
                }
            });
            const {x, y} = randElement(valid, prng);
            setTileType(level[x][y], 'pit');
            level[x][y].prop = 'stairsDown';
        };

        const placeTripwires = function() {
            const search = function(x, y, dir) {
                if (level[x+dir.dx][y+dir.dy].prop ||
                    level[x+dir.dx][y+dir.dy].actor ||
                    isWall(x + dir.clockwise.dx, y + dir.clockwise.dy) ||
                    isWall(x + dir.counterclockwise.dx, y + dir.counterclockwise.dy)) {
                    return false;
                } else if (isWall(x + dir.dx, y + dir.dy)) {
                    return true;
                } else {
                    return search(x + dir.dx, y + dir.dy, dir);
                }
            };

            const placeWire = function(type, x, y, dir) {
                if (!isWall(x, y)) {
                    level[x][y].prop = type;
                    placeWire(type, x + dir.dx, y + dir.dy, dir);
                }
            };

            forEachInnerTile((x, y) => {
                const tile = level[x][y];
                if (tile.prop || tile.type === 'wall') {
                    return false;
                }
                if (search(x, y, DIR5) && search(x, y, DIR11)) {
                    placeWire('tripwirex', x, y, DIR5);
                    placeWire('tripwirex', x, y, DIR11);
                }
                if (search(x, y, DIR3) && search(x, y, DIR9)) {
                    placeWire('tripwirey', x, y, DIR3);
                    placeWire('tripwirey', x, y, DIR9);
                }
                if (search(x, y, DIR1) && search(x, y, DIR7)) {
                    placeWire('tripwirez', x, y, DIR1);
                    placeWire('tripwirez', x, y, DIR7);
                }
            });
        };

        const placeMonsters = function() {
            // find size of available area
            let size = 0;
            forEachInnerTile((x, y) => {
                const tile = level[x][y];
                if (tile.passable && !tile.actor && !tile.prop) {
                    size++;
                }
            });
            forEachInnerTile((x, y) => {
                const tile = level[x][y];
                if (tile.passable && !tile.actor && !tile.prop) {
                    if (prng() < 6 / size) {
                        const actor = Actor('snake', level, x, y);
                    }
                }
            });
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
        placePlayer();
        placeStairs();
        //placeTripwires();
        placeMonsters();

        return level;
    };

    // create level
    let level = Level();

    // tell player about level
    player.setLevel(level);

    // start game clock
    player.see();
    nextTurn();

    const input = function({type, value}) {
        if (type === 'move') {
            const {dx, dy} = value;
            const {x, y} = player;
            if (player.passable(x + dx, y + dy)) {
                player.move(dx, dy);
            }
            else if (player.level[x+dx][y+dy].actor) {
                player.attack(player.level[x+dx][y+dy].actor);
            }
            else if (player.passable(x + value.clockwise.dx, y + value.clockwise.dy) &&
                    !player.passable(x + value.counterclockwise.dx, y + value.counterclockwise.dy)) {
                now += 8;
                player.move(value.clockwise.dx, value.clockwise.dy);
            }
            else if (!player.passable(x + value.clockwise.dx, y + value.clockwise.dy) &&
                    player.passable(x + value.counterclockwise.dx, y + value.counterclockwise.dy)) {
                now += 8;
                player.move(value.counterclockwise.dx, value.counterclockwise.dy);
            }
        }
    };

    return input;
};
