import {createLevel, populateLevel} from "./level";
import createActor from "./actor";
import createSchedule from "./scheduler";

let game;

const drawLevel = _ => {
    game.display.draw(game.currentLevel);
};

const startGame = ({seed, width, height}) => {
    game.player = createActor("player", drawLevel, game.display.cacheTile.bind(game.display));

    game.schedule = createSchedule();
    game.schedule.add(game.player);

    game.currentLevel = createLevel({width, height});
    game.display.cacheLevel(game.currentLevel);

    populateLevel(game.player);

    game.player.act();
};

export default ({seed = 0, display, width = 40, height = 30}) => {
    game = {
        seed,
        display,
        width,
        height,
    };

	display.setDimensions(width, height, 8, 2);
	display.load("tileset.png", startGame.bind(null, {seed, width, height}));
};