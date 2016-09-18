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
    canvas.width = (width - height / 2 + 1)* xu;
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

const drawTile = (x, y, {type, seen, visible}) => {
    if (!seen || level[x][y].actor) {
        return;
    }
    const ctx = ctxs[y];
    const tile = Tiles[type];
    const realx = (x - (height - y - 1) / 2) * xu;
    ctx.clearRect(realx, 0, xu, yu);
    if (visible) {
        ctx.drawImage(tile.canvas, 0, 0, xu, yu, realx, 0, xu, yu);
    } else {
        ctx.drawImage(tile.bgcanvas, 0, 0, xu, yu, realx, 0, xu, yu);
    }
};

const drawActor = (x, y, {type}) => {
    const ctx = ctxs[y];
    const actor = Tiles[type];
    const realx = (x - (height - y - 1) / 2) * xu;
    ctx.clearRect(realx, 0, xu, yu);
    ctx.drawImage(actor.canvas, 0, 0, xu, yu, realx, 0, xu, yu);
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
        return;
    }
    let nextFrame;
    const {event: {x, y, type, tileType, visible, actor}, delta} = next;
    if (type === 'setTile') {
        nextFrame = () => {
            drawTile(x, y, {
                type: tileType,
                visible,
                seen: true,
            });
            animate();
        };
    } else if (type === 'clearTile') {
        nextFrame = () => {
            level[x][y].seen = false;
            clearTile(x, y);
            animate();
        };
    } else if (type === 'createActor') {
        nextFrame = () => {
            level[x][y].actor = actor;
            drawActor(x, y, actor);
            animate();
        };
    }
    if (delta && currMode() === 'animating') {
        console.log(delta);
        setTickout(nextFrame, delta);
    } else {
        nextFrame();
    }
};

const animation = {
    // clear animation queue
    clearQueue() {
        animationQueue.next = undefined;
    },
    // schedule an animation
    queue(animation, delay, prev) {
        return animationQueue.add(animation, delay, prev);
    },
    // schedule a tile animation event
    queueTile(x, y, tileType, visible, delay, prev) {
        return animationQueue.add({
            type: 'setTile',
            x,
            y,
            tileType,
            visible,
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
    createActor(x, y, actor, delay, prev) {
        return animationQueue.add({
            type: 'createActor',
            x,
            y,
            actor,
        }, delay, prev);
    },
    animate() {
        if (currMode() !== 'animating') {
            inputMode.push('animating');
        }
        animate();
    },
};

//========================================
//                                   INPUT

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

// stack of modes for input
const inputMode = ['playing'];
const currMode = () => inputMode[inputMode.length-1];

// handles keydown for each mode
const modalKeydown = {
    animating: (code) => {
        // skip animation
        inputMode[inputMode.length-1] = 'skipping';
    },
    playing: (code) => {
        
    },
};

const keydown = (e) => {
    const code = e.code || keyCode2code[e.keyCode];

    modalKeydown[currMode()](code);
};

//========================================
//                              START GAME

const startGame = () => {
    const seed = 1474169198547 || Date.now();
    console.log(seed);
    cacheTiles();
    createGame({
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
