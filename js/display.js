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
				if (/*tile.location.light || */tile.visible) {
					const realx = (x - (this.height - y - 1) / 2) * xu;
					const realy = y * yu;
					if (tile.drawn) {
						this.bgctx.drawImage(tile.shadowCanvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					}
					tile.drawn = false;
					//this.ctx.fillStyle = '#000';
					//this.ctx.fillRect(realx, realy, xu, yu);
					if (tile.fastGas) {
						const gas = this.cacheTile({
							spritex: 4,
							spritey: 0,
							color: 'rgba(255, 255, 255, ' + (1 - Math.pow(2, -tile.fastGas/10)) + ')',
						});
						this.ctx.drawImage(gas.canvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					}
					if (tile.skunkGas) {
						const gas = this.cacheTile({
							spritex: 4,
							spritey: 0,
							color: 'rgba(255, 255, 255, ' + (1 - Math.pow(2, -tile.skunkGas/10)) + ')',
						});
						this.ctx.drawImage(gas.canvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
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
	drawbg(level) {
		const xu = this.xunit;
		const yu = this.yunit;
		for (let y = 0; y < this.height; y++) {
			for (let x = Math.floor((this.height - y) / 2); x < this.width - Math.floor(y / 2); x++) {
				const tile = level[x][y];
				if (/*!tile.visible && tile.seen && !tile.drawn*/ tile.location.light) {
					const realx = (x - (this.height - y - 1) / 2) * xu;
					const realy = y * yu;
					this.bgctx.clearRect(realx, realy, xu, yu);
					this.bgctx.drawImage(tile.canvas, 0, 0, xu, yu + 8, realx, realy - 8, xu, yu + 8);
					tile.drawn = true;
				}
			}
		}
	},
	cacheTile(tile) {
        const xu = 18;
        const yu = 24;
		const canvas = document.createElement("canvas");
		canvas.width = xu;
		canvas.height = yu;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(this.tileset, tile.spritex * xu, tile.spritey * yu, xu, yu, 0, 0, xu, yu);
        ctx.fillStyle = tile.color;
        ctx.globalCompositeOperation = "source-in";
        ctx.fillRect(0, 0, xu, yu);
		tile.canvas = canvas;

		const shadowCanvas = document.createElement('canvas');
		shadowCanvas.width = xu;
		shadowCanvas.height = yu;
		const shadowCtx = shadowCanvas.getContext('2d');
		shadowCtx.drawImage(this.tileset, tile.spritex * xu, tile.spritey * yu, xu, yu, 0, 0, xu, yu);
		shadowCtx.fillStyle = '#000';
		shadowCtx.globalCompositeOperation = 'source-in';
		shadowCtx.fillRect(0, 0, xu, yu);
		tile.shadowCanvas = shadowCanvas;

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
	setMousedownListener(listener) {
		this.tileClick = listener;
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
	},
	mousedown(e) {
		this.tileClick(this.mousex, this.mousey);
	},
	clearFg() {
		this.fgctx.clearRect(0, 0, this.width * this.xunit, this.height * this.yunit);
	},
	lineToMouse(x, y) {
        this.clearFg();

		const tile = this.cacheTile({
            spritex: 4,
            spritey: 0,
            color: 'rgba(0, 255, 255, 0.2)',
        });

		const callback = ({x, y}) => {
			if (!game.level[x][y].passable || !game.level[x][y].seen) { return true; }
			const realx = (x - (this.height - y - 1) / 2) * this.xunit;
			const realy = y * this.yunit;
        	this.fgctx.drawImage(tile.canvas, 0, 0, this.xunit, this.yunit + 8, realx, realy - 8, this.xunit, this.yunit + 8);
		};

		line(game.player.x, game.player.y, x, y, callback, 1);
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
	display.fgcanvas.addEventListener("mousedown", display.mousedown.bind(display), false);

	return display;
};
