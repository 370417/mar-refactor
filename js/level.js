import createTile from "./tile";
import fov from "./fov";

let level;

// create a 2d array with dimensions width by height and filled with content
const create2dArray = (width, height, content) => {
    const isFunction = typeof content === "function";
    const array = [];
    for (let x = 0; x < width; x++) {
        array[x] = [];
        for (let y = 0; y < height; y++) {
            array[x][y] = isFunction ? content() : content;
        }
    }
    return array;
};

// get the 2d coordinates like array[x][y] corresponding to a 1d index
const getCoord = (index, width, height) => {
    const y = index % height;
    const x = (index - y) / height;
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
const onEdge = (x, y, width, height) => x === 0 || y === 0 || x === width - 1 || y === height - 1;

// whether point (x, y) is in the level
const inBounds = (x, y, width, height) => x >= 0 && y >= 0 && x < width && y < height;

const inInnerBounds = (x, y, width, height) => {
    return x > (height - y) / 2 &&
           x < width - 1 - y / 2 &&
           y > 0 &&
           y < height - 1;
};

const xDir = [0, 1, 1, 0,-1,-1];
const yDir = [1, 0,-1,-1, 0, 1];

const floodFill = (x, y, width, height, type, callback) => {
    if (!inBounds(x, y, width, height) || level[x][y] !== type) {
        return;
    }
    callback(x, y);
    for (let i = 0; i < 6; i++) {
        floodFill(x + xDir[i], y + yDir[i], width, height, type, callback);
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
const generateFloor = (width, height, prng = Math.random) => {
    // loop through the level randomly
    randRange(width * height, prng).forEach(index => {
        const [x, y] = getCoord(index, width, height);
        if (inInnerBounds(x, y, width, height)) {
            if (surrounded(x, y, "wall") || countGroups(x, y) !== 1) {
                level[x][y] = "floor";
            }
        }
    });
};

// remove all but the largest group of floor
const removeIsolatedFloor = (width, height) => {
    let maxSize = 0;
    for (let x = 1; x < width - 1; x++) for (let y = 1; y < height - 1; y++) {
        let tempTile = { size: 0 };
        floodFill(x, y, width, height, "floor", (x, y) => {
            level[x][y] = tempTile;
            tempTile.size++;
        });
        if (tempTile.size > maxSize) {
            maxSize = tempTile.size;
        }
    }
    for (let x = 1; x < width - 1; x++) for (let y = 1; y < height - 1; y++) {
        if (level[x][y].size) {
            level[x][y] = level[x][y].size === maxSize ? "floor" : "wall";
        }
    }
};

// remove groups of 5 or less walls
const removeIsolatedWalls = (width, height) => {
    for (let x = 2; x < width - 2; x++) for (let y = 2; y < height - 2; y++) {
        let tempTile = { size: 0 };
        floodFill(x, y, width, height, "wall", (x, y) => {
            level[x][y] = tempTile;
            tempTile.size++;
        });
    }
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
        if (level[x][y].size) {
            level[x][y] = level[x][y].size > 5 ? "wall" : "floor";
        }
    }
};

const isDeadEnd = (x, y) => countNeighbor("floor", x, y) === 1;

const findDeadEnds = (width, height) => {
    for (let x = 1; x < width - 1; x++) for (let y = 1; y < height - 1; y++) {
        if (level[x][y] === "floor" && isDeadEnd(x, y)) {
            floodFill(x, y, width, height, isDeadEnd, (x, y) => {
                level[x][y] = "deadEnd";
            });
        }
    }
};

const convert2Tiles = (width, height) => {
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
        level[x][y] = createTile(level[x][y]);
    }
};

const normalizeLight = (maxLight, width, height) => {
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
        level[x][y].light /= maxLight;
    }
};

const lightUp = (width, height) => {
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
        level[x][y].light = 0;
    }
    let maxLight = 0;
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
        if (level[x][y].transparent) {
            fov(x, y, (x, y) => level[x][y].transparent, (x, y) => {
                level[x][y].light++;
                if (level[x][y].light > maxLight) {
                    maxLight = level[x][y].light;
                }
            });
        }
    }
    normalizeLight(maxLight, width, height);
};

const createLevel = ({width, height, prng = Math.random}) => {
	// create a 2d array to represent the level
	level = create2dArray(width, height, "wall");

    generateFloor(width, height, prng);
    removeIsolatedFloor(width, height);
    removeIsolatedWalls(width, height);
    findDeadEnds(width, height);
    convert2Tiles(width, height);
    lightUp(width, height);

	return level;
};

const randomTile = (width, height, prng) => ([
    randInt(0, width - 1, prng),
    randInt(0, height - 1, prng),
]);

const populateLevel = (player) => {
    let x = 0;
    let y = 0;
    while (level[x][y].type !== "floor") {
        [x, y] = randomTile(level.length, level[0].length);
    }
    player.x = x;
    player.y = y;
    level[x][y].actor = player;
    return level;
};

export {createLevel, populateLevel};
