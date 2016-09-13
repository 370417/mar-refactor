Math.random = undefined;

// generate a random integer in the interval [min, max]
var randInt = function randInt(min, max, prng) {
    if (min > max) {
        console.error('randInt: min > max');
        return NaN;
    }
    return min + Math.floor((max - min + 1) * prng());
};

var WALL = 0;
var FLOOR = 1;



var directions = Object.freeze({
    DIR1: DIR1,
    DIR3: DIR3,
    DIR5: DIR5,
    DIR7: DIR7,
    DIR9: DIR9,
    DIR11: DIR11
});

// prevent using Math.random instead of prng accidentally
Math.random = undefined;

var forEachTileOfLevel = function forEachTileOfLevel(width, height, fun) {
    for (var y = 0; y < height; y++) {
        for (var x = Math.floor((height - y) / 2); x < width - Math.floor(y / 2); x++) {
            fun(x, y);
        }
    }
};

var forEachInnerTileOfLevel = function forEachInnerTileOfLevel(width, height, fun) {
    for (var y = 1; y < height - 1; y++) {
        for (var x = Math.floor((height - y) / 2) + 1; x < width - Math.floor(y / 2) - 1; x++) {
            fun(x, y);
        }
    }
};

var createLevel = function createLevel(_ref) {
    var width = _ref.width;
    var height = _ref.height;
    var prng = _ref.prng;
    var _ref$startx = _ref.startx;
    var startx = _ref$startx === undefined ? 24 : _ref$startx;
    var _ref$starty = _ref.starty;
    var starty = _ref$starty === undefined ? 15 : _ref$starty;

    var level = [];

    for (var x = 0; x < width; x++) {
        level[x] = [];
        for (var y = 0; y < height; y++) {
            level[x][y] = {
                type: WALL
            };
        }
    }

    var forEachTile = forEachTileOfLevel.bind(null, width, height);
    var forEachInnerTile = forEachInnerTileOfLevel.bind(null, width, height);
    var surrounded = surrounded.bind(null, level);

    // floor at starting point
    level[startx][starty].type = FLOOR;

    // main algorithm
    {
        (function () {
            var scrambledTiles = [];
            forEachInnerTile(function (x, y) {
                scrambledTiles.splice(randInt(0, scrambledTiles.length), 0, { x: x, y: y });
            });

            for (var i = 0; i < scrambledTiles.length; i++) {
                var _scrambledTiles$i = scrambledTiles[i];
                var _x = _scrambledTiles$i.x;
                var _y = _scrambledTiles$i.y;

                if (surrounded(_x, _y, function (tile) {
                    return tile.type === WALL;
                }) || false) {}
            }
        })();
    }

    return level;
};

// prevent using Math.random instead of prng accidentally
Math.random = undefined;

var createGame = (function (_ref) {
    var width = _ref.width;
    var height = _ref.height;
    var prng = _ref.prng;
    var updateTile = _ref.updateTile;
    var updateDraw = _ref.updateDraw;

    var game = {};

    var forEachTile = forEachTileOfLevel.bind(null, width, height);

    var level = createLevel({
        width: width,
        height: height,
        prng: prng
    });

    forEachTile(function (x, y) {
        updateTile(x, y, {
            type: level[x][y].type
        });
    });

    updateDraw();
})

var WIDTH = 48;
var HEIGHT = 31;

var XU = 18;
var TILEHEIGHT = 24;
var YU = 16;

var $game = document.getElementById('game');
$game.style.width = (WIDTH - HEIGHT / 2 + 1) * XU + 'px';
$game.style.height = TILEHEIGHT + (HEIGHT - 1) * YU + 'px';

var canvases = [];
var bgcanvases = [];
var ctxs = [];
var bgctxs = [];
for (var i = 0; i < HEIGHT; i++) {
	var canvas = document.createElement('canvas');
	canvas.width = (WIDTH - HEIGHT / 2 + 1) * XU;
	canvas.height = TILEHEIGHT;
	canvas.style.top = i * YU + 'px';
	var ctx = canvas.getContext('2d');
	canvases[i] = canvas;
	ctxs[i] = ctx;

	var bgcanvas = document.createElement('canvas');
	bgcanvas.width = canvas.width;
	bgcanvas.height = canvas.height;
	bgcanvas.style.top = canvas.style.top;
	var bgctx = bgcanvas.getContext('2d');
	bgcanvases[i] = bgcanvas;
	bgctxs[i] = bgctx;

	$game.appendChild(bgcanvas);
	$game.appendChild(canvas);
}

var level = [];
for (var x = 0; x < WIDTH; x++) {
	level[x] = [];
	for (var y = 0; y < HEIGHT; y++) {
		level[x][y] = {};
	}
}

var forEachTile = forEachTileOfLevel.bind(null, WIDTH, HEIGHT);

var draw = function draw() {
	forEachTile(function (x, y) {
		var ctx = ctxs[y];
		var realx = (x - (HEIGHT - y - 1) / 2) * XU;
		if (level[x][y].type === WALL) {
			ctx.fillStyle = '#FFF';
			ctx.fillRect(realx, TILEHEIGHT - YU, XU - 1, YU - 1);
		}
	});
};

var updateTile = function updateTile(x, y, attributes) {
	for (var key in attributes) {
		level[x][y][key] = attributes[key];
	}
};

// Remove this later ;  displa should decide to draw when the player actor is updated
var updateDraw = function updateDraw() {
	draw();
};

var game = createGame({
	width: WIDTH,
	height: HEIGHT,
	prng: Math.random,
	updateTile: updateTile,
	updateDraw: updateDraw
});