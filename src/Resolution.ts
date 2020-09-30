import type { Maybe } from "./Maybe.ts";
import { Prog, renameVars, Rule } from "./Rule.ts";
import type { Fun } from './Term.ts';
import { showTerm, vars } from "./Term.ts";
import {
    Subst,
    substEq,
    substitute,
    substituteMut,
    unify
} from "./Unification.ts";

type Choice = {
    goals: Fun[];
    nextRuleIndex: number;
    depth: number;
};

const findMatchingRule = (
    goal: Fun,
    rules: Rule[],
    depth: number,
    nextRuleIndex: number
): Maybe<{ subst: Subst, ruleIndex: number, body: Fun[] }> => {
    for (let ruleIndex = nextRuleIndex; ruleIndex < rules.length; ruleIndex++) {
        const [head, body] = rules[ruleIndex];
        const subst = unify(goal, renameVars(head, `${depth}`));

        if (subst) {
            return {
                subst,
                ruleIndex,
                body: body.map(a => renameVars(a, `${depth}`)) as Fun[]
            };
        }
    }
};

const resolveNext = (
    prog: Prog,
    goals: Fun[],
    depth: number,
    nextRuleIndex: number,
    stack: Choice[],
    unifiers: Subst[]
): boolean => {
    let firstIter = true;

    while (goals.length > 0) {
        const goal = goals.pop() as Fun;
        if (goal.name === 'true') continue;

        const rules = prog.get(goal.name) ?? [];
        const res = findMatchingRule(
            goal,
            rules,
            depth++,
            firstIter ? nextRuleIndex : 0
        );

        firstIter = false;

        if (res) {
            unifiers.push(res.subst);

            // if another rule could have been selected
            if (res.ruleIndex + 1 < rules.length) {
                stack.push({ goals: [goal, ...goals], depth, nextRuleIndex: res.ruleIndex + 1 });
            }

            // add the new subgoals
            for (let i = res.body.length - 1; i >= 0; i--) {
                goals.push(res.body[i]);
            }

            // apply the unifier to all remaining goals
            for (const g of goals) {
                substituteMut(g, res.subst);
            }
        } else {
            return false;
        }
    }

    return true;
};

const mergeUnifiers = (unifiers: Subst[]): Subst => {
    const merged: Subst = {};

    for (const sigma of unifiers) {
        for (const [x, t] of Object.entries(sigma)) {
            merged[x] = t;
        }
    }

    return merged;
};

const trimArray = <T>(arr: T[], length: number): void => {
    for (let i = arr.length - 1; i >= length; i--) {
        arr.pop();
    }
};

export function* resolve(prog: Prog, goals: Fun[]): Iterable<Subst> {
    const queryVars = [
        ...goals.reduce((vs, g) => vars(g, vs), new Set<string>()),
    ];

    const answers: Subst[] = [];

    const unifiers: Subst[] = [];
    // start the search at the root of the proof tree
    const stack: Choice[] = [{ goals, depth: 0, nextRuleIndex: 0 }];

    // keep backtracking until a solution is found
    while (stack.length > 0) {
        const { goals, nextRuleIndex, depth } = stack.pop() as Choice;
        // only keep unifiers that haven't been ruled out yet
        trimArray(unifiers, depth);

        const succeeded = resolveNext(
            prog,
            [...goals].reverse(),
            depth,
            nextRuleIndex,
            stack,
            unifiers
        );

        if (succeeded) {
            const merged = mergeUnifiers(unifiers);

            // only return the values of variables occuring in the query
            const ans = queryVars.reduce((sig, x) => {
                sig[x] = substitute(x, merged);
                return sig;
            }, {} as Subst);

            // check that this solution is different from the previous ones
            if (!answers.some(a => substEq(a, ans))) {
                answers.push(ans);
                yield ans;
            }
        }
    }
}

export const formatComputedAnswer = (ans: Subst): string => {
    const entries = Object.entries(ans);
    if (entries.length === 0) return 'true.';

    return entries.map(([x, val]) => `${x} = ${showTerm(val)}`).join('\n');
};