/// <reference path="../algo.ts" />

class nearSorted extends Algorithm {

	maxDist: number = 0;
	remDist: number = -1;
	idx: number = 0;

	sortIteration() {
		if (this.remDist == -1)
			this.remDist = this.maxDist;
		if (Math.round(Math.random())) {
			this.elems.swap(this.idx, this.idx + 1);
		}
		this.idx += 2;
		if (this.idx >= this.elems.length - 1) {
			this.idx = 0;
			this.remDist--;
		}
	}
	setOpt(key, val) {
		if (key == "distance") {
			this.maxDist = val;
		}
	}
	getComplete() {
		return this.remDist <= 0;
	}
}
Shuffles.push({
	name: "near sorted",
	constructor: nearSorted,
	opts: {
		"distance": [
			["1", 1],
			["2", 2],
			["3", 3],
			["4", 4],
			["5", 5],
			["6", 6],
			["7", 7],
			["8", 8],
			["10", 10],
			["12", 12],
			["14", 14],
			["17", 17],
			["20", 20],
			["24", 24],
			["28", 28],
			["33", 33],
		]
	}
});