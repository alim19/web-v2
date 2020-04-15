/// <reference path="../../tsd/p5.global-mode.d.ts" />

class WatchedArray {
	private _reads: number = 0;
	private _writes: number = 0;
	private _arr: number[];
	private _written: boolean[];
	private _read: boolean[];
	private _length: number;
	constructor(size: number) {
		this._arr = [];
		this._read = [];
		this._written = [];
		for (let i = 0; i < size; i++) {
			this._arr[i] = i;
			this._read[i] = false;
			this._written[i] = false;
		}
		this._length = size;
		// this._read = new Array < boolean > (size).map(b => false);
		// this._written = new Array < boolean > (size).map(b => false);
	}

	resetStats() {
		this._reads = 0;
		this._writes = 0;
	}

	get(idx: number) {
		if (idx >= this._length)
			console.error(`Invalid index : ${idx}`);
		this._reads++;
		this._read[idx] = true;
		return this._arr[idx];
	}

	set(idx: number, val: number) {
		if (idx >= this._length)
			console.error(`Invalid index : ${idx}`);
		this._writes++;
		this._written[idx] = true;
		this._arr[idx] = val;
	}

	swap(idx1: number, idx2: number) {
		if (idx1 >= this._length)
			console.error(`Invalid index : ${idx1}`);
		if (idx2 >= this._length)
			console.error(`Invalid index : ${idx2}`);
		// this.accesses += 2;
		this._writes += 2;
		let tmp = this._arr[idx1];
		this._arr[idx1] = this._arr[idx2];
		this._arr[idx2] = tmp;

		this._written[idx1] = true;
		this._written[idx2] = true;
		this._read[idx1] = true;
		this._read[idx2] = true;

	}


	get written() {
		return this._written;
	}
	set written(val) {
		this._written = this._written.map(b => false);
	}

	get read() {
		return this._read;
	}
	set read(val) {
		this._read = this.read.map(b => false);
	}

	get arr() {
		return this._arr;
	}

	get length() {
		return this._length;
	}

	get writes() {
		return this._writes;
	}
	get reads() {
		return this._reads;
	}

}

type VisualiserFunction = (arr: WatchedArray, context: p5, colFxn: ColorFunction) => void;
interface Visualiser {
	name: string,
		fxn: VisualiserFunction,
}

let Visualisers: Visualiser[] = [];