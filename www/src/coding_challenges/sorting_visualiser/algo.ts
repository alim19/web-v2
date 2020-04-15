/// <reference path="visualiser.ts" />


interface AlgorithmConstructor {
	new(arr: WatchedArray): Algorithm;
}


abstract class Algorithm {
	protected elems: WatchedArray;
	constructor(arr: WatchedArray) {
		this.elems = arr;
	}

	sort() {
		while (!this.getComplete()) this.sortIteration();
	}
	abstract sortIteration();
	abstract getComplete(): boolean;
	abstract setOpt(key: string, value: any);
}

// type AlgoConstructor

interface Algo {
	name: string,
		constructor: AlgorithmConstructor,
		opts ? : {
			[opt_name: string]: [string, any][],
		}
}

let Algorithms: Algo[] = [];
let Shuffles: Algo[] = [];