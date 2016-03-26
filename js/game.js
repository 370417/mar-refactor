import createLevel from "./level";

const startGame = ({seed, display, width, height}) => {
    let level = createLevel({width, height});
    display.draw(level);
};

export default ({seed = 0, display, width = 40, height = 30}) => {
	display.setDimensions(width, height, 8, 2);
	display.load("tileset.png", startGame.bind(null, {seed, display, width, height}));
};