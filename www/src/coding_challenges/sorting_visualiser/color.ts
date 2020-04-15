type ColorFunction = (ctx: p5, val: number, r: boolean, w: boolean) => p5.Color;
interface _ColorScheme {
	name: string,
		fxn: ColorFunction;
}

let Colors: _ColorScheme[] = [];