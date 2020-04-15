/// <reference path="../../../tsd/p5.d.ts" />
/// <reference path="perceptron.ts" />



class sketch extends p5 {
	_points: {
		x: number,
		y: number,
		c: boolean
	} [];
	_line: {
		m: number,
		c: number
	};

	_perceptron: Perceptron;
	constructor() {
		super(() => {}, document.getElementById("sketch"));
	}

	setup() {
		// console.log(this.parent);
		this.createCanvas(400, 400);
		this._points = [];
		this._line = {
			m: this.tan(this.random(0, this.PI)),
			c: this.random(-this.height / 2, this.height / 2),
		}
		for (let i = 0; i < 500; i++) {
			let p = {
				x: this.random(-this.width / 2, this.width / 2),
				y: this.random(-this.height / 2, this.height / 2),
				c: false,
			};
			if (p.y > (this._line.m * p.x + this._line.c)) {
				p.c = true;
			}
			this._points.push(p)
		}

		this._perceptron = new Perceptron(2, (x) => x > 0 ? 1 : -1);

	}

	draw() {
		this.background(255);
		this.strokeWeight(4);
		this.fill(0, 0, 0);
		this.translate(this.width / 2, this.height / 2);
		for (let p of this._points) {
			let prediction = this._perceptron.predict([p.x / (this.width / 2), p.y / (this.height / 2)]);
			if (prediction > 0) {
				this.stroke(255, 0, 0);
			} else {
				this.stroke(0, 255, 0);
			}
			this.ellipse(p.x, p.y, 10);
		}

		this.stroke(127, 0, 0);

		this.line(-200, this._line.c - 200 * this._line.m, 200, this._line.c + 200 * this._line.m);

		this.stroke(0, 127, 0);
		let m = -(this._perceptron.weights[0] / (this.width / 2)) / (this._perceptron.weights[1] / (this.height / 2));
		let c = -this._perceptron.bias / (this._perceptron.weights[1] / (this.height / 2));

		this.line(-this.width / 2, c - this.height / 2 * m, this.width / 2, c + this.height / 2 * m);
		for (let i = 0; i < 100; i++) {
			let p = this.random(this._points);
			this._perceptron.train([p.x / (this.width / 2), p.y / (this.height / 2)], p.c ? 1 : -1);
			// this._perceptron.train([p.x, p.y], p.c ? 1 : -1);
		}
		// this.line(this._perceptron.weights[0]/this._perceptron.weights[1], )

	}

}

window.addEventListener("load", () => {
	new sketch();
})