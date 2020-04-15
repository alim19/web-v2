/// <reference path="../visualiser.ts" />

Visualisers.push({
	name: "pie",
	fxn: (arr: WatchedArray, c: p5, cfn: ColorFunction) => {
		c.background(180, 180, 180);
		c.push();
		let scale = Math.min(c.width, c.height) - 5;
		c.translate(c.width / 2, c.height / 2);
		let a = arr.arr;
		c.noStroke();
		c.angleMode("degrees");
		for (let i = 0; i < a.length; i++) {
			let pScale = a[i] / a.length;
			let col = cfn(c, pScale, arr.read[i], arr.written[i]);
			c.fill(col);
			c.arc(0, 0, scale, scale, 0, 360 / a.length);
			c.rotate(360 / a.length);
		}
		c.pop();
	}
});