const playerAct = function() {
    this.display();
};

const actors = {
    player: {
        color: "white",
        spritex: 6,
        spritey: 4,
        act: playerAct,
    },
};

export default (name, display, cacheTile) => {
    const actor = Object.create(actors[name]);
    actor.display = display;
    cacheTile(actor);
    return actor;
};