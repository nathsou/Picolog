export type Var = string;
export type Fun = { name: string; args: Term[] };
export type Term = Var | Fun;

export function isVar(t: Term): t is Var {
	return typeof t === 'string';
}

export function isFun(t: Term): t is Fun {
	return typeof t === 'object';
}

// constructors
export const varOf = (x: string): Var => x;
export const funOf = (name: string, args: Term[] = []): Fun => ({ name, args });

const showList = (ts: Term[]): string => {
	return `[${ts.map(showTerm).join(', ')}]`;
};

const asList = (lst: Fun, acc: Term[] = []): Term[] => {
	if (lst.name === 'nil') return acc;
	if (lst.name !== '.' || lst.args.length !== 2 || !isFun(lst.args[1])) {
		throw new Error(`invalid list, expected ./2 or nil/1 after ${showList(acc)}`);
	}

	const [t, tl] = lst.args;
	acc.push(t);
	return asList(tl, acc);
};

export const showTerm = (t: Term): string => {
	if (isVar(t)) return t;
	if (t.args.length === 0) return t.name;
	if (t.name === 'nil') return '[]';
	if (t.name === '.') return showList(asList(t));
	return `${t.name}(${t.args.map(showTerm).join(", ")})`;
};

export const vars = (t: Term, acc = new Set<Var>()): Set<Var> => {
	if (isVar(t)) {
		acc.add(t);
		return acc;
	}

	for (const arg of t.args) {
		vars(arg, acc);
	}

	return acc;
};

export const mapVars = (t: Term, f: (x: Var) => Term): Term => {
	if (isVar(t)) return f(t);
	return funOf(t.name, t.args.map(s => mapVars(s, f)));
};

export const termsEq = (s: Term, t: Term): boolean => {
	if (isFun(s) && isFun(t)) {
		return s.name === t.name &&
			s.args.length === t.args.length &&
			s.args.every((arg, idx) => termsEq(arg, t.args[idx]));
	}

	return s === t;
};