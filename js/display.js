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
		this.canvas.width = (width - height / 2 + 1) * xunit;
		this.canvas.height = height * yunit;
		this.canvas.style.width = (width - height / 2 + 1) * xunit * scale + "px";
		this.canvas.style.height = height * yunit * scale + "px";
		this.bgcanvas.width = (width - height / 2 + 1) * xunit;
		this.bgcanvas.height = height * yunit;
		this.bgcanvas.style.width = (width - height / 2 + 1) * xunit * scale + "px";
		this.bgcanvas.style.height = height * yunit * scale + "px";
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
				if (tile.light || tile.visible) {
					const realx = (x - (this.height - y - 1) / 2) * xu;
					const realy = y * yu;
					tile.drawn = false;
					this.ctx.fillStyle = "#000";
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
	mousemove(e) {
		const y = Math.floor((e.clientY - this.canvas.offsetTop) / this.yunit / this.scale);
		const x = Math.floor(((e.clientX - this.canvas.offsetLeft) / this.xunit / this.scale + (this.height - y - 1) / 2));
		const tile = this.cacheTile({
            spritex: 9,
            spritey: 4,
            color: game.level[x][y].color,
        });
        const realx = (x - (this.height - y - 1) / 2) * 8;
        const realy = y * 8;
        //this.ctx.drawImage(tile.canvas, 0, 0, 8, 8, realx, realy, 8, 8);
	},
};

export default ({root}) => {
	const display = Object.create(prototype);

	// setup messages
	display.messages = document.createElement("div");
	display.messages.setAttribute("id", "messages");
	root.appendChild(display.messages);

	// setup background canvas
	display.bgcanvas = document.createElement("canvas");
	display.bgcanvas.setAttribute("id", "bgcanvas");
	root.appendChild(display.bgcanvas);
	display.bgctx = display.bgcanvas.getContext("2d");

	// setup canvas
	display.canvas = document.createElement("canvas");
	root.appendChild(display.canvas);
	display.ctx = display.canvas.getContext("2d");

	display.canvas.addEventListener("mousemove", display.mousemove.bind(display), false);

	//display.log("Loading... ");

	return display;
};
