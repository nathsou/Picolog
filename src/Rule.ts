import { Fun, funOf, isVar, showTerm, Term, Var } from "./Term.ts";

export type Rule = [head: Fun, body: Term[]];

export const showRule = ([head, body]: Rule) => {
    if (body.length === 0) return showTerm(head) + ".";
    return `${showTerm(head)} :- ${body.map(showTerm).join(", ")}.`;
};

export const ruleName = ([lhs, _]: Rule): string => lhs.name;

export const ruleOf = (head: Fun, body: Term[]): Rule => [head, body];

export type Prog = Map<string, Rule[]>;

export const groupByHead = (rules: Rule[]): Prog => {
    const heads: Prog = new Map();

    for (const rule of rules) {
        const f = ruleName(rule);

        if (!heads.has(f)) {
            heads.set(f, []);
        }

        heads.get(f)?.push(rule);
    }

    return heads;
};

export function renameVars(x: Var, suffix: string): Var;
export function renameVars(f: Fun, suffix: string): Fun;
export function renameVars(t: Term, suffix: string): Term;
export function renameVars(t: Term, suffix: string): Term {
    if (isVar(t)) return `${t}_${suffix}`;
    return funOf(
        t.name,
        t.args.map((arg) => renameVars(arg, suffix))
    );
}

export const renameProg = (prog: Prog): Prog => {
    const newProg: Prog = new Map();

    for (const [f, rules] of prog.entries()) {
        newProg.set(
            f,
            rules.map(([head, body], idx) => {
                const suffix = `${f}${idx}`;
                return ruleOf(
                    renameVars(head, suffix),
                    body.map(a => renameVars(a, suffix))
                );
            })
        );
    }

    return newProg;
};
