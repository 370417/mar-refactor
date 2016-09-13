const arr2rgb = ([r, g, b]) => "rgb(" + r + "," + g + "," + b + ")";

const arr2hsl = ([h, s, l]) => "hsl(" + h + "," + s + "%," + l + "%)";

const wallColor = arr2hsl([40, 10, 75]);

const grassColor = 'hsl(120, 50%, 50%)';

const Tiles = {
	wall: {
        type: "wall",
        passable: false,
        permeable: false,
        transparent: false,
		spritex: 0,
		spritey: 0,
        color: wallColor,
	},
    floor: {
        type: "floor",
        passable: true,
        permeable: true,
        transparent: true,
        spritex: 1,
        spritey: 0,
        color: "#FFF",
    },
    grass: {
        type: "grass",
        passable: true,
        permeable: true,
        transparent: true,
        spritex: 2,
        spritey: 0,
        color: grassColor,
    },
    tallGrass: {
        type: "grass",
        passable: true,
        permeable: true,
        transparent: false,
        spritex: 3,
        spritey: 0,
        color: grassColor,
    },
    deepWater: {
        type: 'deepWater',
        passable: true,
        permeable: true,
        transparent: true,
        spritex: 10,
        spritey: 4,
        color: '#008',
    },
    water: {
        type: 'water',
        passable: true,
        permeable: true,
        transparent: true,
        spritex: 10,
        spritey: 4,
        color: '#88F',
    },
    pillar: {
        type: 'pillar',
        passable: false,
        permeable: false,
        transparent: false,
        spritex: 5,
        spritey: 0,
        color: wallColor,
    },
    crackedPillar: {
        type: 'crackedPillar',
        passable: false,
        permeable: true,
        transparent: false,
        spritex: 6,
        spritey: 0,
        color: wallColor,
    },
    brokenPillar: {
        type: 'brokenPillar',
        passable: false,
        permeable: true,
        transparent: true,
        spritex: 7,
        spritey: 0,
        color: wallColor,
    },
};

export default name => {
	const tile = Object.create(Tiles[name]);
    tile.location = {};
    return tile;
};
