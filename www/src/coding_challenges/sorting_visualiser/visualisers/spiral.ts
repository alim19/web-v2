/// <reference path="../visualiser.ts" />

Visualisers.push({
	name: "spiral",
	fxn: (arr: WatchedArray, c: p5, cfn: ColorFunction) => {
		c.background(180, 180, 180);
		c.push();
		let r = 10;
		let scale = Math.min(c.width, c.height) / 2 - r;
		c.translate(c.width / 2, c.height / 2);
		let a = arr.arr;
		c.noStroke();
		c.angleMode("degrees");
		for (let i = 0; i < a.length; i++) {
			let pScale = a[i] / a.length;
			let col = cfn(c, pScale, arr.read[i], arr.written[i]);
			c.fill(col);
			c.ellipse(pScale * scale, 0, r * 2);
			c.rotate(360 / a.length);
		}
		// c.fill(255, 0, 0);
		// c.ellipse(0, 0, 10);
		c.pop();
	}
});