const Tiles = {
	wall: {
        type: "wall",
        passable: false,
        transparent: false,
        color: "white",
		spritex: 0,
		spritey: 0,
	},
    floor: {
        type: "floor",
        passable: true,
        transparent: true,
        color: "white",
        spritex: 1,
        spritey: 0,
    },
};

export default name => {
	return Object.create(Tiles[name]);
};