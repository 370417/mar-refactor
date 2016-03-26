const actors = {
    player: {

    },
};

export default name => {
    const actor = Object.create(actors[name]);
};