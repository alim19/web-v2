/// <reference path="../color.ts" />

Colors.push({
	name: "White+Red",
	fxn: (c: p5, v: number, r: boolean, w: boolean) => {
		c.push();
		c.colorMode(HSB);
		let col: p5.Color;
		// col = c.color(0, 0, (1 - v) * 100);
		if (r || w)
			col = c.color(0, 100, 100);
		else
			col = c.color(0, 0, 100);
		if (w)
			console.log("w");
		c.pop();
		return col;
	}
});