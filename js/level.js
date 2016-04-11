import createTile from "./tile";
import {fov} from "./fov";
import {dijkstraMap} from "./pathfinding";

let level;

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
const countNeighbor = (type, x, y) => {
    let count = 0;
    for (let i = 0; i < 6; i++) {
        if (level[x + xDir[i]][y + yDir[i]] === type) {
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
    for (let x = 1; x < level.width - 1; x++) for (let y = 1; y < level.height - 1; y++) {
        let tempTile = { size: 0 };
        floodFill(x, y, isFloor, (x, y) => {
            level[x][y] = tempTile;
            tempTile.size++;
        });
        if (tempTile.size > maxSize) {
            maxSize = tempTile.size;
        }
    }
    for (let x = 1; x < level.width - 1; x++) for (let y = 1; y < level.height - 1; y++) {
        if (level[x][y].size) {
            level[x][y] = level[x][y].size === maxSize ? "floor" : "wall";
        }
    }
};

// remove groups of 5 or less walls
const removeIsolatedWalls = () => {
    for (let x = 2; x < level.width - 2; x++) for (let y = 2; y < level.height - 2; y++) {
        let tempTile = { size: 0 };
        floodFill(x, y, isWall, (x, y) => {
            level[x][y] = tempTile;
            tempTile.size++;
        });
    }
    for (let x = 0; x < level.width; x++) for (let y = 0; y < level.height; y++) {
        if (level[x][y].size) {
            level[x][y] = level[x][y].size > 5 ? "wall" : "floor";
        }
    }
};

const isDeadEnd = (x, y) => level[x][y] === "floor" && countNeighbor("floor", x, y) === 1;

const findDeadEnds = () => {
    for (let x = 1; x < level.width - 1; x++) for (let y = 1; y < level.height - 1; y++) {
        if (level[x][y] === "floor" && isDeadEnd(x, y)) {
            floodFill(x, y, isDeadEnd, (x, y) => {
                level[x][y] = "deadEnd";
            });
        }
    }
};

const fillDeadEnds = () => {
    for (let x = 1; x < level.width - 1; x++) for (let y = 1; y < level.height - 1; y++) {
        if (level[x][y] === "deadEnd") {
            level[x][y] = "wall";
        }
    }
};

const convert2Tiles = () => {
    for (let x = 0; x < level.width; x++) for (let y = 0; y < level.height; y++) {
        level[x][y] = createTile(level[x][y]);
    }
};

const findDistanceFromWall = () => {
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

    const map = dijkstraMap({graph, end, neighbor, cost});

    map.forEach(node => {
        if (node.cost > 1) {
            //level[node.x][node.y] = createTile("wall");
        }
    });
};

const normalizeLight = (maxLight) => {
    for (let x = 0; x < level.width; x++) for (let y = 0; y < level.height; y++) {
        level[x][y].light /= maxLight;
    }
};

const lightUp = () => {
    for (let x = 0; x < level.width; x++) for (let y = 0; y < level.height; y++) {
        level[x][y].light = 0;
    }
    let maxLight = 0;
    for (let x = 0; x < level.width; x++) for (let y = 0; y < level.height; y++) {
        if (level[x][y].transparent) {
            fov(x, y, (x, y) => level[x][y].transparent, (x, y) => {
                level[x][y].light++;
                if (level[x][y].light > maxLight) {
                    maxLight = level[x][y].light;
                }
            });
        }
    }
    normalizeLight(maxLight);
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
    findDistanceFromWall();
    lightUp();

	return level;
};

const randomTile = (width, height, prng) => ([
    randInt(0, width - 1, prng),
    randInt(0, height - 1, prng),
]);

const populateLevel = (player, x, y) => {
    if (x === undefined) {
        x = 0;
        y = 0;
        while (!level[x][y].passable) {
            [x, y] = randomTile(level.width, level.height);
        }
    }
    player.x = x;
    player.y = y;
    level[x][y].actor = player;
    return level;
};

const available = (x, y) => {
    return level[x][y].passable && level[x][y].actor === undefined;
};

const addStairs = () => {
    let x = 0;
    let y = 0;
    while (!available(x, y)) {
        [x, y] = randomTile(level.width, level.height);
    }
    
};

const addItems = () => {
    addStairs();
};

export {createLevel, populateLevel, addItems};
