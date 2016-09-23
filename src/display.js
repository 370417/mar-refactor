{

//========================================
//                           HTML ELEMENTS

const width = 48;
const height = 31;

const xu = 18;
const yu = 24;
const overlap = 8;

// create game element
const $game = document.getElementById('game');
$game.style.width = (width - height / 2 + 1) * xu + 'px';
$game.style.height = yu + (height - 1) * (yu - overlap) + 'px';

// create canvases
const canvases = [];
const bgcanvases = [];
const ctxs = [];
const bgctxs = [];
for (let i = 0; i < height; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = (width - height / 2 + 1) * xu;
    canvas.height = yu;
    canvas.style.top = i * (yu - overlap) + 'px';
    const ctx = canvas.getContext('2d');
    canvases[i] = canvas;
    ctxs[i] = ctx;

    const bgcanvas = document.createElement('canvas');
    bgcanvas.width = canvas.width;
    bgcanvas.height = canvas.height;
    bgcanvas.style.top = canvas.style.top;
    const bgctx = bgcanvas.getContext('2d');
    bgcanvases[i] = bgcanvas;
    bgctxs[i] = bgctx;

    $game.appendChild(bgcanvas);
    $game.appendChild(canvas);
}

//========================================
//                                   TILES

const tileset = document.createElement('img');

const Tiles = {
    wall: {
        spritex: 0,
        spritey: 0,
        color: 'hsl(40, 10%, 75%)',
    },
    floor: {
        spritex: 1,
        spritey: 0,
        color: 'hsl(0, 0%, 100%)',
    },
    grass: {
        spritex: 2,
        spritey: 0,
        color: 'hsl(120, 50%, 50%)',
    },
    stairsDown: {
        spritex: 8,
        spritey: 0,
        color: 'hsl(40, 0%, 75%)',
    },
    player: {
        spritex: 0,
        spritey: 1,
        color: 'hsl(0, 0%, 100%)',
    },
    wolf: {
        spritex: 0,
        spritey: 2,
        color: 'white',
    },
    tripwire1_7: {
        spritex: 2,
        spritey: 3,
        color: 'white',
    },
    tripwire3_9: {
        spritex: 0,
        spritey: 3,
        color: 'white',
    },
    tripwire5_11: {
        spritex: 1,
        spritey: 3,
        color: 'white',
    },
};

// create cached canvases for a tile
const cacheTile = (tile) => {
    const canvas = document.createElement('canvas');
    canvas.width = xu;
    canvas.height = yu;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(tileset, tile.spritex * xu, tile.spritey * yu, xu, yu, 0, 0, xu, yu);
    ctx.fillStyle = tile.color;
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillRect(0, 0, xu, yu);
    tile.canvas = canvas;

    const bgcanvas = document.createElement('canvas');
    bgcanvas.width = xu;
    bgcanvas.height = yu;
    const bgctx = bgcanvas.getContext('2d');
    bgctx.drawImage(canvas, 0, 0, xu, yu);
    bgctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    bgctx.globalCompositeOperation = 'source-atop';
    bgctx.fillRect(0, 0, xu, yu);
    tile.bgcanvas = bgcanvas;
};

const cacheTiles = () => {
    for (const tileName in Tiles) {
        const tile = Tiles[tileName];
        cacheTile(tile);
    }
};

//========================================
//                                 DRAWING

const clearTile = (x, y) => {
    const ctx = ctxs[y];
    const realx = (x - (height - y - 1) / 2) * xu;
    ctx.clearRect(realx, 0, xu, yu);
};

const clearAll = () => {

    for (let y = 0; y < height; y++) {console.log(y);
        const ctx = ctxs[y];
        ctx.clearRect(0, 0, (width - height / 2 + 1) * xu, yu);
    }
};

const drawTile = (x, y, clear = true) => {
    const tile = level[x][y];
    if (!tile.seen) {
        return;
    }
    const ctx = ctxs[y];
    const realx = (x - (height - y - 1) / 2) * xu;
    if (clear) {
        ctx.clearRect(realx, 0, xu, yu);
    }
    if (tile.actor) {
            ctx.drawImage(Tiles[tile.actor.type].canvas, 0, 0, xu, yu, realx, 0, xu, yu);
        }
    if (tile.visible) {
        if (tile.actor) {
            //ctx.drawImage(Tiles[tile.actor.type].canvas, 0, 0, xu, yu, realx, 0, xu, yu);
        } else {
            ctx.drawImage(Tiles[tile.type].canvas, 0, 0, xu, yu, realx, 0, xu, yu);
        }
    } else {
        ctx.drawImage(Tiles[tile.type].bgcanvas, 0, 0, xu, yu, realx, 0, xu, yu);
    }
};

//========================================
//                               ANIMATION

// create a dislpay-side level
const level = [];
for (let x = 0; x < width; x++) {
    level[x] = [];
    for (let y = 0; y < height; y++) {
        level[x][y] = {};
    }
}

// call fun() after tick number of ticks
const setTickout = (fun, tick) => {
    if (tick <= 0) {
        fun();
    } else {
        requestAnimationFrame(() => {
            setTickout(fun, tick - 1);
        });
    }
};

const animationQueue = createSchedule();

// animate one frame
const animate = () => {

    const next = animationQueue.advance();
    if (!next) {
        inputMode.pop();
        while (currMode() === 'playing' && keyBuffer.length) {
            keydown({code: keyBuffer.shift()});
        }
        return;
    }
    let nextFrame;
    const {event: {x, y, dx, dy, type, tileType, visible, seen, actor}, delta} = next;
    if (type === 'setTile') {
        nextFrame = () => {
            let clear = true;
            if (level[x][y].type === tileType) {
                clear = false;
            }
            level[x][y].type = tileType;
            level[x][y].visible = visible;
            level[x][y].seen = seen;
            drawTile(x, y, clear);
            animate();
        };
    } else if (type === 'clearTile') {
        nextFrame = () => {
            level[x][y].seen = false;
            clearTile(x, y);
            animate();
        };
    } else if (type === 'clearAll') {
        nextFrame = () => {
            forEachTileOfLevel(width, height, (x, y) => {
                level[x][y] = {};
            });
            clearAll();
            animate();
        };
    } else if (type === 'createActor') {
        nextFrame = () => {
            level[x][y].actor = actor;
            drawTile(x, y);
            animate();
        };
    } else if (type === 'moveActor') {
        nextFrame = () => {
            const actor = level[x][y].actor;
            level[x][y].actor = undefined;
            const x2 = x + dx;
            const y2 = y + dy;
            level[x2][y2].actor = actor;
            drawTile(x, y);
            drawTile(x2, y2);
            animate();
        };
    }
    if (delta && currMode() === 'animating') {
        setTickout(nextFrame, delta);
    } else {
        nextFrame();
    }
};

const animation = {
    // clear animation queue
    clearQueue() {
        animationQueue.next = undefined;
        animationQueue.last = undefined;
    },
    // schedule an animation
    queue(animation, delay, prev) {
        return animationQueue.add(animation, delay, prev);
    },
    // schedule a tile animation event
    queueTile(x, y, tileType, visible, seen, delay, prev) {
        return animationQueue.add({
            type: 'setTile',
            x,
            y,
            tileType,
            visible,
            seen,
        }, delay, prev);
    },
    // clear a tile
    clearTile(x, y, delay, prev) {
        return animationQueue.add({
            type: 'clearTile',
            x,
            y,
        }, delay, prev);
    },
    // clear the display
    clearAll(delay, prev) {
        return animationQueue.add({
            type: 'clearAll',
        }, delay, prev);
    },
    createActor(x, y, actor, delay, prev) {
        return animationQueue.add({
            type: 'createActor',
            x,
            y,
            actor,
        }, delay, prev);
    },
    moveActor(x, y, dx, dy, delay, prev) {
        return animationQueue.add({
            type: 'moveActor',
            x,
            y,
            dx,
            dy,
        }, delay, prev);
    },
    animate() {
        if (currMode() === 'playing') {
            if (keyBuffer.length) {
                inputMode.push('skipping');
            } else {
                inputMode.push('animating');
            }
        }
        animate();
    },
};

//========================================
//                                   INPUT

let input;

const keyCode2code = {
    '13': 'Enter',
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

const code2direction = {
    KeyW: DIR11,
    KeyE: DIR1,
    KeyA: DIR9,
    KeyD: DIR3,
    KeyZ: DIR7,
    KeyX: DIR5,
};

// stack of modes for input
const inputMode = ['playing'];
const currMode = () => inputMode[inputMode.length-1];

// buffer for keys pressed while animating
const keyBuffer = [];

// handles keydown for each mode
const modalKeydown = {
    animating: (code) => {
        // skip animation
        inputMode[inputMode.length-1] = 'skipping';
        // make sure keypress is processed
        keyBuffer.push(code);
    },
    skipping: (code) => {
        // make sure keypress is processed
        keyBuffer.push(code);
    },
    playing: (code) => {
        if (code2direction[code]) {
            input({
                type: 'move',
                direction: code2direction[code],
            });
        } else if (code === 'KeyS') {
            input({
                type: 'rest',
            });
        }
        if (code === 'Enter' || code === 'Space') {
            input({
                type: 'interact',
            });
        }
    },
};

const keydown = (e) => {
    const code = e.code || keyCode2code[e.keyCode];

    modalKeydown[currMode()](code);
};

//========================================
//                              START GAME

const startGame = () => {
    const seed =  Date.now();
    console.log(seed);
    cacheTiles();
    input = createGame({
        width, 
        height,
        seed,
        animation,
    });

    window.addEventListener('keydown', keydown, false);
};

tileset.addEventListener('load', startGame);
tileset.src = 'tileset2.png';

}
