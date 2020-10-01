import { Fun, funOf, isVar, showTerm, Term, Var } from "./Term.ts";

/**
 * the type representing prolog rules
 * every rule has a non-variable head and a
 * body made out of a conjunction of terms
 * 
 * facts are simply rules with an empty body 
 */
export type Rule = [head: Fun, body: Term[]];

/**
 * formats a rule into a string
 */
export const showRule = ([head, body]: Rule) => {
    if (body.length === 0) return showTerm(head) + ".";
    return `${showTerm(head)} :- ${body.map(showTerm).join(", ")}.`;
};

/**
 * retrieves the name of a given rule
 */
export const ruleName = ([lhs, _]: Rule): string => lhs.name;

/**
 * constructs a rule from a given head and body
 */
export const ruleOf = (head: Fun, body: Term[]): Rule => [head, body];

/**
 * a picolog program is a mapping between predicate names and rules
 */
export type Prog = Map<string, Rule[]>;

/**
 * creates a program from a list of rules
 * by grouping rules with the same predicate name together
 */
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

/**
 * renames variables occuring in a term by adding a suffix
 */
export function renameVars(x: Var, suffix: string): Var;
export function renameVars(f: Fun, suffix: string): Fun;
export function renameVars(t: Term, suffix: string): Term;
export function renameVars(t: Term, suffix: string): Term {
    if (isVar(t)) return `${t}_${suffix}`;
    return funOf(
        t.name,
        t.args.map(arg => renameVars(arg, suffix))
    );
}