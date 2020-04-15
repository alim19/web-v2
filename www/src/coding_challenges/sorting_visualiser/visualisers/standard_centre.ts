/// <reference path="../visualiser.ts" />


Visualisers.push({
	name: "center bars",
	fxn: (arr: WatchedArray, c: p5, cfn: ColorFunction) => {
		c.background(180, 180, 180);
		c.push();
		c.noStroke();
		let a = arr.arr;
		c.translate(0, c.height / 2)
		for (let i = 0; i < a.length; i++) {
			let pScale = a[i] / a.length;
			let col = cfn(c, pScale, arr.read[i], arr.written[i]);
			c.fill(col);
			c.rect(0, c.height * pScale / 2, c.width / a.length, -c.height * pScale);
			c.translate(c.width / a.length, 0);
		}
		c.pop();
	}
});