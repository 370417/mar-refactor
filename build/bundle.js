var babelHelpers = {};

babelHelpers.slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

babelHelpers;

var Tiles = {
  wall: {
    type: "wall",
    color: "white",
    spritex: 3,
    spritey: 4
  },
  floor: {
    type: "floor",
    color: "white",
    spritex: 1,
    spritey: 4
  }
};

var createTile = (function (name) {
  return Object.create(Tiles[name]);
})

var level = void 0;

// create a 2d array with dimensions width by height and filled with content
var create2dArray = function create2dArray(width, height, content) {
    var isFunction = typeof content === "function";
    var array = [];
    for (var x = 0; x < width; x++) {
        array[x] = [];
        for (var y = 0; y < height; y++) {
            array[x][y] = isFunction ? content() : content;
        }
    }
    return array;
};

// get the 2d coordinates like array[x][y] corresponding to a 1d index
var getCoord = function getCoord(index, width, height) {
    var y = index % height;
    var x = (index - y) / height;
    return [x, y];
};

// return a random number in the range [lower, upper]
var randInt = function randInt(lower, upper) {
    var prng = arguments.length <= 2 || arguments[2] === undefined ? Math.random : arguments[2];

    if (lower > upper) {
        console.error("lower > upper");
        return NaN;
    }
    return lower + Math.floor((upper - lower + 1) * prng());
};

// create a shuffled range of ints in [0, size)
var randRange = function randRange(size) {
    var prng = arguments.length <= 1 || arguments[1] === undefined ? Math.random : arguments[1];

    var array = [];
    for (var i = 0; i < size; i++) {
        var j = randInt(0, i, prng);
        if (j !== i) {
            array[i] = array[j];
        }
        array[j] = i;
    }
    return array;
};

// whether point (x, y) is on the edge of the level
var onEdge = function onEdge(x, y, width, height) {
    return x === 0 || y === 0 || x === width - 1 || y === height - 1;
};

// [xDir8[n], yDir8[n]] corresponds to one of the 8 directions in clock order
var xDir8 = [0, 1, 1, 1, 0, -1, -1, -1];
var yDir8 = [1, 1, 0, -1, -1, -1, 0, 1];

// [xDir4[n], yDir4[n]] corresponds to one of the 4 cardinal directions in clock order
var xDir4 = [0, 1, 0, -1];
var yDir4 = [1, 0, -1, 0];

// whether point (x, y) is surrounded by type
var surrounded = function surrounded(x, y, type) {
    var xDir = arguments.length <= 3 || arguments[3] === undefined ? xDir8 : arguments[3];
    var yDir = arguments.length <= 4 || arguments[4] === undefined ? yDir8 : arguments[4];

    for (var i = 0; i < xDir.length; i++) {
        if (level[x + xDir[i]][y + yDir[i]] !== type) {
            return false;
        }
    }
    return true;
};

// count the number of contiguous groups of walls around a tile
var countGroups = function countGroups(x, y) {
    var groups = 0;
    // prev is the last tile that will be visited
    var prev = level[x + xDir8[7]][y + yDir8[7]];
    // loop through neighbors in order
    for (var i = 0; i < 8; i++) {
        var curr = level[x + xDir8[i]][y + yDir8[i]];
        // count transitions from floor to wall
        if (prev !== "wall" && curr === "wall") {
            groups++;
        }
        prev = curr;
    }
    // if there are no transitions, check if all neighbors are walls
    return !groups && prev === "wall" ? 1 : groups;
};

// generate floor in the level to create caves
var generateFloor = function generateFloor(width, height) {
    var prng = arguments.length <= 2 || arguments[2] === undefined ? Math.random : arguments[2];

    // loop through the level randomly
    randRange(width * height, prng).forEach(function (index) {
        var _getCoord = getCoord(index, width, height);

        var _getCoord2 = babelHelpers.slicedToArray(_getCoord, 2);

        var x = _getCoord2[0];
        var y = _getCoord2[1];

        if (!onEdge(x, y, width, height)) {
            if (surrounded(x, y, "wall") || countGroups(x, y) !== 1) {
                level[x][y] = "floor";
            }
        }
    });
};

// remove walls that are surrounded by floor in 4 directions
var removeIsolatedWalls = function removeIsolatedWalls(width, height) {
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            if (!onEdge(x, y, width, height) && level[x][y] === "wall" && surrounded(x, y, "floor", xDir4, yDir4)) {
                level[x][y] = "floor";
            }
        }
    }
};

var convert2Tiles = function convert2Tiles(width, height) {
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            level[x][y] = createTile(level[x][y]);
        }
    }
};

var createLevel = function createLevel(_ref) {
    var width = _ref.width;
    var height = _ref.height;
    var _ref$prng = _ref.prng;
    var prng = _ref$prng === undefined ? Math.random : _ref$prng;

    // create a 2d array to represent the level
    level = create2dArray(width, height, "wall");

    generateFloor(width, height, prng);
    removeIsolatedWalls(width, height);
    convert2Tiles(width, height);

    return level;
};

var populateLevel = function populateLevel(player) {
    level[1][1].actor = player;

    return level;
};

var game$2 = 2;
console.log(2);

console.log(game$2);

var playerAct = function playerAct() {
    this.display();
};

var actors = {
    player: {
        color: "white",
        spritex: 6,
        spritey: 4,
        act: playerAct
    }
};

var createActor = (function (name, display, cacheTile) {
    var actor = Object.create(actors[name]);
    actor.display = display;
    cacheTile(actor);
    return actor;
})

var createSchedule = (function (_) {
    return {
        add: function add(actor) {
            var delta = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

            var prev = this;
            var next = this.next;
            while (next && next.delta <= delta) {
                delta -= next.delta;
                prev = next;
                next = next.next;
            }
            if (next) {
                next.delta -= delta;
            }
            prev.next = { actor: actor, delta: delta, next: next };
            return this;
        },
        advance: function advance() {
            if (!this.next) {
                return undefined;
            }
            var actor = this.next.actor;
            this.next = this.next.next;
            return actor;
        }
    };
})

var game$1 = void 0;

var drawLevel = function drawLevel(_) {
    game$1.display.draw(game$1.currentLevel);
};

var startGame = function startGame(_ref) {
    var seed = _ref.seed;
    var width = _ref.width;
    var height = _ref.height;

    game$1.player = createActor("player", drawLevel, game$1.display.cacheTile.bind(game$1.display));

    game$1.schedule = createSchedule();
    game$1.schedule.add(game$1.player);

    game$1.currentLevel = createLevel({ width: width, height: height });
    game$1.display.cacheLevel(game$1.currentLevel);

    populateLevel(game$1.player);

    game$1.player.act();
};

var createGame = (function (_ref2) {
    var _ref2$seed = _ref2.seed;
    var seed = _ref2$seed === undefined ? 0 : _ref2$seed;
    var display = _ref2.display;
    var _ref2$width = _ref2.width;
    var width = _ref2$width === undefined ? 40 : _ref2$width;
    var _ref2$height = _ref2.height;
    var height = _ref2$height === undefined ? 30 : _ref2$height;

    game$1 = {
        seed: seed,
        display: display,
        width: width,
        height: height
    };

    display.setDimensions(width, height, 8, 2);
    display.load("tileset.png", startGame.bind(null, { seed: seed, width: width, height: height }));
})

var colors = {
	white: "#FFF"
};

var prototype = {
	// set the dimensions of the dislpay
	// unit is the size in pixels of a tile
	// scale scales everything up

	setDimensions: function setDimensions(width, height, unit, scale) {
		this.width = width;
		this.height = height;
		this.unit = unit;
		this.scale = scale;
		this.canvas.width = width * unit;
		this.canvas.height = height * unit;
		this.canvas.style.width = width * unit * scale + "px";
		this.canvas.style.height = height * unit * scale + "px";
	},

	// load the spritesheet then call callback
	load: function load(path, callback) {
		this.tileset = document.createElement("img");
		this.tileset.addEventListener("load", callback);
		this.tileset.src = path;
	},

	// log text to the message buffer
	log: function log(text) {
		this.messages.innerHTML += text;
	},

	// draw a level
	draw: function draw(level) {
		var u = this.unit;
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				//let tile = this.cacheTile(level[x][y]);
				var tile = level[x][y];
				if (tile.actor) {
					this.ctx.drawImage(tile.actor.canvas, 0, 0, u, u, x * u, y * u, u, u);
				} else {
					this.ctx.drawImage(tile.canvas, 0, 0, u, u, x * u, y * u, u, u);
				}
			}
		}
	},
	cacheTile: function cacheTile(tile) {
		var u = this.unit;
		var canvas = document.createElement("canvas");
		canvas.width = u;
		canvas.height = u;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(this.tileset, tile.spritex * u, tile.spritey * u, u, u, 0, 0, u, u);
		ctx.fillStyle = colors[tile.color];
		ctx.globalCompositeOperation = "source-in";
		ctx.fillRect(0, 0, u, u);
		tile.canvas = canvas;
		return tile;
	},
	cacheLevel: function cacheLevel(level) {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				this.cacheTile(level[x][y]);
			}
		}
	}
};

var createDisplay = (function (_ref) {
	var root = _ref.root;

	var display = Object.create(prototype);

	// setup messages
	display.messages = document.createElement("div");
	display.messages.setAttribute("id", "messages");
	root.appendChild(display.messages);

	// setup canvas
	display.canvas = document.createElement("canvas");
	root.appendChild(display.canvas);
	display.ctx = display.canvas.getContext("2d");

	display.log("Loading... ");

	return display;
})

var display = createDisplay({
    root: document.getElementById("game")
});

var game = createGame({
    display: display
});