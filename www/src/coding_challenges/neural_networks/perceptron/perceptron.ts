type ActivationFxn = (n: number) => number;

class Perceptron {
	protected _nInputs: number;
	protected _weights: number[];
	protected _bias: number;
	protected _afn: ActivationFxn;
	protected readonly _lr = 0.0001;
	constructor(nInputs: number, activFn: ActivationFxn) {
		this._nInputs = nInputs;
		this._weights = [];
		for (let i = 0; i < this._nInputs; i++)
			this._weights[i] = Math.random() * 2 - 1;
		this._bias = Math.random() * 2 - 1;
		this._afn = activFn;
	}

	predict(input: number[]): number {
		let sum = 0;
		for (let i = 0; i < this._weights.length; i++) {
			const element = this._weights[i];
			sum += input[i] * element;
		}
		return this._afn(sum + this._bias);
	}

	train(input: number[], output: number) {
		let out = this.predict(input);
		let err = Math.pow((out - output), 2) * (out - output > 0 ? 1 : -1);
		//bias
		//weights
		for (let i = 0; i < this._nInputs; i++) {
			this._weights[i] -= input[i] * err * this._lr;
		}
		this._bias -= err * this._lr;
	}

	get weights() {
		return this._weights;
	}
	get bias() {
		return this._bias;
	}
}