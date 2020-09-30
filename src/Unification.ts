import { Maybe, None } from "./Maybe.ts";
import { Fun, funOf, isVar, showTerm, Term, termsEq, Var } from "./Term.ts";

export type Subst = { [key: string]: Term };

export const substituteMut = (t: Term, sig: Subst): Term => {
    if (isVar(t)) {
        if (sig[t] !== undefined) {
            const t_ = substituteMut(sig[t], sig);
            sig[t] = t_;
            return t_;
        } else {
            return t;
        }
    }

    for (let i = 0; i < t.args.length; i++) {
        t.args[i] = substituteMut(t.args[i], sig);
    }

    return t;
};

export function substitute(x: Var, sig: Subst): Term;
export function substitute(f: Fun, sig: Subst): Fun;
export function substitute(t: Term, sig: Subst): Term;
export function substitute(
    t: Term,
    sig: Subst,
): Term {
    if (isVar(t)) {
        if (sig[t] !== undefined) {
            const t_ = substituteMut(sig[t], sig);
            sig[t] = t_;
            return t_;
        } else {
            return t;
        }
    }

    return funOf(t.name, t.args.map(t => substitute(t, sig)));
}

export const showSubst = (sig: Subst): string => {
    return `{ ${Object.entries(sig).map(([x, t]) => `${x} -> ${showTerm(t)}`).join(", ")
        } }`;
};

const occurs = (x: Var, t: Term): boolean => {
    if (isVar(t)) return x === t;
    return t.args.some(arg => occurs(x, arg));
};

export const unify = (s: Term, t: Term): Maybe<Subst> => unifyMany([[s, t]]);

// iterative version of Martelli & Montanari's unification procedure
const unifyMany = (
    eqs: Array<[Term, Term]>,
): Maybe<Subst> => {
    const sig: Subst = {};

    while (eqs.length > 0) {
        const [s, t] = eqs.pop() as [Term, Term];

        // only possible if s and t are variables
        if (s === t) continue; // delete (variables)

        if (isVar(s)) { // eliminate
            if (occurs(s, t)) return None;

            if (sig[s] !== undefined) { // handle non-linear terms
                if (!termsEq(t, sig[s])) return None;
                continue;
            } else {
                sig[s] = t;
                const theta: Subst = { s: t };
                // apply the substitution to the remaining equations
                for (let i = 0; i < eqs.length; i++) {
                    eqs[i][0] = substituteMut(eqs[i][0], theta);
                    eqs[i][1] = substituteMut(eqs[i][1], theta);
                }

                continue;
            }
        }

        if (isVar(t)) { // orient
            eqs.push([t, s]);
            continue;
        }

        if (s.name === t.name && s.args.length === t.args.length) { // decompose
            for (let i = 0; i < s.args.length; i++) {
                eqs.push([s.args[i], t.args[i]]);
            }

            continue;
        }

        return None;
    }

    return sig;
};

export const substEq = (a: Subst, b: Subst): boolean => {
    const as = Object.keys(a);
    const bs = Object.keys(b);
    if (as.length !== bs.length) return false;

    for (const x of bs) {
        if (!as.includes(x)) return false;
    }

    return as.every(x => termsEq(a[x], b[x]));
};