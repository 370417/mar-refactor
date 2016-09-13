import {randInt} from './utility';
import * as tiles from './tiles';
import * as directions from './directions';

// hack to stop the directions from being tree-shaken away
console.log(directions.DIR1);

// prevent using Math.random instead of prng accidentally
Math.random = undefined;

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

const surrounded = (level, x, y, isType) => {
    for (const key in directions) {
        const {dx, dy} = directions[key];
        if (!isType(level[x][y])) {
            return false;
        }
    }
    return true;
}

const createLevel = ({
    width,
    height,
    prng,
    startx = 24,
    starty = 15,
}) => {
    const level = [];

    for (let x = 0; x < width; x++) {
        level[x] = [];
        for (let y = 0; y < height; y++) {
            level[x][y] = {
                type: tiles.WALL,
            };
        }
    }

    const forEachTile = forEachTileOfLevel.bind(null, width, height);
    const forEachInnerTile = forEachInnerTileOfLevel.bind(null, width, height);
    const surrounded = surrounded.bind(null, level);

    // floor at starting point
    level[startx][starty].type = tiles.FLOOR;
    
    // main algorithm
    {
        const scrambledTiles = [];
        forEachInnerTile((x, y) => {
            scrambledTiles.splice(randInt(0, scrambledTiles.length), 0, {x, y});
        });

        for (let i = 0; i < scrambledTiles.length; i++) {
            const {x, y} = scrambledTiles[i];
            if (surrounded(x, y, tile => tile.type === tiles.WALL) || false) {
                level[x][y].type = tiles.FLOOR;
            }
        }
    }

    return level;
};

export {forEachTileOfLevel, createLevel};
