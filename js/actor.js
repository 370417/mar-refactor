import {fov} from "./fov";

/*const angle = (x1, y1, x2 = 1, y2 = 0) => {
    let l1 = Math.sqrt(x1 * x1 + y1 * y1);
    let l2 = Math.sqrt(x2 * x2 + y2 * y2);
    return Math.acos((x1 * x2 + y1 * y2) / (l1 * l2));
}*/

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
    const x = this.x + dx;
    const y = this.y + dy;
    if (game.level[x][y].passable) {
        game.level[this.x][this.y].actor = undefined;
        this.x = x;
        this.y = y;
        game.level[this.x][this.y].actor = this;

        this.see();

        game.schedule.add(this, 100);
        game.schedule.advance().act();
    }
};

const actors = {
    player: {
        color: "white",
        spritex: 0,
        spritey: 1,
        see: see,
        act: playerAct,
        move: move,
    },
};

const createActor = (name, game) => {
    const actor = Object.create(actors[name]);
    game.display.cacheTile(actor);
    return actor;
};

export default createActor;
