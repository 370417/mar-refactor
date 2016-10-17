{

let player = {};

//========================================
//                           HTML ELEMENTS

const width = 48;
const height = 31;

const xu = 18;
const yu = 24;
const overlap = 8;

const sidewidth = 200;

// create game element
const $game = document.getElementById('game');
$game.style.width = (width - height / 2 + 1) * xu + sidewidth + 'px';
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

const wallColor = 'hsl(40, 10%, 67%)';

const Tiles = {
    wall: {
        spritex: 0,
        spritey: 0,
        color: wallColor,
        bgcolor: 'hsl(240, 10%, 18%)',
        passable: false,
    },
    floor: {
        spritex: 0, //1,
        spritey: 0,
        color: 'hsl(40, 10%, 25%)',
        bgcolor: 'hsl(240, 10%, 10%)',
        passable: true,
    },
    grass: {
        spritex: 2,
        spritey: 0,
        color: 'hsl(120, 50%, 50%)',
        passable: true,
    },
    stairsDown: {
        spritex: 7,
        spritey: 1,
        color: 'white',
        passable: true,
    },
    player: {
        spritex: 0,
        spritey: 1,
        color: 'hsl(0, 0%, 100%)',
    },
    snake: {
        spritex: 2,
        spritey: 2,
        color: 'hsl(40, 100%, 80%)',
    },
    tripwirez: {
        spritex: 2,
        spritey: 3,
        color: 'white',
        passable: true,
    },
    tripwirey: {
        spritex: 0,
        spritey: 3,
        color: 'white',
    },
    tripwirex: {
        spritex: 1,
        spritey: 3,
        color: 'white',
        passable: true,
    },
    pillar: {
        spritex: 5,
        spritey: 0,
        color: wallColor,
        passable: true,
    },
    crackedPillar: {
        spritex: 6,
        spritey: 0,
        color: wallColor,
        passable: true,
    },
    brokenPillar: {
        spritex: 7,
        spritey: 0,
        color: wallColor,
        passable: true,
    },
    reticle: {
        spritex: 4,
        spritey: 0,
        color: 'hsla(180, 100%, 50%, 0.333)',
    },
    arrow: {
        spritex: 2,
        spritey: 4,
        color: 'white',
    },
    pit: {
        spritex: 13,
        spritey: 4,
        color: 'hsl(40, 10%, 25%)',
        bgcolor: 'hsl(240, 10%, 10%)',
        passable: true,
    }
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
    bgctx.fillStyle = tile.bgcolor || 'rgba(0, 0, 0, 0.6)';
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

// create a dislpay-side level
const level = [];
for (let x = 0; x < width; x++) {
    level[x] = [];
    for (let y = 0; y < height; y++) {
        level[x][y] = {};
    }
}

const clearTile = (x, y) => {
    const ctx = ctxs[y];
    const realx = (x - (height - y - 1) / 2) * xu;
    ctx.clearRect(realx, 0, xu, yu);
};

const clearAll = () => {

    for (let y = 0; y < height; y++) {
        const ctx = ctxs[y];
        ctx.clearRect(0, 0, (width - height / 2 + 1) * xu, yu);
    }
};

const drawTile = (x, y, clear = true) => {
    const tile = level[x][y];
    if (!tile.seen) {
        console.log('wut');
        return;
    }
    const ctx = ctxs[y];
    const realx = (x - (height - y - 1) / 2) * xu;
    if (clear) {
        ctx.clearRect(realx, 0, xu, yu);
    }

    const drawImage = (canvas) => ctx.drawImage(canvas, 0, 0, xu, yu, realx, 0, xu, yu);

    if (tile.visible) {
        drawImage(Tiles[tile.type].canvas);
        if (tile.actor) {
            drawImage(Tiles[tile.actor.type].canvas);
        }
        else if (tile.prop) {
            drawImage(Tiles[tile.prop].canvas);
        }
    } else {
        ctx.drawImage(Tiles[tile.type].bgcanvas, 0, 0, xu, yu, realx, 0, xu, yu);
        if (tile.prop) {
            drawImage(Tiles[tile.prop].bgcanvas);
        }
    }
};

const drawReticle = (x, y) => {
    const ctx = ctxs[y];
    const realx = (x - (height - y - 1) / 2) * xu;
    ctx.drawImage(Tiles.reticle.canvas, 0, 0, xu, yu, realx, 0, xu, yu);
};

const tileIsType = (x, y, type) => level[x] && level[x][y] && level[x][y].type === type;

//========================================
//                               ANIMATION

const animationQueue = createSchedule();
let timeout;
let timeoutFunction;

// call fun() after tick number of ticks
const setTickout = (fun, tick) => {
    if (tick <= 0) {
        fun();
    } else {
        timeoutFunction = fun;
        timeout = requestAnimationFrame(() => {
            setTickout(fun, tick - 1);
        });
    }
};

const clearTickout = () => {
    cancelAnimationFrame(timeout);
    timeoutFunction();
    timeoutFunction = undefined;
};

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
    const animType = next.event.type;
    const delay = next.event.delta || 0;
    let nextFrame = () => console.log(animType);

    if (animType === 'new tile') {
        nextFrame = () => {
            const {x, y, type, visible, seen} = next.event.value;
            level[x][y].type = type;
            level[x][y].seen = seen;
            level[x][y].visible = visible;
            drawTile(x, y);
            animate();
        };
    }
    else if (animType === 'change tile visibility') {
        nextFrame = () => {
            const {x, y, visible} = next.event.value;
            level[x][y].visible = visible;
            drawTile(x, y, false);
            animate();
        };
    }
    else if (animType === 'set prop') {
        const {x, y, type} = next.event.value;
        nextFrame = () => {
            level[x][y].prop = type;
            drawTile(x, y);
            animate();
        };
    }
    else if (animType === 'move actor') {
        nextFrame = () => {
            const {x1, y1, x2, y2, type} = next.event.value;
            level[x1][y1].actor = undefined;
            drawTile(x1, y1);
            level[x2][y2].actor = {type};
            drawTile(x2, y2);
            animate();
        };
    }

    if (delay && currMode() === 'animating') {
        setTickout(nextFrame, delay);
    } else {
        nextFrame();
    }
};

/*const animation = {
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
    wait(delay, prev) {
        return animationQueue.add({
            type: 'wait',
        }, delay, prev);
    },
    fireHit(projectile, ox, oy, x, y, targetx, targety, delay, prev) {
        return animationQueue.add({
            type: projectile + 'Hit',
            ox,
            oy,
            x,
            y,
            actor: level[targetx][targety].actor,
        }, delay, prev);
    },
    fireMiss(projectile, ox, oy, x, y, delay, prev) {
        return animationQueue.add({
            type: projectile + 'Miss',
            ox,
            oy,
            x,
            y,
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
};*/

//========================================
//                                  OUTPUT

const output = ({type, value, time}) => {
    if (type === 'done') {
        if (currMode() === 'playing') {
            inputMode.push('animating');
        }
        animate();
    } else {
        animationQueue.add({type, value}, time);
    }
};

//========================================
//                                  AIMING

// reticle coordinates
let reticlex = -1;
let reticley = -1;

const moveReticle = (x, y) => {
    reticlex = x;
    reticley = y;
    clearAll();
    forEachTileOfLevel(width, height, (x, y) => {
        drawTile(x, y, false);
    });
    ray(player.x, player.y, x, y, ({x, y}) => {
        const tile = level[x][y];
        if (!tile.visible) {
            return true;
        }
        drawReticle(x, y);
        if (tile.actor || !Tiles[tile.type].passable) {
            return true;
        }
    }, 1);
    drawReticle(x, y);
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

const key = {
    move11: 'KeyW',
    move1: 'KeyE',
    move9: 'KeyA',
    move3: 'KeyD',
    move7: 'KeyZ',
    move5: 'KeyX',
    rest: 'KeyS',
    interact1: 'Enter',
    interact2: 'Space',
    back: 'Escape',
    fire: 'KeyF',
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
        clearTickout();
    },
    skipping: (code) => {
        // make sure keypress is processed
        keyBuffer.push(code);
    },
    playing: (code) => {
        if (code2direction[code]) {
            input({
                type: 'move',
                value: code2direction[code],
            });
        } else if (code === key.rest) {
            input({
                type: 'rest',
            });
        } else if (code === key.fire) {
            moveReticle(player.x, player.y);
            inputMode.push('aiming');
        } else if (code === key.interact1 || code === key.interact2) {
            input({
                type: 'interact',
            });
        }
    },
    aiming: (code) => {
        if (code2direction[code]) {
            const {dx, dy} = code2direction[code];
            moveReticle(reticlex + dx, reticley + dy);
        } else if (code === key.back) {
            clearAll();
            forEachTileOfLevel(width, height, (x, y) => drawTile(x, y));
            inputMode.pop();
        } else if (code === key.fire) {
            clearAll();
            forEachTileOfLevel(width, height, (x, y) => drawTile(x, y));
            inputMode.pop();
            input({
                type: 'fire',
                value: {
                    x: reticlex,
                    y: reticley,
                },
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
    const seed = Date.now();
    console.log(seed);
    cacheTiles();
    input = createGame({
        width, 
        height,
        seed,
        output,
    });

    window.addEventListener('keydown', keydown, false);
};

tileset.addEventListener('load', startGame);
tileset.src = 'tileset.png';

}
