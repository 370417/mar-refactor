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

var createLevel = (function (_ref) {
    var width = _ref.width;
    var height = _ref.height;
    var _ref$prng = _ref.prng;
    var prng = _ref$prng === undefined ? Math.random : _ref$prng;

    // create a 2d array to represent the level
    var level = create2dArray(width, height, createTile.bind(null, "wall"));

    return level;
})

var createGame = (function (_ref) {
	var _ref$seed = _ref.seed;
	var seed = _ref$seed === undefined ? 0 : _ref$seed;
	var display = _ref.display;
	var _ref$width = _ref.width;
	var width = _ref$width === undefined ? 40 : _ref$width;
	var _ref$height = _ref.height;
	var height = _ref$height === undefined ? 30 : _ref$height;

	display.setDimensions(width, height, 8, 2);
	var level = createLevel({
		width: width,
		height: height
	});

	display.load("tileset.png", display.draw.bind(display, level));
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
		document.body.appendChild(this.tileset);
	},

	// log text to the message buffer
	log: function log(text) {
		this.messages.innerHTML += text;
	},

	// draw a level
	draw: function draw(level) {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				var tile = this.cacheTile(level[x][y]);
				this.ctx.drawImage(tile.canvas, 0, 0, this.unit, this.unit, x * this.unit, y * this.unit, this.unit, this.unit);
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