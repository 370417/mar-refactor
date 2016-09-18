const createGame = (() => {

//========================================
//                                   ACTOR

// create an actor
const createActor = (() => {
    const baseActor = {
        delay: 100,
    };

    const actors = {
        player: {

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
    for (const key in actors) {
        actors[key].name = key;
        actors[key] = asActor(actors[key]);
    }

    return (name) => {
        const actor = Object.create(actors[name]);
        return actor;
    };
})();

//========================================
//                                   LEVEL

const createLevel = ({
    width,
    height,
    prng,
    startx = 24,
    starty = 15,
    player,
    animation,
}) => {
    
    let last;
    const animTile = (x, y, type, delta = 1) => {
        last = animation.queueTile(x, y, type, false, delta, last);
    };

    const level = [];

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
                width,
                height,
                prng,
                startx,
                starty,
                player,
                animation,
            });
        }
    }

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
                //last = animationQueue.add({x, y, type: 'clearTile'}, 0, last);
                last = animation.clearTile(x, y, 0, last);
            } else {
                //last = animationQueue.add({x, y, type: 'clearTile'}, 3, last);
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

    animation.createActor(player.x, player.y, {
        type: 'player',
    }, 1, lastBeforeFov);
    /*animationQueue.add({
        x: player.x,
        y: player.y,
        type: 'createActor',
        actor: {
            type: 'player',
            hp: 100,
    }}, 1, lastBeforeFov);*/

    // animate fov
    {
        const transparent = (x, y) => level[x][y].type === 'floor';
        const reveal = (x, y, radius) => {
            level[x][y].visible = true;
            animation.queueTile(x, y, level[x][y].type, true, 3 * radius + 1, lastBeforeFov);
            /*animationQueue.add({x, y, type: 'setTile', tile: {
                type: level[x][y].type,
                visible: true,
                seen: true,
            }}, 3 * radius + 1, lastBeforeFov);*/
        };
        fov(player.x, player.y, transparent, reveal);
    }
    return level;
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
    width,
    height,
    seed,
    animation,
}) => {
    // main prng used for combat and ai
    const mainPrng = new Math.seedrandom(seed);

    // prng used for all level generation
    const levelPrng = new Math.seedrandom(seed);

    // create player
    const player = createActor('player');

    // generate first level
    let level = createLevel({
        width,
        height,
        prng: levelPrng,
        player,
        animation,
    });

    // replace this with starting the player's first turn
    animation.animate();
};

})();
