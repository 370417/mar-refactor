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


var __commonjs_global = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : this;
function __commonjs(fn, module) { return module = { exports: {} }, fn(module, module.exports, __commonjs_global), module.exports; }

var arr2hsl = function arr2hsl(_ref3) {
    var _ref4 = babelHelpers.slicedToArray(_ref3, 3);

    var h = _ref4[0];
    var s = _ref4[1];
    var l = _ref4[2];
    return "hsl(" + h + "," + s + "%," + l + "%)";
};

var wallColor = arr2hsl([40, 10, 75]);

var grassColor = 'hsl(120, 50%, 50%)';

var Tiles = {
    wall: {
        type: "wall",
        passable: false,
        permeable: false,
        transparent: false,
        spritex: 0,
        spritey: 0,
        color: wallColor
    },
    floor: {
        type: "floor",
        passable: true,
        permeable: true,
        transparent: true,
        spritex: 1,
        spritey: 0,
        color: "#FFF"
    },
    grass: {
        type: "grass",
        passable: true,
        permeable: true,
        transparent: true,
        spritex: 2,
        spritey: 0,
        color: grassColor
    },
    tallGrass: {
        type: "grass",
        passable: true,
        permeable: true,
        transparent: false,
        spritex: 3,
        spritey: 0,
        color: grassColor
    },
    deepWater: {
        type: 'deepWater',
        passable: true,
        permeable: true,
        transparent: true,
        spritex: 10,
        spritey: 4,
        color: '#008'
    },
    water: {
        type: 'water',
        passable: true,
        permeable: true,
        transparent: true,
        spritex: 10,
        spritey: 4,
        color: '#88F'
    },
    pillar: {
        type: 'pillar',
        passable: false,
        permeable: false,
        transparent: false,
        spritex: 5,
        spritey: 0,
        color: wallColor
    },
    crackedPillar: {
        type: 'crackedPillar',
        passable: false,
        permeable: true,
        transparent: false,
        spritex: 6,
        spritey: 0,
        color: wallColor
    },
    brokenPillar: {
        type: 'brokenPillar',
        passable: false,
        permeable: true,
        transparent: true,
        spritex: 7,
        spritey: 0,
        color: wallColor
    }
};

var createTile = (function (name) {
    var tile = Object.create(Tiles[name]);
    tile.location = {};
    return tile;
})

var cubeDistance = function cubeDistance(x1, y1, z1, x2, y2, z2) {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
};

var cubeRound = function cubeRound(_ref) {
    var x = _ref.x;
    var y = _ref.y;
    var z = _ref.z;

    var _map = [x, y, z].map(Math.round);

    var _map2 = babelHelpers.slicedToArray(_map, 3);

    var rx = _map2[0];
    var ry = _map2[1];
    var rz = _map2[2];

    var _map3 = [rx - x, ry - y, rz - z].map(Math.abs);

    var _map4 = babelHelpers.slicedToArray(_map3, 3);

    var dx = _map4[0];
    var dy = _map4[1];
    var dz = _map4[2];


    if (dx > dy && dx > dz) {
        rx = -ry - rz;
    } else if (dy > dz) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }
    return { x: rx, y: ry, z: rz };
};

var line = function line(x1, y1, x2, y2, callback) {
    var skip = arguments.length <= 5 || arguments[5] === undefined ? 0 : arguments[5];

    var z1 = -x1 - y1;
    var z2 = -x2 - y2;
    var dist = cubeDistance(x1, y1, z1, x2, y2, z2);
    var x = x1;
    var y = y1;
    var z = z1;

    var _map5 = [x2 - x1, y2 - y1, z2 - z1].map(function (n) {
        return n / dist;
    });

    var _map6 = babelHelpers.slicedToArray(_map5, 3);

    var dx = _map6[0];
    var dy = _map6[1];
    var dz = _map6[2];

    for (var i = 0; i <= dist; i++) {
        if (i >= skip && callback(cubeRound({ x: x, y: y, z: z }))) {
            break;
        }
        x += dx;
        y += dy;
        z += dz;
    }
};

// displacement vector for moving tangent to a circle counterclockwise in a certain sector
var tangent = [[0, -1], //  \
[-1, 0], //  -
[-1, 1], //  /
[0, 1], //  \
[1, 0], //  -
[1, -1], //  /
[0, -1]];

// displacement vector for moving normal to a circle outward in a certain sector
//  \
var normal = [[1, 0], // -
[1, -1], // /
[0, -1], // \
[-1, 0], // -
[-1, 1], // /
[0, 1], // \
[1, 0]];

// round a number, but round down if it ends in .5
// -
var roundTieDown = function roundTieDown(n) {
    return Math.ceil(n - 0.5);
};

var fov = function fov(ox, oy, transparent, reveal) {
    var range = arguments.length <= 4 || arguments[4] === undefined ? 9e9 : arguments[4];

    reveal(ox, oy);

    var revealWall = function revealWall(x, y) {
        if (!transparent(x, y)) {
            reveal(x, y);
        }
    };

    for (var i = 0; i < 6; i++) {
        revealWall(ox + normal[i][0], oy + normal[i][1]);
    }

    var polar2rect = function polar2rect(radius, angle) {
        var sector = Math.floor(angle);
        var arc = roundTieDown((angle - sector) * (radius - 0.5));
        return [ox + radius * normal[sector][0] + arc * tangent[sector][0], oy + radius * normal[sector][1] + arc * tangent[sector][1], radius * sector + arc];
    };

    // angles are measured from 0 to 6
    // radius - radius of arc
    // start & end - angles for start and end of arc
    var scan = function scan(radius, start, end) {
        if (radius > range) {
            return;
        }
        var someRevealed = false;

        var _polar2rect = polar2rect(radius, start);

        var _polar2rect2 = babelHelpers.slicedToArray(_polar2rect, 3);

        var x = _polar2rect2[0];
        var y = _polar2rect2[1];
        var arc = _polar2rect2[2];

        var current = start;
        while (current < end) {
            if (transparent(x, y)) {
                current = arc / radius;
                if (current >= start && current <= end) {
                    reveal(x, y);
                    someRevealed = true;
                    if (radius < range) {
                        if (current >= 0 && current <= 2) {
                            revealWall(x + 1, y - 1);
                        }
                        if (current >= 1 && current <= 3) {
                            revealWall(x, y - 1);
                        }
                        if (current >= 2 && current <= 4) {
                            revealWall(x - 1, y);
                        }
                        if (current >= 3 && current <= 5) {
                            revealWall(x - 1, y + 1);
                        }
                        if (current >= 4 && current <= 6) {
                            revealWall(x, y + 1);
                        }
                        if (current <= 1 || current >= 5) {
                            revealWall(x + 1, y);
                        }
                    }
                }
            } else {
                current = (arc + 0.5) / radius;
                if (someRevealed) {
                    scan(radius + 1, start, (arc - 0.5) / radius);
                }
                start = current;
            }
            // increment everything
            var displacement = tangent[Math.floor(arc / radius)];
            x += displacement[0];
            y += displacement[1];
            arc++;
        }
        if (someRevealed) {
            scan(radius + 1, start, end);
        }
    };
    scan(1, 0, 6);
};

var heap = __commonjs(function (module, exports, global) {
// Generated by CoffeeScript 1.8.0
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;


  /*
  Default comparison function to be used
   */

  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };


  /*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (lo < hi) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };


  /*
  Push item onto heap, maintaining the heap invariant.
   */

  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };


  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };


  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };


  /*
  Fast version of a heappush followed by a heappop.
   */

  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };


  /*
  Transform list into a heap, in-place, in O(array.length) time.
   */

  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };


  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };


  /*
  Find the n largest elements in a dataset.
   */

  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };


  /*
  Find the n smallest elements in a dataset.
   */

  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define([], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory();
    } else {
      return root.Heap = factory();
    }
  })(this, function() {
    return Heap;
  });

}).call(__commonjs_global);
});

var require$$0 = (heap && typeof heap === 'object' && 'default' in heap ? heap['default'] : heap);

var index = __commonjs(function (module) {
module.exports = require$$0;
});

var Heap = (index && typeof index === 'object' && 'default' in index ? index['default'] : index);

// graph - an array of nodes
// end(node) - returns true if node is an end node
// neighbor(node) - returns an array of neighbors of a node
// cost(node1, node2) - returns the cost to move from node1 to node2
var dijkstraMap = function dijkstraMap(_ref) {
    var graph = _ref.graph;
    var end = _ref.end;
    var neighbor = _ref.neighbor;
    var cost = _ref.cost;
    var verbose = _ref.verbose;

    var unvisited = new Heap(function (a, b) {
        return a.cost - b.cost;
    });
    var visited = [];

    for (var i = 0; i < graph.length; i++) {
        var node = graph[i];
        node.cost = end(node) ? 0 : Infinity;
        unvisited.push(node);
    }

    var _loop = function _loop() {
        var node = unvisited.pop();
        node.visited = true;
        visited.push(node);
        if (node.cost === Infinity) {
            return "continue";
        }
        neighbor(node).forEach(function (neighbor) {
            var altCost = node.cost + cost(node, neighbor);
            if (!neighbor.visited && altCost < neighbor.cost) {
                neighbor.cost = altCost;
                unvisited.updateItem(neighbor);
            }
        });
    };

    while (unvisited.peek()) {
        var _ret = _loop();

        if (_ret === "continue") continue;
    }

    return visited;
};

/*const angle = (x1, y1, x2 = 1, y2 = 0) => {
    let l1 = Math.sqrt(x1 * x1 + y1 * y1);
    let l2 = Math.sqrt(x2 * x2 + y2 * y2);
    return Math.acos((x1 * x2 + y1 * y2) / (l1 * l2));
}*/

var xDir$2 = [0, 1, 1, 0, -1, -1];
var yDir$2 = [1, 0, -1, -1, 0, 1];

var forEachNeighbor = function forEachNeighbor(x, y, func) {
    for (var i = 0; i < 6; i++) {
        func({
            dx: xDir$2[i],
            dy: yDir$2[i],
            x: x + xDir$2[i],
            y: y + yDir$2[i],
            tile: game.level[x + xDir$2[i]][y + yDir$2[i]]
        });
    }
};

var empty$1 = function empty(x, y) {
    return game.level[x][y].passable && !game.level[x][y].actor;
};

// return a random number in the range [lower, upper]
var randInt$1 = function randInt(lower, upper) {
    var prng = arguments.length <= 2 || arguments[2] === undefined ? Math.random : arguments[2];

    if (lower > upper) {
        console.error("lower > upper");
        return NaN;
    }
    return lower + Math.floor((upper - lower + 1) * prng());
};

var randomElement = function randomElement(array) {
    var prng = arguments.length <= 1 || arguments[1] === undefined ? Math.random : arguments[1];
    return array[randInt$1(0, array.length - 1, prng)];
};

var playerAct = function playerAct() {
    this.see();
    game.display.draw(game.level);
};

var see = function see() {
    var reveal = function reveal(x, y) {
        game.level[x][y].visible = true;
        game.level[x][y].seen = true;
    };

    for (var x = 0; x < game.width; x++) {
        for (var y = 0; y < game.height; y++) {
            game.level[x][y].visible = false;
        }
    }fov(this.x, this.y, function (x, y) {
        return game.level[x][y].transparent;
    }, reveal);
};

var move = function move(_ref) {
    var _ref2 = babelHelpers.slicedToArray(_ref, 2);

    var dx = _ref2[0];
    var dy = _ref2[1];

    var x = this.x + dx;
    var y = this.y + dy;
    if (game.level[x][y].passable) {
        this.lastMove = { dx: dx, dy: dy };

        game.level[this.x][this.y].actor = undefined;
        this.x = x;
        this.y = y;
        game.level[this.x][this.y].actor = this;

        if (this === game.player) {
            this.see();
        }

        game.schedule.add(this, this.delay);
        game.schedule.advance().act();
    }
};

var act = function act() {
    return this[this.state]();
};

var tunnelWandering = function tunnelWandering() {
    var _this = this;

    var allMoves = [];
    forEachNeighbor(this.x, this.y, function (_ref3) {
        var dx = _ref3.dx;
        var dy = _ref3.dy;
        var x = _ref3.x;
        var y = _ref3.y;
        var tile = _ref3.tile;

        if (empty$1(x, y) && !(dx === -_this.lastMove.dx && dy === -_this.lastMove.dy)) {
            allMoves.push({ dx: dx, dy: dy });
        }
    });

    if (allMoves.length) {
        var _randomElement = randomElement(allMoves);

        var dx = _randomElement.dx;
        var dy = _randomElement.dy;

        return this.move([dx, dy]);
    } else {
        return this.move([0, 0]);
    }
};

var snakeWandering = function snakeWandering() {
    var allMoves = [];
    forEachNeighbor(this.x, this.y, function (_ref4) {
        var dx = _ref4.dx;
        var dy = _ref4.dy;
        var x = _ref4.x;
        var y = _ref4.y;
        var tile = _ref4.tile;

        if (empty$1(x, y) && tile.location.cave) {
            allMoves.push({ dx: dx, dy: dy });
            if (tile.type === 'grass') {
                allMoves.push({ dx: dx, dy: dy });
            }
        }
    });

    if (allMoves.length) {
        var _randomElement2 = randomElement(allMoves);

        var dx = _randomElement2.dx;
        var dy = _randomElement2.dy;

        return this.move([dx, dy]);
    } else {
        return this.move([0, 0]);
    }
};

var wandering = function wandering() {
    var _this2 = this;

    if (!this.goalTile) {
        var x = this.x;
        var y = this.y;

        var tiles = game.level[x][y].location.cave.tiles;
        this.goalTile = tiles[randInt$1(0, tiles.length - 1)];
    }
    var goalx = this.goalTile.x;
    var goaly = this.goalTile.y;
    if (this.x === goalx && this.y === goaly) {
        this.state = 'resting';
        return this.move([0, 0]);
    }
    var dx = void 0,
        dy = void 0;
    line(this.x, this.y, goalx, goaly, function (_ref5) {
        var x = _ref5.x;
        var y = _ref5.y;

        dx = x - _this2.x;
        dy = y - _this2.y;
        return true;
    }, 1);
    if (empty$1(this.x + dx, this.y + dy) && game.level[this.x + dx][this.y + dy].location.cave) {
        return this.move([dx, dy]);
    } else {
        this.state = 'resting';
        return this.move([0, 0]);
    }
};

var resting = function resting() {
    if (Math.random() < 1 / 3) {
        var x = this.x;
        var y = this.y;

        var tiles = game.level[x][y].location.cave.tiles;
        this.goalTile = tiles[randInt$1(0, tiles.length - 1)];
        this.state = 'wandering';
        return this.act();
    } else {
        return this.move([0, 0]);
    }
};

var gasMove = function gasMove(_ref6) {
    var dx = _ref6.dx;
    var dy = _ref6.dy;

    var x = this.x + dx;
    var y = this.y + dy;
    // count now many times this gas particle is in a tile too sparse to be gassy.
    // after 10 or so instances, delete this gas particle
    game.level[this.x][this.y][this.name]--;
    this.x = x;
    this.y = y;
    if (game.level[this.x][this.y][this.name]) {
        game.level[this.x][this.y][this.name]++;
    } else {
        game.level[this.x][this.y][this.name] = 1;
    }

    game.schedule.add(this, this.delay);
    game.schedule.advance().act();
};

/*const gasMotion = function() {
    const allMoves = [{dx: 0, dy: 0}];
    forEachNeighbor(this.x, this.y, ({x, y, dx, dy}) => {
        if (game.level[x][y].permeable) {
            allMoves.push({dx, dy});
        }
    });

    if (allMoves.length) {
        const {dx, dy} = randomElement(allMoves);
        return this.move({dx, dy});
    }
};*/

var skunkGasMotion = function skunkGasMotion() {
    this.delay += 10 + 11 * Math.floor(Math.random());
    var dx = void 0,
        dy = void 0;
    if (Math.random() < Math.pow(this.age / this.directions.length, 2)) {
        var rand = randInt$1(0, 5);
        dx = xDir$2[rand];
        dy = yDir$2[rand];
    } else {
        var _directions$age = this.directions[this.age];
        dx = _directions$age.dx;
        dy = _directions$age.dy;
    }
    this.age++;
    if (!game.level[this.x + dx][this.y + dy].permeable) {
        dx = 0;
        dy = 0;
    }
    if (this.delay * Math.random() > 85) {
        game.level[this.x][this.y][this.name]--;
        return game.schedule.advance().act();
    } else {
        this.move({ dx: dx, dy: dy });
    }
};

var baseActor = {
    act: act,
    move: move,
    delay: 100,
    lastMove: {
        dx: 0,
        dy: 0
    }
};

var asActor = function asActor(actor) {
    var base = Object.create(baseActor);
    for (key in actor) {
        base[key] = actor[key];
    }
    return base;
};

var actors = {
    player: asActor({
        name: "player",
        color: "white",
        spritex: 0,
        spritey: 1,
        see: see,
        act: playerAct
    }),
    mob: asActor({
        name: "mob",
        color: "white",
        spritex: 12,
        spritey: 2,
        state: "wandering",
        wandering: tunnelWandering
    }),
    snake: asActor({
        name: "snake",
        color: "hsl(40, 100%, 80%)",
        spritex: 2,
        spritey: 2,
        state: "wandering",
        wandering: snakeWandering
    }),
    skunk: asActor({
        name: 'skunk',
        color: '#F00',
        spritex: 0,
        spritey: 2,
        state: 'wandering',
        wandering: wandering,
        resting: resting
    }),
    rat: asActor({
        name: 'rat',
        color: 'hsl(40, 40%, 50%)',
        spritex: 1,
        spritey: 2,
        state: 'wandering',
        wandering: tunnelWandering
    }),
    albinoRat: asActor({
        name: 'rat',
        color: '#FFF',
        spritex: 1,
        spritey: 2,
        state: 'wandering',
        wandering: tunnelWandering
    }),
    G: asActor({
        name: 'G',
        color: '#DDD',
        spritex: 6,
        spritey: 0,
        state: 'wandering'
    }),
    //wandering: herdWandering,
    /*fastGas: asActor({
        name: "fastGas",
        color: "#FFF",
        spritex: 0,
        spritey: 0,
        state: 'brownian',
        brownian: gasMotion,
        move: gasMove,
        delay: 200,
    }),*/
    skunkGas: asActor({
        name: 'skunkGas',
        color: '#FFF',
        spritex: 4,
        spritey: 0,
        state: 'brownian',
        brownian: skunkGasMotion,
        move: gasMove,
        delay: 50
    })
};

var createActor = function createActor(name) {
    var actor = Object.create(actors[name]);
    if (game.display) {
        game.display.cacheTile(actor);
    }
    return actor;
};

var level = void 0;

var forEachTile = function forEachTile(callback) {
    for (var x = 0; x < level.width; x++) {
        for (var y = 0; y < level.height; y++) {
            callback({ x: x, y: y, tile: level[x][y] });
        }
    }
};

// create a 2d array with dimensions width by height and filled with content
var create2dArray = function create2dArray(width, height, content) {
    var isFunction = typeof content === "function";
    var array = [];
    for (var x = 0; x < width; x++) {
        array[x] = [];
        for (var y = 0; y < height; y++) {
            array[x][y] = isFunction ? content(x, y) : content;
        }
    }
    return array;
};

// get the 2d coordinates like array[x][y] corresponding to a 1d index
var getCoord = function getCoord(index) {
    var y = index % level.height;
    var x = (index - y) / level.height;
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
var inBounds = function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < level.width && y < level.height;
};

var inInnerBounds = function inInnerBounds(x, y) {
    return x > (level.height - y) / 2 && x < level.width - 1 - y / 2 && y > 0 && y < level.height - 1;
};

var xDir = [0, 1, 1, 0, -1, -1];
var yDir = [1, 0, -1, -1, 0, 1];

var floodFill = function floodFill(x, y, passable, callback) {
    if (!inBounds(x, y) || !passable(x, y)) {
        return;
    }
    callback(x, y);
    for (var i = 0; i < 6; i++) {
        floodFill(x + xDir[i], y + yDir[i], passable, callback);
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

// count the number of neighboring tiles of a certain type
var countNeighbor = function countNeighbor(isType, x, y) {
    if (typeof isType !== "function") {
        (function () {
            var type = isType;
            isType = function isType(x) {
                return x === type;
            };
        })();
    }
    var count = 0;
    for (var i = 0; i < 6; i++) {
        if (inBounds(x + xDir[i], y + yDir[i]) && isType(level[x + xDir[i]][y + yDir[i]])) {
            count++;
        }
    }
    return count;
};

// generate floor in the level to create caves
var generateFloor = function generateFloor() {
    var prng = arguments.length <= 0 || arguments[0] === undefined ? Math.random : arguments[0];

    // loop through the level randomly
    randRange(level.width * level.height, prng).forEach(function (index) {
        var _getCoord = getCoord(index);

        var _getCoord2 = babelHelpers.slicedToArray(_getCoord, 2);

        var x = _getCoord2[0];
        var y = _getCoord2[1];

        if (inInnerBounds(x, y)) {
            if (surrounded(x, y, "wall") || countGroups(x, y) !== 1) {
                level[x][y] = "floor";
            }
        }
    });
};

var isFloor = function isFloor(x, y) {
    return level[x][y] === "floor";
};

var isWall = function isWall(x, y) {
    return level[x][y] === "wall";
};

// remove all but the largest group of floor
var removeIsolatedFloor = function removeIsolatedFloor() {
    var maxSize = 0;
    forEachTile(function (_ref) {
        var x = _ref.x;
        var y = _ref.y;

        var tempTile = { size: 0 };
        floodFill(x, y, isFloor, function (x, y) {
            level[x][y] = tempTile;
            tempTile.size++;
        });
        if (tempTile.size > maxSize) {
            maxSize = tempTile.size;
        }
    });
    forEachTile(function (_ref2) {
        var x = _ref2.x;
        var y = _ref2.y;

        if (level[x][y].size) {
            level[x][y] = level[x][y].size === maxSize ? "floor" : "wall";
        }
    });
};

// remove groups of 5 or less walls
var removeIsolatedWalls = function removeIsolatedWalls() {
    forEachTile(function (_ref3) {
        var x = _ref3.x;
        var y = _ref3.y;

        var tempTile = { size: 0 };
        floodFill(x, y, isWall, function (x, y) {
            level[x][y] = tempTile;
            tempTile.size++;
        });
    });
    forEachTile(function (_ref4) {
        var x = _ref4.x;
        var y = _ref4.y;

        if (level[x][y].size) {
            level[x][y] = level[x][y].size > 5 ? "wall" : "floor";
        }
    });
};

var isDeadEnd = function isDeadEnd(x, y) {
    return level[x][y] === "floor" && countNeighbor("floor", x, y) === 1;
};

var findDeadEnds = function findDeadEnds() {
    forEachTile(function (_ref5) {
        var x = _ref5.x;
        var y = _ref5.y;

        if (level[x][y] === "floor" && isDeadEnd(x, y)) {
            floodFill(x, y, isDeadEnd, function (x, y) {
                level[x][y] = "deadEnd";
            });
        }
    });
};

var fillDeadEnds = function fillDeadEnds() {
    forEachTile(function (_ref6) {
        var x = _ref6.x;
        var y = _ref6.y;

        if (level[x][y] === "deadEnd") {
            level[x][y] = "wall";
        }
    });
};

var convert2Tiles = function convert2Tiles() {
    forEachTile(function (_ref7) {
        var x = _ref7.x;
        var y = _ref7.y;

        level[x][y] = createTile(level[x][y]);
    });
};

var findCave = function findCave() {
    var nodes = create2dArray(level.width, level.height, function (x, y) {
        return { x: x, y: y, end: !level[x][y].passable };
    });

    var end = function end(node) {
        return node.end;
    };

    var neighbor = function neighbor(node) {
        var neighbors = [];
        for (var i = 0; i < 6; i++) {
            var x = node.x + xDir[i];
            var y = node.y + yDir[i];
            if (inBounds(x, y)) {
                neighbors.push(nodes[x][y]);
            }
        }
        return neighbors;
    };

    var cost = function cost() {
        return 1;
    };

    // flat array of nodes
    var graph = [];
    for (var x = 0, i = 0; x < level.width; x++) {
        for (var y = 0; y < level.height; y++, i++) {
            graph[i] = nodes[x][y];
        }
    }var caveMap = dijkstraMap({ graph: graph, end: end, neighbor: neighbor, cost: cost });

    caveMap.forEach(function (node) {
        if (node.cost > 1) {
            level[node.x][node.y].location.cave = true;
        }
    });

    // Find floor tiles one tile away from a cave
    forEachTile(function (_ref8) {
        var x = _ref8.x;
        var y = _ref8.y;
        var tile = _ref8.tile;

        if (tile.passable && !tile.location.cave && countNeighbor(function (node) {
            return node.location.cave;
        }, x, y)) {
            tile.potentialCave = true;
        }
    });

    // Make those tiles caves
    // And find floor tiles one tile away from the new caves and make them cave exits
    // Mark those cave exits as targets for dijkstra
    forEachTile(function (_ref9) {
        var tile = _ref9.tile;
        var x = _ref9.x;
        var y = _ref9.y;

        if (tile.potentialCave) {
            tile.location.cave = true;
        }
    });

    var isCave = function isCave(x, y) {
        return level[x][y].location.cave === true;
    };

    // floodfill to group caves
    var caves = [];
    forEachTile(function (_ref10) {
        var x = _ref10.x;
        var y = _ref10.y;

        if (level[x][y].location.cave === true) {
            (function () {
                var cave = {
                    size: 0,
                    tiles: []
                };
                caves.push(cave);
                floodFill(x, y, isCave, function (x, y) {
                    level[x][y].location.cave = cave;
                    cave.size++;
                    cave.tiles.push({ x: x, y: y });
                });
            })();
        }
    });

    return caves;
};

var findExits = function findExits() {
    forEachTile(function (_ref11) {
        var tile = _ref11.tile;
        var x = _ref11.x;
        var y = _ref11.y;

        tile.location.light = 0;
        if (tile.passable && !tile.location.cave && countNeighbor(function (node) {
            return node.location.cave;
        }, x, y)) {
            var cave = void 0;
            for (var i = 0; i < 6; i++) {
                var x2 = x + xDir[i];
                var y2 = y + yDir[i];
                var neighbor = level[x2][y2];
                if (neighbor.passable) {
                    if (neighbor.location.cave) {
                        cave = neighbor.location.cave;
                    } else {
                        tile.location.exit = true;
                        break;
                    }
                }
            }
            if (!tile.location.exit) {
                tile.location.cave = cave;
            }
        }
    });
};

var normalizeLight = function normalizeLight(maxLight) {
    forEachTile(function (_ref12) {
        var tile = _ref12.tile;

        tile.location.light /= maxLight;
    });
};

var lightUp = function lightUp() {
    forEachTile(function (_ref13) {
        var x = _ref13.x;
        var y = _ref13.y;

        level[x][y].location.light = level[x][y].location.light || 0;
    });
    var maxLight = 0;
    forEachTile(function (_ref14) {
        var x = _ref14.x;
        var y = _ref14.y;

        if (level[x][y].transparent) {
            fov(x, y, function (x, y) {
                return level[x][y].transparent;
            }, function (x, y) {
                level[x][y].location.light++;
                if (level[x][y].location.light > maxLight) {
                    maxLight = level[x][y].location.light;
                }
            });
        }
    });
    normalizeLight(maxLight);
};

var grassCave = function grassCave(cave) {
    var chanceA = Math.random();
    var chanceB = Math.random();
    var tallGrassChance = Math.min(chanceA, chanceB);
    var grassChance = Math.max(chanceA, chanceB);
    cave.tiles.sort(function (a, b) {
        return level[b.x][b.y].location.light - level[a.x][a.y].location.light;
    }).forEach(function (_ref15, i) {
        var x = _ref15.x;
        var y = _ref15.y;

        var location = level[x][y].location;
        if (i < cave.tiles.length * tallGrassChance) {
            level[x][y] = createTile("tallGrass");
        } else if (i < cave.tiles.length * grassChance) {
            level[x][y] = createTile("grass");
        }
        level[x][y].location = location;
        if (i === 0) {
            var snake = createActor("snake");
            snake.x = x;
            snake.y = y;
            level[x][y].actor = snake;
            game.schedule.add(snake);
        }
    });
};

var ratCaveSpawner = function ratCaveSpawner(cave) {
    return {
        delay: 1200,
        act: function act() {
            var ratCount = 0;
            cave.tiles.forEach(function (tile) {
                if (tile.actor && tile.actor.name === 'rat') {
                    ratCount++;
                }
            });
            if (ratCount < 2) {
                cave.tiles.forEach(function (tile) {
                    if (!tile.visible && Math.random() < 1 / 24) {
                        var rat = Math.random() > 0.001 ? createActor('rat') : createActor('albinoRat');
                        rat.x = tile.x;
                        rat.y = tile.y;
                        tile.actor = rat;
                        game.schedule.add(rat);
                    }
                });
            }
            game.schedule.add(this, this.delay);
            return game.schedule.advance().act();
        }
    };
};

var ratCave = function ratCave(cave) {
    var pillarCount = 0;
    var pillarMax = Math.ceil(cave.tiles.length / 12);
    cave.tiles.sort(function (b, a) {
        return level[b.x][b.y].location.light - level[a.x][a.y].location.light;
    }).forEach(function (_ref16, i) {
        var x = _ref16.x;
        var y = _ref16.y;

        if (pillarCount < pillarMax) {
            if (countNeighbor(function (node) {
                return node.type === 'floor';
            }, x, y) === 6) {
                var location = level[x][y].location;
                var rand = Math.random();
                if (rand < 0.02) {
                    level[x][y] = createTile('brokenPillar');
                } else if (rand < 0.2) {
                    level[x][y] = createTile('crackedPillar');
                } else {
                    level[x][y] = createTile('pillar');
                }
                level[x][y].location = location;
                pillarCount++;
            }
        }
    });
    var spawner = ratCaveSpawner(cave);
    game.schedule.add(spawner, Math.random() * spawner.delay);
};

var startCave = function startCave(cave) {
    var _cave$tiles$Math$floo = cave.tiles[Math.floor(cave.tiles.length * Math.random())];
    var x = _cave$tiles$Math$floo.x;
    var y = _cave$tiles$Math$floo.y;

    game.player.x = x;
    game.player.y = y;
    level[x][y].actor = game.player;
};

var decorateCaves = function decorateCaves(caves) {
    var indeces = randRange(caves.length);
    caves.sort(function (a, b) {
        return a.tiles.length - b.tiles.length;
    });
    for (var j = 0; j < caves.length; j++) {
        var i = indeces[j];
        var cave = caves[i];
        if (i === 0) {
            startCave(cave);
        } else if (cave.tiles.length > 7) {
            if (Math.random() < 0.5) {
                grassCave(cave);
            } else {
                ratCave(cave);
            }
        }
    }
};

var createLevel = function createLevel(_ref17) {
    var width = _ref17.width;
    var height = _ref17.height;
    var _ref17$prng = _ref17.prng;
    var prng = _ref17$prng === undefined ? Math.random : _ref17$prng;

    // create a 2d array to represent the level
    level = create2dArray(width, height, "wall");
    level.width = width;
    level.height = height;

    generateFloor(prng);
    removeIsolatedFloor();
    removeIsolatedWalls();
    findDeadEnds();
    fillDeadEnds();
    convert2Tiles();
    var caves = findCave();
    findExits();
    lightUp();
    decorateCaves(caves);

    return level;
};

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

var keyCode2code = {
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
    '90': 'KeyZ'
};

var code2offset = {
    KeyW: [0, -1],
    KeyE: [1, -1],
    KeyD: [1, 0],
    KeyX: [0, 1],
    KeyZ: [-1, 1],
    KeyA: [-1, 0],
    KeyS: [0, 0]
};

var modes = ['playing'];

var keyModes = {
    playing: function playing(game, code) {
        if (code2offset[code]) {
            game.player.move(code2offset[code]);
        }

        if (code === 'Space') {
            var _game$player = game.player;
            var x = _game$player.x;
            var y = _game$player.y;

            for (var i = 200; i > 0; i--) {
                var gas = createActor("fastGas");
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
            game.display.lineToMouse(game.display.mousex, game.display.mousey);
        }
    },
    firing: function firing(game, code) {
        if (code === 'Escape') {
            game.display.clearFg();
            modes.pop();
        }
    }
};

var keyDown = function keyDown(game, e) {
    var code = e.code || keyCode2code[e.keyCode];

    // meta F for fullscreen
    if (e.metaKey && code === 'KeyF') {
        var elem = document.body;
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

    var mode = modes[modes.length - 1];
    keyModes[mode](game, code);
};

var mousemoveModes = {
    playing: function playing(game, x, y) {},
    firing: function firing(game, x, y) {
        game.display.lineToMouse(x, y);
    }
};

var mousedownModes = {
    playing: function playing(game, x, y) {
        var directions = [];
        var lastx = game.player.x;
        var lasty = game.player.y;
        line(game.player.x, game.player.y, x, y, function (_ref) {
            var x = _ref.x;
            var y = _ref.y;

            directions.push({
                dx: x - lastx,
                dy: y - lasty
            });
            lastx = x;
            lasty = y;
        }, 1);
        game.level[x][y].skunkGas = game.level[x][y].skunkGas || 0;
        for (var i = 0; i < 200; i++) {
            var gas = createActor('skunkGas');
            gas.age = 0;
            gas.x = game.player.x;
            gas.y = game.player.y;
            gas.directions = directions;
            game.level[gas.x][gas.y].skunkGas++;
            game.schedule.add(gas, 100 - i);
        }
    },
    firing: function firing(game, x, y) {}
};

var tileHover = function tileHover(game, x, y) {
    var mode = modes[modes.length - 1];
    mousemoveModes[mode](game, x, y);
};

var tileClick = function tileClick(game, x, y) {
    var mode = modes[modes.length - 1];
    mousedownModes[mode](game, x, y);
};

var game$2 = void 0;

var startGame = function startGame(_ref) {
    var seed = _ref.seed;
    var width = _ref.width;
    var height = _ref.height;

    window.game = game$2;

    game$2.player = createActor("player");

    game$2.schedule = createSchedule();
    game$2.schedule.add(game$2.player);

    game$2.level = createLevel({ width: width, height: height });
    game$2.display.cacheLevel(game$2.level);

    // add listeners
    window.addEventListener("keydown", keyDown.bind(null, game$2));
    game$2.display.setMouseListener(tileHover.bind(null, game$2));
    game$2.display.tileClick = tileClick.bind(null, game$2);

    game$2.player.see();
    game$2.schedule.advance().act();
};

var createGame = (function (_ref2) {
    var _ref2$seed = _ref2.seed;
    var seed = _ref2$seed === undefined ? 0 : _ref2$seed;
    var display = _ref2.display;
    var _ref2$width = _ref2.width;
    var width = _ref2$width === undefined ? 48 : _ref2$width;
    var _ref2$height = _ref2.height;
    var height = _ref2$height === undefined ? 30 : _ref2$height;

    game$2 = {
        seed: seed,
        display: display,
        width: width,
        height: height
    };

    display.setDimensions(width, height, 18, 16, 1);
    display.load("tileset2.png", startGame.bind(null, { seed: seed, width: width, height: height }));
})

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
		//document.body.style.fontSize = 16 * scale + "px";
		this.canvas.width = (width - height / 2 + 1) * xunit;
		this.canvas.height = height * yunit;
		this.canvas.style.width = (width - height / 2 + 1) * xunit * scale + "px";
		this.bgcanvas.width = (width - height / 2 + 1) * xunit;
		this.bgcanvas.height = height * yunit;
		this.bgcanvas.style.width = (width - height / 2 + 1) * xunit * scale + "px";
		this.root.style.width = this.canvas.clientWidth + "px";
		this.fgcanvas.width = (width - height / 2 + 1) * xunit;
		this.fgcanvas.height = height * yunit;
		this.fgcanvas.style.width = (width - height / 2 + 1) * xunit * scale + "px";
		this.root.style.width = this.canvas.clientWidth + 208 + "px";
		this.root.style.height = this.canvas.clientHeight /*+ this.sidebar.clientHeight*/ + "px";
	},

	// load the spritesheet then call callback
	load: function load(path, callback) {
		this.tileset = document.createElement("img");
		this.tileset.addEventListener("load", callback);
		this.tileset.src = path;
	},

	// log text to the message buffer
	log: function log(text) {
		this.messages.innerHTML = text;
	},

	// draw a level
	draw: function draw(level) {
		this.drawbg(level);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		var xu = this.xunit;
		var yu = this.yunit;
		for (var y = 0; y < this.height; y++) {
			for (var x = Math.floor((this.height - y) / 2); x < this.width - Math.floor(y / 2); x++) {
				var tile = level[x][y];
				if ( /*tile.location.light || */tile.visible) {
					var realx = (x - (this.height - y - 1) / 2) * xu;
					var realy = y * yu;
					if (tile.drawn) {
						this.bgctx.drawImage(tile.shadowCanvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					}
					tile.drawn = false;
					//this.ctx.fillStyle = '#000';
					//this.ctx.fillRect(realx, realy, xu, yu);
					if (tile.fastGas) {
						var gas = this.cacheTile({
							spritex: 4,
							spritey: 0,
							color: 'rgba(255, 255, 255, ' + (1 - Math.pow(2, -tile.fastGas / 10)) + ')'
						});
						this.ctx.drawImage(gas.canvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					}
					if (tile.skunkGas) {
						var _gas = this.cacheTile({
							spritex: 4,
							spritey: 0,
							color: 'rgba(255, 255, 255, ' + (1 - Math.pow(2, -tile.skunkGas / 10)) + ')'
						});
						this.ctx.drawImage(_gas.canvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					}
					if (tile.actor) {
						this.ctx.drawImage(tile.actor.canvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					} else {
						this.ctx.drawImage(tile.canvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					}
				}
			}
		}
	},
	drawbg: function drawbg(level) {
		var xu = this.xunit;
		var yu = this.yunit;
		for (var y = 0; y < this.height; y++) {
			for (var x = Math.floor((this.height - y) / 2); x < this.width - Math.floor(y / 2); x++) {
				var tile = level[x][y];
				if ( /*!tile.visible && tile.seen && !tile.drawn*/tile.location.light) {
					var realx = (x - (this.height - y - 1) / 2) * xu;
					var realy = y * yu;
					this.bgctx.clearRect(realx, realy, xu, yu);
					this.bgctx.drawImage(tile.canvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					tile.drawn = true;
				}
			}
		}
	},
	cacheTile: function cacheTile(tile) {
		var xu = 18;
		var yu = 24;
		var canvas = document.createElement("canvas");
		canvas.width = xu;
		canvas.height = yu;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(this.tileset, tile.spritex * xu, tile.spritey * yu, xu, yu, 0, 0, xu, yu);
		ctx.fillStyle = tile.color;
		ctx.globalCompositeOperation = "source-in";
		ctx.fillRect(0, 0, xu, yu);
		tile.canvas = canvas;

		var shadowCanvas = document.createElement('canvas');
		shadowCanvas.width = xu;
		shadowCanvas.height = yu;
		var shadowCtx = shadowCanvas.getContext('2d');
		shadowCtx.drawImage(this.tileset, tile.spritex * xu, tile.spritey * yu, xu, yu, 0, 0, xu, yu);
		shadowCtx.fillStyle = '#000';
		shadowCtx.globalCompositeOperation = 'source-in';
		shadowCtx.fillRect(0, 0, xu, yu);
		tile.shadowCanvas = shadowCanvas;

		return tile;
	},
	cacheLevel: function cacheLevel(level) {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				var tile = level[x][y];
				this.cacheTile(tile);
			}
		}
	},
	setMouseListener: function setMouseListener(listener) {
		this.tileHover = listener;
	},
	setMousedownListener: function setMousedownListener(listener) {
		this.tileClick = listener;
	},

	mousex: -1,
	mousey: -1,
	mousemove: function mousemove(e) {
		var xu = this.xunit;
		var yu = this.yunit;
		var parent = this.canvas.parentElement;
		var y = Math.floor((e.clientY - parent.offsetTop) / yu / this.scale);
		var x = Math.floor((e.clientX - parent.offsetLeft) / xu / this.scale + (this.height - y - 1) / 2);
		if (!game.level[x] || !game.level[x][y]) {
			return;
		}
		if (x !== this.mousex || y !== this.mousey) {
			this.mousex = x;
			this.mousey = y;
			this.tileHover(x, y);
		}
	},
	mousedown: function mousedown(e) {
		this.tileClick(this.mousex, this.mousey);
	},
	clearFg: function clearFg() {
		this.fgctx.clearRect(0, 0, this.width * this.xunit, this.height * this.yunit);
	},
	lineToMouse: function lineToMouse(x, y) {
		var _this = this;

		this.clearFg();

		var tile = this.cacheTile({
			spritex: 4,
			spritey: 0,
			color: 'rgba(0, 255, 255, 0.2)'
		});

		var callback = function callback(_ref) {
			var x = _ref.x;
			var y = _ref.y;

			if (!game.level[x][y].passable || !game.level[x][y].seen) {
				return true;
			}
			var realx = (x - (_this.height - y - 1) / 2) * _this.xunit;
			var realy = y * _this.yunit;
			_this.fgctx.drawImage(tile.canvas, 0, 0, _this.xunit, _this.yunit + 8, realx, realy - 8, _this.xunit, _this.yunit + 8);
		};

		line(game.player.x, game.player.y, x, y, callback, 1);
	}
};

var createDisplay = (function (_ref2) {
	var root = _ref2.root;

	var display = Object.create(prototype);
	display.root = root;

	// setup sidebar
	display.sidebar = document.getElementById("sidebar");

	// setup messages
	display.messages = document.createElement("div");
	display.messages.setAttribute("id", "messages");
	root.appendChild(display.messages);

	// setup foreground canvas
	display.fgcanvas = document.createElement("canvas");
	display.fgcanvas.setAttribute("id", "fgcanvas");
	root.insertBefore(display.fgcanvas, display.sidebar);
	display.fgctx = display.fgcanvas.getContext("2d");

	// setup canvas
	display.canvas = document.createElement("canvas");
	display.canvas.setAttribute("id", "canvas");
	root.insertBefore(display.canvas, display.sidebar);
	display.ctx = display.canvas.getContext("2d");

	// setup background canvas
	display.bgcanvas = document.createElement("canvas");
	display.bgcanvas.setAttribute("id", "bgcanvas");
	root.insertBefore(display.bgcanvas, display.sidebar);
	display.bgctx = display.bgcanvas.getContext("2d");

	display.fgcanvas.addEventListener("mousemove", display.mousemove.bind(display), false);
	display.fgcanvas.addEventListener("mousedown", display.mousedown.bind(display), false);

	return display;
})

var display = createDisplay({
    root: document.getElementById("game")
});

var game$1 = createGame({
    display: display
});