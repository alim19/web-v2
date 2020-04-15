/// <reference path="../visualiser.ts" />


Visualisers.push({
	name: "standard",
	fxn: (arr: WatchedArray, c: p5, cfn: ColorFunction) => {
		c.background(180, 180, 180);
		c.push();
		c.noStroke();
		let a = arr.arr;
		for (let i = 0; i < a.length; i++) {
			let pScale = a[i] / a.length;
			let col = cfn(c, pScale, arr.read[i], arr.written[i]);
			c.fill(col);
			c.rect(0, height, c.width / a.length, -c.height * pScale);
			c.translate(c.width / a.length, 0);
		}
		c.pop();
	}
});