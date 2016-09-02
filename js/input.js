import createActor from "./actor";

const keyCode2code = {
    '27': 'Escape',
    '32': 'Space',
    '37': 'ArrowLeft',
    '38': 'ArrowUp',
    '39': 'ArrowRight',
    '40': 'ArrowDown',
    '65': 'KeyA',
    '66': 'KeyB',
    '67': 'KeyC',
    '68': 'KeyD',
    '69': 'KeyE',
    '70': 'KeyF',
    '71': 'KeyG',
    '72': 'KeyH',
    '73': 'KeyI',
    '74': 'KeyJ',
    '75': 'KeyK',
    '76': 'KeyL',
    '77': 'KeyM',
    '78': 'KeyN',
    '79': 'KeyO',
    '80': 'KeyP',
    '81': 'KeyQ',
    '82': 'KeyR',
    '83': 'KeyS',
    '84': 'KeyT',
    '85': 'KeyU',
    '86': 'KeyV',
    '87': 'KeyW',
    '88': 'KeyX',
    '89': 'KeyY',
    '90': 'KeyZ',
};

const code2offset = {
    KeyW: [ 0,-1],
    KeyE: [ 1,-1],
    KeyD: [ 1, 0],
    KeyX: [ 0, 1],
    KeyZ: [-1, 1],
    KeyA: [-1, 0],
    KeyS: [ 0, 0],
};

const modes = ['playing'];

const keyModes = {
    playing: (game, code) => {
        if (code2offset[code]) {
            game.player.move(code2offset[code]);
        }

        if (code === 'Space') {
            const {x, y} = game.player;
            for (let i = 200; i > 0; i--) {
                const gas = createActor("fastGas");
                gas.x = x;
                gas.y = y;
                if (game.level[x][y]["fastGas"]) {
                    game.level[x][y]["fastGas"]++;
                } else {
                    game.level[x][y]["fastGas"] = 1;
                }
                game.schedule.add(gas, i);
            }
        }

        if (code === 'KeyF') {
            modes.push('firing');
        }
    },
    firing: (game, code) => {
        if (code === 'Escape') {
            game.display.clearFg();
            modes.pop();
        }
    },
};

const keyDown = (game, e) => {
    const code = e.code || keyCode2code[e.keyCode];

    // meta F for fullscreen
    if (e.metaKey && code === 'KeyF') {
        const elem = document.body;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    }

    const mode = modes[modes.length - 1];
    keyModes[mode](game, code);
};

const mousemoveModes = {
    playing: (game, x, y) => {},
    firing: (game, x, y) => {
        game.display.lineToMouse(x, y);
    },
};

const tileHover = (game, x, y) => {
    const mode = modes[modes.length - 1];
    mousemoveModes[mode](game, x, y);
};

export {keyDown, tileHover};
