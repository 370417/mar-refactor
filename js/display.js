const colors = {
	white: "#FFF"
};

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
		this.canvas.width = (width - height / 2) * xunit;
		this.canvas.height = height * yunit;
		this.canvas.style.width = (width - height / 2) * xunit * scale + "px";
		this.canvas.style.height = height * yunit * scale + "px";
	},
	// load the spritesheet then call callback
	load(path, callback) {
		this.tileset = document.createElement("img");
		this.tileset.addEventListener("load", callback);
		this.tileset.src = path;
	},
	// log text to the message buffer
	log(text) {
		this.messages.innerHTML += text;
	},
	// draw a level
	draw(level) {
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		const xu = this.xunit;
		const yu = this.yunit;
		for (let y = 0; y < this.height; y++) for (let x = Math.floor((this.height - y) / 2); x < this.width - Math.floor(y / 2); x++) {
			let tile = level[x][y];
			if (tile.actor) {
				this.ctx.drawImage(tile.actor.canvas, 0, 0, xu, yu, x * xu, y * yu, xu, yu);
			} else {
				this.ctx.drawImage(tile.canvas, 0, 0, xu, yu, (x - (this.height - y) / 2) * xu, y * yu, xu, yu);
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
        ctx.fillStyle = colors[tile.color];
        ctx.globalCompositeOperation = "source-in";
        ctx.fillRect(0, 0, xu, yu);
		tile.canvas = canvas;
		return tile;
	},
	cacheLevel(level) {
		for (let x = 0; x < this.width; x++) for (let y = 0; y < this.height; y++) {
			this.cacheTile(level[x][y]);
		}
	}
};

export default ({root}) => {
	const display = Object.create(prototype);

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
};