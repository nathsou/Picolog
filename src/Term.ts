/**
 * the type of variables
 */
export type Var = string;

/**
 * the type of functors
 */
export type Fun = { name: string; args: Term[] };

/**
 * a term is either a variable or a functor
 */
export type Term = Var | Fun;

/**
 * checks wether t is a variable
 */
export function isVar(t: Term): t is Var {
	return typeof t === 'string';
}

/**
 * checks wether t is a functor
 */
export function isFun(t: Term): t is Fun {
	return typeof t === 'object';
}

/**
 * constructs a variable
 */
export const varOf = (x: string): Var => x;

/**
 * constructs a functor
 */
export const funOf = (name: string, args: Term[] = []): Fun => ({ name, args });

type ListType = FullList | ConsList;

type ConsList = {
	type: 'cons',
	heads: Term[],
	tail: Term
};

type FullList = {
	type: 'full',
	values: Term[]
};

const showList = (lst: ListType): string => {
	if (lst.type === 'cons') {
		return `[${lst.heads.map(showTerm).join(', ')}|${showTerm(lst.tail)}]`;
	}

	return `[${lst.values.map(showTerm).join(', ')}]`;
};

const asList = (lst: Fun, acc: Term[] = []): ListType => {
	if (lst.name === 'nil') return { type: 'full', values: acc };
	if (lst.name !== '.' || lst.args.length !== 2) {
		throw new Error(`invalid list, expected ./2 or nil/1, got ${JSON.stringify(lst)}`);
	}

	const [t, tl] = lst.args;
	acc.push(t);

	if (!isFun(tl)) {
		return { type: 'cons', heads: acc, tail: tl };
	}

	return asList(tl, acc);
};

/**
 * formats t into a string
 */
export const showTerm = (t: Term): string => {
	if (isVar(t)) return t;
	if (t.name === 'nil') return '[]';
	if (t.args.length === 0) return t.name;
	if (t.name === '.') return showList(asList(t));
	return `${t.name}(${t.args.map(showTerm).join(", ")})`;
};

/**
 * returns the set of variables occuring in t
 */
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

/**
 * creates a new term by applying f to every variables occurring in t
 */
export const mapVars = (t: Term, f: (x: Var) => Term): Term => {
	if (isVar(t)) return f(t);
	return funOf(t.name, t.args.map(s => mapVars(s, f)));
};

/**
 * checks wether two terms are syntactically equal
 */
export const termsEq = (s: Term, t: Term): boolean => {
	if (isFun(s) && isFun(t)) {
		return s.name === t.name &&
			s.args.length === t.args.length &&
			s.args.every((arg, idx) => termsEq(arg, t.args[idx]));
	}

	return s === t;
};