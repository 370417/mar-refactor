import {createLevel, populateLevel, addItems} from "./level";
import createActor from "./actor";
import createSchedule from "./scheduler";
import {keyDown, tileHover} from "./input";

let game;

const startGame = ({seed, width, height}) => {
    window.game = game;

    game.player = createActor("player");

    game.schedule = createSchedule();
    game.schedule.add(game.player);

    game.level = createLevel({width, height});
    game.display.cacheLevel(game.level);

    // add listeners
    window.addEventListener("keydown", keyDown.bind(null, game));
    game.display.setMouseListener(tileHover.bind(null, game));

    game.player.see();
    game.schedule.advance().act();
};

export default ({seed = 0, display, width = 48, height = 30}) => {
    game = {
        seed,
        display,
        width,
        height,
    };

	display.setDimensions(width, height, 8, 8, 2);
	display.load("tileset.png", startGame.bind(null, {seed, width, height}));
};
