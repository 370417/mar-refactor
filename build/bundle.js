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
    spritex: 0,
    spritey: 0
  },
  floor: {
    type: "floor",
    color: "white",
    spritex: 1,
    spritey: 0
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

// whether point (x, y) is in the level
var inBounds = function inBounds(x, y, width, height) {
    return x >= 0 && y >= 0 && x < width && y < height;
};

var inInnerBounds = function inInnerBounds(x, y, width, height) {
    return x > (height - y) / 2 && x < width - 1 - y / 2 && y > 0 && y < height - 1;
};

var xDir = [0, 1, 1, 0, -1, -1];
var yDir = [1, 0, -1, -1, 0, 1];

var floodFill = function floodFill(x, y, width, height, type, callback) {
    if (!inBounds(x, y, width, height) || level[x][y] !== type) {
        return;
    }
    callback(x, y);
    for (var i = 0; i < 6; i++) {
        floodFill(x + xDir[i], y + yDir[i], width, height, type, callback);
    }
};

// whether point (x, y) is surrounded by type
var surrounded = function surrounded(x, y, type) {
    for (var i = 0; i < 6; i++) {
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
    var prev = level[x + xDir[5]][y + yDir[5]];
    // loop through neighbors in order
    for (var i = 0; i < 6; i++) {
        var curr = level[x + xDir[i]][y + yDir[i]];
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

        if (inInnerBounds(x, y, width, height)) {
            if (surrounded(x, y, "wall") || countGroups(x, y) !== 1) {
                level[x][y] = "floor";
            }
        }
    });
};

// remove all but the largest group of floor
var removeIsolatedFloor = function removeIsolatedFloor(width, height) {
    var maxSize = 0;
    for (var x = 1; x < width - 1; x++) {
        var _loop = function _loop(y) {
            var tempTile = { size: 0 };
            floodFill(x, y, width, height, "floor", function (x, y) {
                level[x][y] = tempTile;
                tempTile.size++;
            });
            if (tempTile.size > maxSize) {
                maxSize = tempTile.size;
            }
        };

        for (var y = 1; y < height - 1; y++) {
            _loop(y);
        }
    }for (var _x4 = 1; _x4 < width - 1; _x4++) {
        for (var _y = 1; _y < height - 1; _y++) {
            if (level[_x4][_y].size) {
                level[_x4][_y] = level[_x4][_y].size === maxSize ? "floor" : "wall";
            }
        }
    }
};

// remove groups of 5 or less walls
var removeIsolatedWalls = function removeIsolatedWalls(width, height) {
    for (var x = 2; x < width - 2; x++) {
        var _loop2 = function _loop2(y) {
            var tempTile = { size: 0 };
            floodFill(x, y, width, height, "wall", function (x, y) {
                level[x][y] = tempTile;
                tempTile.size++;
            });
        };

        for (var y = 2; y < height - 2; y++) {
            _loop2(y);
        }
    }for (var _x5 = 0; _x5 < width; _x5++) {
        for (var _y2 = 0; _y2 < height; _y2++) {
            if (level[_x5][_y2].size) {
                level[_x5][_y2] = level[_x5][_y2].size > 5 ? "wall" : "floor";
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
    removeIsolatedFloor(width, height);
    removeIsolatedWalls(width, height);
    convert2Tiles(width, height);

    return level;
};

var populateLevel = function populateLevel(player) {
    level[1][1].actor = player;

    return level;
};

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
    var width = _ref2$width === undefined ? 60 : _ref2$width;
    var _ref2$height = _ref2.height;
    var height = _ref2$height === undefined ? 30 : _ref2$height;

    game$1 = {
        seed: seed,
        display: display,
        width: width,
        height: height
    };

    display.setDimensions(width, height, 16, 18, 1);
    display.load("tileset.png", startGame.bind(null, { seed: seed, width: width, height: height }));
})

var colors = {
	white: "#FFF"
};

var prototype = {
	// set the dimensions of the dislpay
	// unit is the size in pixels of a tile
	// scale scales everything up

	setDimensions: function setDimensions(width, height, xunit, yunit, scale) {
		this.width = width;
		this.height = height;
		this.xunit = xunit;
		this.yunit = yunit;
		this.scale = scale;
		this.canvas.width = (width - height / 2) * xunit;
		this.canvas.height = height * yunit;
		this.canvas.style.width = (width - height / 2) * xunit * scale + "px";
		this.canvas.style.height = height * yunit * scale + "px";
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
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		var xu = this.xunit;
		var yu = this.yunit;
		for (var y = 0; y < this.height; y++) {
			for (var x = Math.floor((this.height - y) / 2); x < this.width - Math.floor(y / 2); x++) {
				var tile = level[x][y];
				if (tile.actor) {
					this.ctx.drawImage(tile.actor.canvas, 0, 0, xu, yu, x * xu, y * yu, xu, yu);
				} else {
					this.ctx.drawImage(tile.canvas, 0, 0, xu, yu, (x - (this.height - y) / 2) * xu, y * yu, xu, yu);
				}
			}
		}
	},
	cacheTile: function cacheTile(tile) {
		var xu = this.xunit;
		var yu = this.yunit;
		var canvas = document.createElement("canvas");
		canvas.width = xu;
		canvas.height = yu;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(this.tileset, tile.spritex * xu, tile.spritey * yu, xu, yu, 0, 0, xu, yu);
		ctx.fillStyle = colors[tile.color];
		ctx.globalCompositeOperation = "source-in";
		ctx.fillRect(0, 0, xu, yu);
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