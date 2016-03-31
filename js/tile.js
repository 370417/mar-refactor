const Tiles = {
	wall: {
        type: "wall",
        color: "white",
		spritex: 0,
		spritey: 0,
	},
    floor: {
        type: "floor",
        color: "white",
        spritex: 1,
        spritey: 0,
    },
};

export default name => {
	return Object.create(Tiles[name]);
};