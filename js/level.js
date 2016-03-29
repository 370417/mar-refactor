import createTile from "./tile";

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

// [xDir8[n], yDir8[n]] corresponds to one of the 8 directions in clock order
const xDir8 = [0, 1, 1, 1, 0,-1,-1,-1];
const yDir8 = [1, 1, 0,-1,-1,-1, 0, 1];

// [xDir4[n], yDir4[n]] corresponds to one of the 4 cardinal directions in clock order
const xDir4 = [0, 1, 0,-1];
const yDir4 = [1, 0,-1, 0];

// whether point (x, y) is surrounded by type
const surrounded = (x, y, type, xDir = xDir8, yDir = yDir8) => {
    for (let i = 0; i < xDir.length; i++) {
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
    let prev = level[x + xDir8[7]][y + yDir8[7]];
    // loop through neighbors in order
    for (let i = 0; i < 8; i++) {
        let curr = level[x + xDir8[i]][y + yDir8[i]];
        // count transitions from floor to wall
        if (prev !== "wall" && curr === "wall") {
            groups++;
        }
        prev = curr;
    }
    // if there are no transitions, check if all neighbors are walls
    return !groups && prev === "wall" ? 1 : groups;
};

// generate floor in the level to create caves
const generateFloor = (width, height, prng = Math.random) => {
    // loop through the level randomly
    randRange(width * height, prng).forEach(index => {
        const [x, y] = getCoord(index, width, height);
        if (!onEdge(x, y, width, height)) {
            if (surrounded(x, y, "wall") || countGroups(x, y) !== 1) {
                level[x][y] = "floor";
            }
        }
    });
};

// remove walls that are surrounded by floor in 4 directions
const removeIsolatedWalls = (width, height) => {
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
        if (!onEdge(x, y, width, height) && level[x][y] === "wall" && surrounded(x, y, "floor", xDir4, yDir4)) {
            level[x][y] = "floor";
        }
    }
};

const convert2Tiles = (width, height) => {
    for (let x = 0; x < width; x++) for (let y = 0; y < height; y++) {
        level[x][y] = createTile(level[x][y]);
    }
};

const createLevel = ({width, height, prng = Math.random}) => {
	// create a 2d array to represent the level
	level = create2dArray(width, height, "wall");

    generateFloor(width, height, prng);
    removeIsolatedWalls(width, height);
    convert2Tiles(width, height);

	return level;
};

const populateLevel = (player) => {
    level[1][1].actor = player;

    return level;
};

export {createLevel, populateLevel};

