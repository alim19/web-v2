enum ShellSortGapSequence {
	CURIA,
	TODUKA,
	POW2,
}

const GapSequence: number[][] = [];
GapSequence[ShellSortGapSequence.CURIA] = [701, 301, 132, 57, 23, 10, 4, 1];
GapSequence[ShellSortGapSequence.TODUKA] = [1182, 525, 233, 103, 46, 20, 9, 4, 1];
GapSequence[ShellSortGapSequence.POW2] = [1023, 511, 255, 127, 63, 31, 15, 7, 3, 1];


class ShellSort extends Algorithm {
	gs: ShellSortGapSequence = ShellSortGapSequence.CURIA;
	gapIdx: number = -1;
	iterIdx: number = 0;
	iterGapIdx: number = 0;
	temp: number;
	get gap() {
		return this.gaps[this.gapIdx];
	}

	get gaps() {
		return GapSequence[this.gs];
	}

	sortIteration() {
		if (this.iterIdx == 0) {
			this.gapIdx++;
			this.iterIdx = this.gap;
		} else if (this.iterIdx >= this.elems.length) {
			this.iterIdx = 0;
		} else {
			if (this.iterGapIdx == 0) {
				this.temp = this.elems.get(this.iterIdx);
				this.iterGapIdx = this.iterIdx;
			} else if ((this.iterGapIdx >= this.gap) && (this.elems.get(this.iterGapIdx - this.gap) > this.temp)) {
				this.elems.swap(this.iterGapIdx, this.iterGapIdx - this.gap);
				this.iterGapIdx -= this.gap;
			} else {
				this.iterGapIdx = 0;
				this.iterIdx++;
			}
		}

	}

	getComplete(): boolean {

		return this.gapIdx >= this.gaps.length;
	}

	setOpt(key: string, val: any) {
		switch (key) {
			case "gap_sequence":
				this.gs = val;
				break;
		}
	}
}

Algorithms.push({
	name: "shellsort",
	constructor: ShellSort,
	opts: {
		"gap_sequence": [
			["curia", ShellSortGapSequence.CURIA],
			["toduka", ShellSortGapSequence.TODUKA],
			["power 2", ShellSortGapSequence.POW2]
		]
	}
})