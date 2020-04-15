export function WCtoRegex(wildcard: string): RegExp {
	let s = "^";
	for (let i = 0; i < wildcard.length; i++) {
		if (wildcard[i] == '*') {
			if ((i + 1) < wildcard.length && wildcard[i + 1] == '*') {
				s += "[^/]*";
			} else {
				s += ".*";
			}
		} else if (wildcard[i] == '.') {
			s += "\.";
		} else {
			s += wildcard[i];
		}
	}
	s += "$";
	// console.log(s);
	return new RegExp(s);
}