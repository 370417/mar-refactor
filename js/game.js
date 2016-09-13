import {forEachTileOfLevel, createLevel} from './level';

// prevent using Math.random instead of prng accidentally
Math.random = undefined;

export default ({
    width,
    height,
    prng,
    updateTile,
    updateDraw,
}) => {
    const game = {};

    const forEachTile = forEachTileOfLevel.bind(null, width, height);

    let level = createLevel({
        width,
        height,
        prng,
    });

    forEachTile((x, y) => {
        updateTile(x, y, {
            type: level[x][y].type,
        });
    });

    updateDraw();
};
