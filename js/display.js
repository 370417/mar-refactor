import createGame from './game';
import {forEachTileOfLevel, createLevel} from './level';
import * as tiles from './tiles';

const WIDTH = 48;
const HEIGHT = 31;

const XU = 18;
const TILEHEIGHT = 24;
const YU = 16;

const $game = document.getElementById('game');
$game.style.width = (WIDTH - HEIGHT / 2 + 1)* XU + 'px';
$game.style.height = TILEHEIGHT + (HEIGHT - 1) * YU + 'px';

const canvases = [];
const bgcanvases = [];
const ctxs = [];
const bgctxs = [];
for (let i = 0; i < HEIGHT; i++) {
	const canvas = document.createElement('canvas');
	canvas.width = (WIDTH - HEIGHT / 2 + 1)* XU;
	canvas.height = TILEHEIGHT;
	canvas.style.top = i * YU + 'px';
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

const level = [];
for (let x = 0; x < WIDTH; x++) {
	level[x] = [];
	for (let y = 0; y < HEIGHT; y++) {
		level[x][y] = {};
	}
}

const forEachTile = forEachTileOfLevel.bind(null, WIDTH, HEIGHT);

const draw = () => {
	forEachTile((x, y) => {
		const ctx = ctxs[y];
		const realx = (x - (HEIGHT - y - 1) / 2) * XU;
		if (level[x][y].type === tiles.WALL) {
			ctx.fillStyle = '#FFF';
			ctx.fillRect(realx, TILEHEIGHT - YU, XU - 1, YU - 1);
		}
	});
};

const updateTile = (x, y, attributes) => {
	for (const key in attributes) {
		level[x][y][key] = attributes[key];
	}
};

// Remove this later ;  display should decide to draw when the player actor is updated
const updateDraw = () => {
	draw();
};
