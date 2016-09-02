import {fov} from "./fov";
import {dijkstraMap} from "./pathfinding";

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
            dx: xDir[i],
            dy: yDir[i],
            x: x + xDir[i],
            y: y + yDir[i],
            tile: game.level[x + xDir[i]][y + yDir[i]],
        });
    }
};

const empty = (x, y) => game.level[x][y].passable && !game.level[x][y].actor;

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
    this.see();
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
    const x = this.x + dx;
    const y = this.y + dy;
    if (game.level[x][y].passable) {
        this.lastMove = {dx, dy};

        game.level[this.x][this.y].actor = undefined;
        this.x = x;
        this.y = y;
        game.level[this.x][this.y].actor = this;

        if (this === game.player) {
            this.see();
        }

        game.schedule.add(this, this.delay);
        game.schedule.advance().act();
    }
};

const act = function() {
    return this[this.state]();
}

const tunnelWandering = function() {

    const allMoves = [];
    forEachNeighbor(this.x, this.y, ({dx, dy, x, y, tile}) => {
        if (empty(x, y) && !(dx === -this.lastMove.dx && dy === -this.lastMove.dy)) {
            allMoves.push({dx, dy});
        }
    });

    if (allMoves.length) {
        const {dx, dy} = randomElement(allMoves);
        return this.move([dx, dy]);
    } else {
        console.error("Oops stuck");
    }
};

const gasMove = function({dx, dy}) {
    const x = this.x + dx;
    const y = this.y + dy;
    // count now many times this gas particle is in a tile too sparse to be gassy.
    // after 10 or so instances, delete this gas particle
    game.level[this.x][this.y][this.name]--;
    this.x = x;
    this.y = y;
    if (game.level[this.x][this.y][this.name]) {
        game.level[this.x][this.y][this.name]++;
    } else {
        game.level[this.x][this.y][this.name] = 1;
    }

    game.schedule.add(this, this.delay);
    game.schedule.advance().act();
};

const gasMotion = function() {
    const allMoves = [];
    forEachNeighbor(this.x, this.y, ({x, y, dx, dy}) => {
        if (game.level[x][y].permeable) {
            allMoves.push({dx, dy});
        }
    });

    if (allMoves.length) {
        const {dx, dy} = randomElement(allMoves);
        //console.log(dx, dy);
        return this.move({dx, dy});
    }
};

const baseActor = {
    act: act,
    move: move,
    delay: 100,
    lastMove: {
        dx: 0,
        dy: 0,
    },
};

const asActor = actor => {
    const base = Object.create(baseActor);
    for (key in actor) {
        base[key] = actor[key];
    }
    return base;
};

const actors = {
    player: asActor({
        name: "player",
        color: "white",
        spritex: 6,
        spritey: 4,
        see: see,
        act: playerAct,
    }),
    mob: asActor({
        name: "mob",
        color: "white",
        spritex: 12,
        spritey: 2,
        state: "wandering",
        wandering: tunnelWandering,
    }),
    snake: asActor({
        name: "snake",
        color: "#080",
        spritex: 5,
        spritey: 3,
        state: "wandering",
        wandering: tunnelWandering,
    }),
    G: asActor({
        name: 'G',
        color: '#DDD',
        spritex: 6,
        spritey: 0,
        state: 'wandering',
        //wandering: herdWandering,
    }),
    fastGas: asActor({
        name: "fastGas",
        color: "#FFF",
        spritex: 0,
        spritey: 0,
        state: 'brownian',
        brownian: gasMotion,
        move: gasMove,
        delay: 200,
    }),
};

const createActor = name => {
    const actor = Object.create(actors[name]);
    if (game.display) {
        game.display.cacheTile(actor);
    }
    return actor;
};

export default createActor;
