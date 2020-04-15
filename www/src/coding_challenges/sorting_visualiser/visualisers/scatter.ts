/// <reference path="../visualiser.ts" />

Visualisers.push({
	name: "scatter",
	fxn: (arr: WatchedArray, c: p5, cfn: ColorFunction) => {
		c.background(180, 180, 180);
		c.push();
		let a = arr.arr;
		c.translate(0, height);
		c.strokeWeight(Math.max(1, Math.max(c.width, c.height) / a.length) * 3);
		for (let i = 0; i < a.length; i++) {
			let pScale = a[i] / a.length;
			let col = cfn(c, pScale, arr.read[i], arr.written[i]);
			c.stroke(col);
			c.point(c.width / a.length, -c.height * pScale);
			c.translate(c.width / a.length, 0);
		}
		c.pop();
	}
});