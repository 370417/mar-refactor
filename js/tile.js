const arr2rgb = ([r, g, b]) => "rgb(" + r + "," + g + "," + b + ")";

const arr2hsl = ([h, s, l]) => "hsl(" + h + "," + s + "%," + l + "%)";

const Tiles = {
	wall: {
        type: "wall",
        passable: false,
        transparent: false,
		spritex: 3,
		spritey: 4,
        color: arr2hsl([40, 10, 75]),
	},
    floor: {
        type: "floor",
        passable: true,
        transparent: true,
        spritex: 1,
        spritey: 4,
        color: "#FFF",
    },
    grass: {
        type: "grass",
        passable: true,
        transparent: true,
        spritex: 5,
        spritey: 4,
        color: "#080",
    },
    tallGrass: {
        type: "grass",
        passable: true,
        transparent: false,
        spritex: 2,
        spritey: 4,
        color: "#080",
    },
};

export default name => {
	return Object.create(Tiles[name]);
};
