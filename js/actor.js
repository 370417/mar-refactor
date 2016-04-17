import {fov} from "./fov";

/*const angle = (x1, y1, x2 = 1, y2 = 0) => {
    let l1 = Math.sqrt(x1 * x1 + y1 * y1);
    let l2 = Math.sqrt(x2 * x2 + y2 * y2);
    return Math.acos((x1 * x2 + y1 * y2) / (l1 * l2));
}*/

const xDir = [0, 1, 1, 0,-1,-1];
const yDir = [1, 0,-1,-1, 0, 1];

const forEachNeighbor = (x, y, func) => {
    for (let i = 0; i < 6; i++) {
        func({
            x: x + xDir[i],
            y: y + yDir[i],
            tile: game.level[x + xDir[i]][y + yDir[i]],
        });
    }
};


// return a random number in the range [lower, upper]
const randInt = (lower, upper, prng = Math.random) => {
    if (lower > upper) {
        console.error("lower > upper");
        return NaN;
    }
    return lower + Math.floor((upper - lower + 1) * prng());
};

const randomElement = (array, prng = Math.random) => array[randInt(0, array.length - 1, prng)];

const playerAct = function() {
    game.display.draw(game.level);
};

const see = function() {
    const reveal = (x, y) => {
        game.level[x][y].visible = true;
        game.level[x][y].seen = true;
    };

    for (let x = 0; x < game.width; x++) for (let y = 0; y < game.height; y++) {
        game.level[x][y].visible = false;
    }
    fov(this.x, this.y, (x, y) => game.level[x][y].transparent, reveal);
};

const move = function([dx, dy]) {
    console.log(dx, dy);
    const x = this.x + dx;
    const y = this.y + dy;
    if (game.level[x][y].passable) {
        game.level[this.x][this.y].actor = undefined;
        this.x = x;
        this.y = y;
        game.level[this.x][this.y].actor = this;

        if (this === game.player) {
            this.see();
        }

        game.schedule.add(this, 100);
        game.schedule.advance().act();
    }
};

const act = function() {
    return this[this.state]();
}

const caveExitWandering = function() {
    let bestNeighbors = [];
    let cost = game.level[this.x][this.y].light;
    let pathFound = false;
    forEachNeighbor(this.x, this.y, ({x, y, tile}) => {
        if (!tile.passable) { return; }
        if (tile.light < cost) {
            pathFound = true;
            cost = tile.light;
            bestNeighbors = [{x, y}];
        } else if (tile.light === cost) {
            bestNeighbors.push({x, y});
        }
    });

    if (pathFound) {
        const {x, y} = randomElement(bestNeighbors);
        return this.move([x - this.x, y - this.y]);
    } else {
        console.log("no path found");
    }
};

const actors = {
    player: {
        name: "player",
        color: "white",
        spritex: 6,
        spritey: 4,
        see: see,
        act: playerAct,
        move: move,
    },
    mob: {
        name: "mob",
        color: "white",
        spritex: 12,
        spritey: 2,
        state: "wandering",
        wandering: caveExitWandering,
        act: act,
        move: move,
    }
};

const createActor = (name) => {
    const actor = Object.create(actors[name]);
    game.display.cacheTile(actor);
    return actor;
};

export default createActor;
