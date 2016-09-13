import createTile from "./tile";
import {fov} from "./fov";
import {dijkstraMap} from "./pathfinding";
import createActor from "./actor";

let level;

const forEachTile = (callback) => {
    for (let x = 0; x < level.width; x++) for (let y = 0; y < level.height; y++) {
        callback({x, y, tile: level[x][y]});
    }
};

// create a 2d array with dimensions width by height and filled with content
const create2dArray = (width, height, content) => {
    const isFunction = typeof content === "function";
    const array = [];
    for (let x = 0; x < width; x++) {
        array[x] = [];
        for (let y = 0; y < height; y++) {
            array[x][y] = isFunction ? content(x, y) : content;
        }
    }
    return array;
};

// get the 2d coordinates like array[x][y] corresponding to a 1d index
const getCoord = (index) => {
    const y = index % level.height;
    const x = (index - y) / level.height;
    return [x, y];
};

// return a random number in the range [lower, upper]
const randInt = (lower, upper, prng = Math.random) => {
    if (lower > upper) {
        console.error("lower > upper");
        return NaN;
    }
    return lower + Math.floor((upper - lower + 1) * prng());
};

// create a shuffled range of ints in [0, size)
const randRange = (size, prng = Math.random) => {
    const array = [];
    for (let i = 0; i < size; i++) {
        let j = randInt(0, i, prng);
        if (j !== i) {
            array[i] = array[j];
        }
        array[j] = i;
    }
    return array;
};

// whether point (x, y) is on the edge of the level
const onEdge = (x, y) => x === 0 || y === 0 || x === level.width - 1 || y === level.height - 1;

// whether point (x, y) is in the level
const inBounds = (x, y) => x >= 0 && y >= 0 && x < level.width && y < level.height;

const inInnerBounds = (x, y) => {
    return x > (level.height - y) / 2 &&
           x < level.width - 1 - y / 2 &&
           y > 0 &&
           y < level.height - 1;
};

const xDir = [0, 1, 1, 0,-1,-1];
const yDir = [1, 0,-1,-1, 0, 1];

const floodFill = (x, y, passable, callback) => {
    if (!inBounds(x, y) || !passable(x, y)) {
        return;
    }
    callback(x, y);
    for (let i = 0; i < 6; i++) {
        floodFill(x + xDir[i], y + yDir[i], passable, callback);
    }
};

// whether point (x, y) is surrounded by type
const surrounded = (x, y, type) => {
    for (let i = 0; i < 6; i++) {
        if (level[x + xDir[i]][y + yDir[i]] !== type) {
            return false;
        }
    }
    return true;
};

// count the number of contiguous groups of walls around a tile
const countGroups = (x, y) => {
    let groups = 0;
    // prev is the last tile that will be visited
    let prev = level[x + xDir[5]][y + yDir[5]];
    // loop through neighbors in order
    for (let i = 0; i < 6; i++) {
        let curr = level[x + xDir[i]][y + yDir[i]];
        // count transitions from floor to wall
        if (prev !== "wall" && curr === "wall") {
            groups++;
        }
        prev = curr;
    }
    // if there are no transitions, check if all neighbors are walls
    return !groups && prev === "wall" ? 1 : groups;
};

// count the number of neighboring tiles of a certain type
const countNeighbor = (isType, x, y) => {
    if (typeof isType !== "function") {
        const type = isType;
        isType = (x) => x === type;
    }
    let count = 0;
    for (let i = 0; i < 6; i++) {
        if (inBounds(x + xDir[i], y + yDir[i]) && isType(level[x + xDir[i]][y + yDir[i]])) {
            count++;
        }
    }
    return count;
};

// generate floor in the level to create caves
const generateFloor = (prng = Math.random) => {
    // loop through the level randomly
    randRange(level.width * level.height, prng).forEach(index => {
        const [x, y] = getCoord(index);
        if (inInnerBounds(x, y)) {
            if (surrounded(x, y, "wall") || countGroups(x, y) !== 1) {
                level[x][y] = "floor";
            }
        }
    });
};

const isFloor = (x, y) => level[x][y] === "floor";

const isWall = (x, y) => level[x][y] === "wall";

// remove all but the largest group of floor
const removeIsolatedFloor = () => {
    let maxSize = 0;
    forEachTile(({x, y}) => {
        let tempTile = { size: 0 };
        floodFill(x, y, isFloor, (x, y) => {
            level[x][y] = tempTile;
            tempTile.size++;
        });
        if (tempTile.size > maxSize) {
            maxSize = tempTile.size;
        }
    });
    forEachTile(({x, y}) => {
        if (level[x][y].size) {
            level[x][y] = level[x][y].size === maxSize ? "floor" : "wall";
        }
    });
};

// remove groups of 5 or less walls
const removeIsolatedWalls = () => {
    forEachTile(({x, y}) => {
        let tempTile = { size: 0 };
        floodFill(x, y, isWall, (x, y) => {
            level[x][y] = tempTile;
            tempTile.size++;
        });
    });
    forEachTile(({x, y}) => {
        if (level[x][y].size) {
            level[x][y] = level[x][y].size > 5 ? "wall" : "floor";
        }
    });
};

const isDeadEnd = (x, y) => level[x][y] === "floor" && countNeighbor("floor", x, y) === 1;

const findDeadEnds = () => {
    forEachTile(({x, y}) => {
        if (level[x][y] === "floor" && isDeadEnd(x, y)) {
            floodFill(x, y, isDeadEnd, (x, y) => {
                level[x][y] = "deadEnd";
            });
        }
    });
};

const fillDeadEnds = () => {
    forEachTile(({x, y}) => {
        if (level[x][y] === "deadEnd") {
            level[x][y] = "wall";
        }
    });
};

const convert2Tiles = () => {
    forEachTile(({x, y}) => {
        level[x][y] = createTile(level[x][y]);
    });
};

const findCave = () => {
    const nodes = create2dArray(level.width, level.height, (x, y) => ({ x, y, end: !level[x][y].passable }));

    const end = node => node.end;

    const neighbor = node => {
        const neighbors = [];
        for (let i = 0; i < 6; i++) {
            const x = node.x + xDir[i];
            const y = node.y + yDir[i];
            if (inBounds(x, y)) {
                neighbors.push(nodes[x][y]);
            }
        }
        return neighbors;
    };

    const cost = () => 1;

    // flat array of nodes
    const graph = [];
    for (let x = 0, i = 0; x < level.width; x++) for (let y = 0; y < level.height; y++, i++) {
        graph[i] = nodes[x][y];
    }

    const caveMap = dijkstraMap({graph, end, neighbor, cost});

    caveMap.forEach(node => {
        if (node.cost > 1) {
            level[node.x][node.y].location.cave = true;
        }
    });

    // Find floor tiles one tile away from a cave
    forEachTile(({x, y, tile}) => {
        if (tile.passable && !tile.location.cave && countNeighbor(node => node.location.cave, x, y)) {
            tile.potentialCave = true;
        }
    });

    // Make those tiles caves
    // And find floor tiles one tile away from the new caves and make them cave exits
    // Mark those cave exits as targets for dijkstra
    forEachTile(({tile, x, y}) => {
        if (tile.potentialCave) {
            tile.location.cave = true;
        }
    });

    const isCave = (x, y) => level[x][y].location.cave === true;

    // floodfill to group caves
    const caves = [];
    forEachTile(({x, y}) => {
        if (level[x][y].location.cave === true) {
            const cave = {
                size: 0,
                tiles: [],
            };
            caves.push(cave);
            floodFill(x, y, isCave, (x, y) => {
                level[x][y].location.cave = cave;
                cave.size++;
                cave.tiles.push({x, y});
            });
        }
    });

    return caves;
};

const findExits = () => {
    forEachTile(({tile, x, y}) => {
        tile.location.light = 0;
        if (tile.passable && !tile.location.cave && countNeighbor(node => node.location.cave, x, y)) {
            let cave;
            for (let i = 0; i < 6; i++) {
                const x2 = x + xDir[i];
                const y2 = y + yDir[i];
                const neighbor = level[x2][y2];
                if (neighbor.passable) {
                    if (neighbor.location.cave) {
                        cave = neighbor.location.cave;
                    } else {
                        tile.location.exit = true;
                        break;
                    }
                }
            }
            if (!tile.location.exit) {
                tile.location.cave = cave;
            }
        }
    });
};

const normalizeLight = (maxLight) => {
    forEachTile(({tile}) => {
        tile.location.light /= maxLight;
    });
};

const lightUp = () => {
    forEachTile(({x, y}) => {
        level[x][y].location.light = level[x][y].location.light || 0;
    });
    let maxLight = 0;
    forEachTile(({x, y}) => {
        if (level[x][y].transparent) {
            fov(x, y, (x, y) => level[x][y].transparent, (x, y) => {
                level[x][y].location.light++;
                if (level[x][y].location.light > maxLight) {
                    maxLight = level[x][y].location.light;
                }
            });
        }
    });
    normalizeLight(maxLight);
};

const grassCave = cave => {
    const chanceA = Math.random();
    const chanceB = Math.random();
    const tallGrassChance = Math.min(chanceA, chanceB);
    const grassChance = Math.max(chanceA, chanceB);
    cave.tiles.sort((a, b) => {
        return level[b.x][b.y].location.light - level[a.x][a.y].location.light;
    }).forEach(({x, y}, i) => {
        const location = level[x][y].location;
        if (i < cave.tiles.length * tallGrassChance) {
            level[x][y] = createTile("tallGrass");
        } else if (i < cave.tiles.length * grassChance) {
            level[x][y] = createTile("grass");
        }
        level[x][y].location = location;
        if (i === 0) {
            const snake = createActor("snake");
            snake.x = x;
            snake.y = y;
            level[x][y].actor = snake;
            game.schedule.add(snake);
        }
    });
};

const ratCaveSpawner = cave => ({
    delay: 1200,
    act() {
        let ratCount = 0;
        cave.tiles.forEach(tile => {
            if (tile.actor && tile.actor.name === 'rat') {
                ratCount++;
            }
        });
        if (ratCount < 2) {
            cave.tiles.forEach(tile => {
                if (!tile.visible && Math.random() < 1/24) {
                    const rat = Math.random() > 0.001 ? createActor('rat') : createActor('albinoRat');
                    rat.x = tile.x;
                    rat.y = tile.y;
                    tile.actor = rat;
                    game.schedule.add(rat);
                }
            });
        }
        game.schedule.add(this, this.delay);
        return game.schedule.advance().act();
    },
});

const ratCave = cave => {
    let pillarCount = 0;
    const pillarMax = Math.ceil(cave.tiles.length / 12);
    cave.tiles.sort((b, a) => {
        return level[b.x][b.y].location.light - level[a.x][a.y].location.light;
    }).forEach(({x, y}, i) => {
        if (pillarCount < pillarMax) {
            if (countNeighbor(node => node.type === 'floor', x, y) === 6) {
                const location = level[x][y].location;
                const rand = Math.random();
                if (rand < 0.02) {
                    level[x][y] = createTile('brokenPillar');
                } else if (rand < 0.2) {
                    level[x][y] = createTile('crackedPillar');
                } else {
                    level[x][y] = createTile('pillar');
                }
                level[x][y].location = location;
                pillarCount++;
            }
        }
    });
    const spawner = ratCaveSpawner(cave);
    game.schedule.add(spawner, Math.random() * spawner.delay);
};

const startCave = cave => {
    let {x, y} = cave.tiles[Math.floor(cave.tiles.length * Math.random())];
    game.player.x = x;
    game.player.y = y;
    level[x][y].actor = game.player;
}

const lakeCave = cave => {
    let center;
    cave.tiles.sort((a, b) => {
        return level[b.x][b.y].light - level[a.x][a.y].light;
    });
    for (let i = 0; i < cave.tiles.length; i++) {
        const tile = cave.tiles[i];
        const {x, y} = tile;
        const wallCount = countNeighbor(tile => tile.type === 'wall', x, y);
        if (wallCount === 0) {
            center = tile;
            break;
        }
    }
    const cx = center.x;
    const cy = center.y;
    const location = level[cx][cy].location;
    level[cx][cy] = createTile('deepWater');
    level[cx][cy].location = location;

    const indeces = randRange(cave.tiles.length);
    for (let k = 0; k < Math.pow(cave.tiles.length, 1/3); k++) {
        for (let j = 0; j < cave.tiles.length; j++) {
            const i = indeces[j];
            const tile = cave.tiles[i];
            const location = tile.location;
            const {x, y} = tile;

            const wallCount = countNeighbor(tile => tile.type === 'wall', x, y);
            const deepWaterCount = countNeighbor(tile => tile.type === 'deepWater', x, y);
            const waterCount = countNeighbor(tile => tile.type === 'water', x, y);
            const waterScore = waterCount + deepWaterCount * 2;
            if (waterScore >= 6 && wallCount === 0) {
                level[x][y] = createTile('deepWater');
            } else if (waterScore >= 2) {
                level[x][y] = createTile('water');
            }
            level[x][y].location = location;
        }
    }
};

const decorateCaves = caves => {
    const indeces = randRange(caves.length);
    caves.sort((a, b) => a.tiles.length - b.tiles.length);
    for (let j = 0; j < caves.length; j++) {
        const i = indeces[j];
        const cave = caves[i];
        if (i === 0) {
            startCave(cave);
        } else if (cave.tiles.length > 7) {
            if (Math.random() < 0.5) {
                grassCave(cave);
            } else {
                ratCave(cave);
            }
        }
    }
};

const createLevel = ({width, height, prng = Math.random}) => {
	// create a 2d array to represent the level
	level = create2dArray(width, height, "wall");
    level.width = width;
    level.height = height;

    generateFloor(prng);
    removeIsolatedFloor();
    removeIsolatedWalls();
    findDeadEnds();
    fillDeadEnds();
    convert2Tiles();
    const caves = findCave();
    findExits();
    lightUp();
    decorateCaves(caves);

	return level;
};

const randomTile = (prng) => ([
    randInt(0, level.width - 1, prng),
    randInt(0, level.height - 1, prng),
]);

const randomTileFrom = (condition, prng) => {
    let x = 0;
    let y = 0;
    while (!condition(x, y)) {
        [x, y] = randomTile(prng);
    }
    return [x, y];
};

const empty = (x, y) => level[x][y].passable && !level[x][y].actor;

export {createLevel};
