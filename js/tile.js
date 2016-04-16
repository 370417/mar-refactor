const arr2rgb = ([r, g, b]) => "rgb(" + r + "," + g + "," + b + ")";

const arr2hsl = ([h, s, l]) => "hsl(" + h + "," + s + "%," + l + "%)";

const Tiles = {
	wall: {
        type: "wall",
        passable: false,
        transparent: false,
		spritex: 0,
		spritey: 0,
        litColor(light) {
            return arr2hsl([40, Math.round(10 * light), 60 + Math.round(20 * light)]);
        },
	},
    floor: {
        type: "floor",
        passable: true,
        transparent: true,
        spritex: 1,
        spritey: 0,
        litColor(light) {
            if (!light) return "#FFF";
            return arr2hsl([Math.round(360 * light), 100, 40]);
        },
    },
    marker: {
        type: "marker",
        passable: true,
        transparent: true,
        spritex: 1,
        spritey: 0,
        litColor(light) {
            return arr2rgb([0, 0, 255]);
        },
    }
};

export default name => {
	return Object.create(Tiles[name]);
};
