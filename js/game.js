import {createLevel, populateLevel} from "./level";
import createActor from "./actor";
import createSchedule from "./scheduler";
import {keyDown} from "./input";

let game;

const startGame = ({seed, width, height}) => {
    window.game = game;

    game.player = createActor("player", game);

    game.schedule = createSchedule();
    game.schedule.add(game.player);

    game.level = createLevel({width, height});
    game.display.cacheLevel(game.level);

    populateLevel(game.player);

    // add listeners
    window.addEventListener("keydown", keyDown.bind(null, game.player));

    game.player.see();
    game.schedule.advance().act();
};

export default ({seed = 0, display, width = 60, height = 30}) => {
    game = {
        seed,
        display,
        width,
        height,
    };

	display.setDimensions(width, height, 16, 18, 1);
	display.load("tileset.png", startGame.bind(null, {seed, width, height}));
};