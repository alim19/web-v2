/// <reference path="../algo.ts" />

enum HeapSortState {
	START,
	HEAPIFY,
	SORT,
}
class HeapSort extends Algorithm {
	state: HeapSortState = HeapSortState.START;
	heapSize: number;
	pos: number;
	filterPos: number;

	sortIteration() {
		if (this.state == HeapSortState.START) {
			this.heapSize = this.elems.length;
			//0 -> 1,2
			//1 -> 3,4
			//2 -> 5,6
			//n -> 2n+1,2n+2
			this.pos = Math.floor((this.heapSize - 1) / 2);
			this.filterPos = this.pos;
			this.state = HeapSortState.HEAPIFY;
		} else if (this.state == HeapSortState.HEAPIFY) {
			if (!this.filterDownIteration()) {
				this.pos--;
				this.filterPos = this.pos;
				if (this.pos < 0) {
					this.state = HeapSortState.SORT;
					console.log("Heap created");
					this.pos = 0;
					this.filterPos = this.pos;
					this.verifyMaxHeap();
				}
			}
		} else if (this.state == HeapSortState.SORT) {
			// this.heapSize = 0;
			// return;
			if (this.filterPos == -1) {
				this.elems.swap(0, this.heapSize - 1);
				this.heapSize--;
				this.filterPos = 0;
			} else if (!this.filterDownIteration()) {
				this.filterPos = -1;
			}
			// this.state = HeapSortState.
			// this.heapSize = 0;
		}
	}
	filterDownIteration() {
		let filtered = false;
		let fp = this.filterPos;
		if (this.filterPos < 0 || this.filterPos >= this.heapSize) {
			// debugger;
			return;
		}
		let parent: number = this.elems.get(this.filterPos);
		let childIdx: number = this.filterPos * 2 + 1;
		let c1, c2;
		if (childIdx < this.heapSize)
			c1 = this.elems.get(childIdx);
		if ((childIdx + 1) < this.heapSize)
			c2 = this.elems.get(childIdx + 1);
		let greaterIdx, greater;
		if (c1 != undefined) {
			greaterIdx = childIdx;
			greater = c1;
			if (c2 != undefined && c2 > c1) {
				greaterIdx++;
				greater = c2;
			}
		}
		if (greaterIdx && greater > parent) {
			//swap
			this.elems.swap(this.filterPos, greaterIdx);
			//now filter child
			this.filterPos = greaterIdx;
			filtered = true;
		}
		//check
		let a = this.elems.arr;
		if (((fp * 2 + 1) < this.heapSize && a[fp] < a[fp * 2 + 1]) || ((fp * 2 + 2) < this.heapSize && a[fp] < a[fp * 2 + 2])) {
			console.error(`INVALID HEAP index ${fp} : ${a[fp]} => ${a[fp * 2 + 1]}, ${a[fp * 2 + 2]}`);
			console.log({
				parent,
				c1,
				c2,
				greater,
				greaterIdx
			});
			debugger;
		}
		return filtered;
	}
	getComplete() {
		return this.heapSize <= 0;
	}
	verifyMaxHeap() {
		let a = this.elems.arr;
		for (let i = 0; i < this.heapSize; i++) {
			let p = a[i];
			let childIdx = i * 2 + 1;
			let c1, c2;
			c1 = a[childIdx];
			c2 = a[childIdx + 1];
			if (c1 > p && c2 > p) {
				console.error(`INVALID HEAP index ${i} : ${p} => ${c1}, ${c2}`);
				debugger;
			}
		}
	}
	setOpt(key, val) {}
}
Algorithms.push({
	name: "heapsort",
	constructor: HeapSort,
});