import {line} from "./fov";

const prototype = {
	// set the dimensions of the dislpay
	// unit is the size in pixels of a tile
	// scale scales everything up
	setDimensions(width, height, xunit, yunit, scale) {
		this.width = width;
		this.height = height;
		this.xunit = xunit;
		this.yunit = yunit;
		this.scale = scale;
        document.body.style.fontSize = 8 * scale + "px";
		this.canvas.width = (width - height / 2 + 1) * xunit;
		this.canvas.height = height * yunit;
		this.canvas.style.width = (width - height / 2 + 1) + "em";
		this.bgcanvas.width = (width - height / 2 + 1) * xunit;
		this.bgcanvas.height = height * yunit;
		this.bgcanvas.style.width = (width - height / 2 + 1) + "em";
        this.root.style.width = this.canvas.clientWidth + "px";
		this.fgcanvas.width = (width - height / 2 + 1) * xunit;
		this.fgcanvas.height = height * yunit;
		this.fgcanvas.style.width = (width - height / 2 + 1) + "em";
        this.root.style.width = this.canvas.clientWidth + "px";
        this.root.style.height = this.canvas.clientHeight + this.sidebar.clientHeight + "px";
	},
	// load the spritesheet then call callback
	load(path, callback) {
		this.tileset = document.createElement("img");
		this.tileset.addEventListener("load", callback);
		this.tileset.src = path;
	},
	// log text to the message buffer
	log(text) {
		this.messages.innerHTML = text;
	},
	// draw a level
	draw(level) {
		this.drawbg(level);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		const xu = this.xunit;
		const yu = this.yunit;
		for (let y = 0; y < this.height; y++) {
			for (let x = Math.floor((this.height - y) / 2); x < this.width - Math.floor(y / 2); x++) {
				const tile = level[x][y];
				if (/*tile.light || */tile.visible) {
					const realx = (x - (this.height - y - 1) / 2) * xu;
					const realy = y * yu;
					tile.drawn = false;
					if (tile.fastGas) {
						this.ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - Math.pow(2, -tile.fastGas/10)) + ')';
					} else {
						this.ctx.fillStyle = '#000';
					}
					this.ctx.fillRect(realx, realy, xu, yu);
					if (tile.actor) {
						this.ctx.drawImage(tile.actor.canvas, 0, 0, xu, yu, realx, realy, xu, yu);
					} else {
						this.ctx.drawImage(tile.canvas, 0, 0, xu, yu, realx, realy, xu, yu);
					}
				}
			}
		}
	},
	drawbg(level) {
		const xu = this.xunit;
		const yu = this.yunit;
		for (let y = 0; y < this.height; y++) {
			for (let x = Math.floor((this.height - y) / 2); x < this.width - Math.floor(y / 2); x++) {
				const tile = level[x][y];
				if (!tile.visible && tile.seen && !tile.drawn) {
					const realx = (x - (this.height - y - 1) / 2) * xu;
					const realy = y * yu;
					this.bgctx.clearRect(realx, realy, xu, yu);
					this.bgctx.drawImage(tile.canvas, 0, 0, xu, yu, realx, realy, xu, yu);
					tile.drawn = true;
				}
			}
		}
	},
	cacheTile(tile) {
        const xu = this.xunit;
        const yu = this.yunit;
		const canvas = document.createElement("canvas");
		canvas.width = xu;
		canvas.height = yu;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(this.tileset, tile.spritex * xu, tile.spritey * yu, xu, yu, 0, 0, xu, yu);
        ctx.fillStyle = tile.color;
        ctx.globalCompositeOperation = "source-in";
        ctx.fillRect(0, 0, xu, yu);
		tile.canvas = canvas;
		return tile;
	},
	cacheLevel(level) {
		for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) {
            const tile = level[x][y];
			this.cacheTile(tile);
		}
	},
	setMouseListener(listener) {
		this.tileHover = listener;
	},
	mousex: -1,
	mousey: -1,
	mousemove(e) {
		const xu = this.xunit;
		const yu = this.yunit;
		const parent = this.canvas.parentElement;
		const y = Math.floor((e.clientY - parent.offsetTop) / yu / this.scale);
		const x = Math.floor((e.clientX - parent.offsetLeft) / xu / this.scale + (this.height - y - 1) / 2);
		if (!game.level[x] || !game.level[x][y]) {
			return;
		}
		if (x !== this.mousex || y !== this.mousey) {
			this.mousex = x;
			this.mousey = y;
			this.tileHover(x, y);
		}
		const tile = this.cacheTile({
            spritex: 9,
            spritey: 4,
            color: game.level[x][y].color,
        });
		const realx = (x - (this.height - y - 1) / 2) * xu;
		const realy = y * yu;
        //this.ctx.drawImage(tile.canvas, 0, 0, 8, 8, realx, realy, 8, 8);
	},
	clearFg() {
		this.fgctx.clearRect(0, 0, this.width * this.xunit, this.height * this.yunit);
	},
	lineToMouse(x, y) {
		const realx = (x - (this.height - y - 1) / 2) * this.xunit;
		const realy = y * this.yunit;
		const tile = this.cacheTile({
            spritex: 9,
            spritey: 4,
            color: game.level[x][y].color,
        });
        this.clearFg();
        this.fgctx.drawImage(tile.canvas, 0, 0, 8, 8, realx, realy, 8, 8);
	},
};

export default ({root}) => {
	const display = Object.create(prototype);
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

	return display;
};
