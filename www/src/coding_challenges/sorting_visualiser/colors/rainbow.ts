/// <reference path="../color.ts" />

Colors.push({
	name: "rainbow",
	fxn: (c, v, r, w) => {
		c.push();
		c.colorMode(HSB);
		let col = c.color(v * 360, 100, 100);
		c.pop();
		return col;
	}
});
Colors.push({
	name: "rainbowMod",
	fxn: (c, v, r, w) => {
		c.push();
		c.colorMode(HSB);
		let col;
		col = c.color(v * 360, w ? 0 : 100, r ? 0 : 100);
		if (w)
			console.log("w");
		c.pop();
		return col;
	}
});
Colors.push({
	name: "rainbowBW",
	fxn: (c, v, r, w) => {
		c.push();
		c.colorMode(HSB);
		let col;
		col = c.color(0, 0, v * 100);
		if (r || w)
			col = c.color(0, 100, 100);
		if (w)
			console.log("w");
		c.pop();
		return col;
	}
});
Colors.push({
	name: "rainbowBWrev",
	fxn: (c, v, r, w) => {
		c.push();
		c.colorMode(HSB);
		let col;
		col = c.color(0, 0, (1 - v) * 100);
		if (r || w)
			col = c.color(0, 100, 100);
		if (w)
			console.log("w");
		c.pop();
		return col;
	}
});