/// <reference path="../algo.ts" />


class CocktailShakerSort extends Algorithm {
	noIters: number = 0;
	position: number = 0;
	sortIteration() {
		let a = this.elems.get(this.position);
		let b = this.elems.get(this.position + 1);
		if (a > b) {
			this.elems.set(this.position + 1, a);
			this.elems.set(this.position, b);
		}
		if (this.noIters % 2 == 0)
			this.position++;
		else
			this.position--;
		// console.log(this.position, this.noIters)
		if ((this.position >= (this.elems.length - Math.ceil(this.noIters / 2) - 1)) || (this.position < (Math.floor(this.noIters / 2)))) {
			this.noIters++;
			if (this.noIters % 2 == 0)
				this.position++;
			else
				this.position--;
		}
	}
	getComplete() {
		return this.noIters >= this.elems.length;
	}
	setOpt(key, val) {}
}
Algorithms.push({
	name: "cocktailshaker",
	constructor: CocktailShakerSort,
});