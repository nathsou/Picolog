import type { Maybe } from "./Maybe.ts";
import { Prog, renameVars, Rule } from "./Rule.ts";
import { cloneTerm, Fun } from './Term.ts';
import { showTerm, vars } from "./Term.ts";
import {
    Subst,
    substEq,
    substitute,
    substituteMut,
    unify
} from "./Unification.ts";

type Choice = {
    goals: Fun[],
    nextRuleIndex: number,
    unifiersCount: number
};

type MatchingRule = {
    subst: Subst,
    ruleIndex: number,
    body: Fun[]
};

const findMatchingRule = (
    goal: Fun,
    rules: Rule[],
    depth: number,
    nextRuleIndex: number
): Maybe<MatchingRule> => {
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

const trace = (
    rules: Rule[],
    depth: number,
    { ruleIndex, subst, body }: MatchingRule
) => {
    const head = showTerm(
        substitute(
            renameVars(rules[ruleIndex][0], (depth - 1).toString()),
            subst
        )
    );

    console.log(head + (body.length > 0 ? ` :- ${body.map(t => showTerm(substitute(t, subst))).join(', ')}.` : '.'));
};

const resolveNext = (
    prog: Prog,
    goals: Fun[],
    nextRuleIndex: number,
    choices: Choice[],
    unifiers: Subst[],
    cutStack: number[],
    traceMode = false
): boolean => {
    let firstIter = true;

    while (goals.length > 0) {
        const goal = goals.pop() as Fun;
        const parentChoicesCount = cutStack.pop() as number;

        if (goal.name === '!') { // cut
            // only remove choices made in the parent call
            trimArray(choices, parentChoicesCount);
            continue;
        } else if (goal.name === 'true') {
            continue;
        }

        const rules = prog.get(goal.name) ?? [];
        const res = findMatchingRule(
            goal,
            rules,
            unifiers.length,
            firstIter ? nextRuleIndex : 0
        );

        firstIter = false;

        if (res) {
            unifiers.push(res.subst);

            if (traceMode) {
                trace(rules, unifiers.length, res);
            }

            // put current number of choices for each direct subgoal on the cut stack
            // so that cuts only remove choices made by subgoals
            for (let i = 0; i < res.body.length; i++) {
                cutStack.push(choices.length);
            }

            // if another rule could have been selected
            if (res.ruleIndex < rules.length - 1) {
                choices.push({
                    goals: [...goals, goal].map(g => cloneTerm(g)),
                    unifiersCount: unifiers.length,
                    nextRuleIndex: res.ruleIndex + 1
                });
            }

            // add the new subgoals
            for (let i = res.body.length - 1; i >= 0; i--) {
                goals.push(res.body[i]);
            }

            // apply the unifier to all remaining goals
            for (let i = 0; i < goals.length; i++) {
                goals[i] = substituteMut(goals[i], res.subst);
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

/**
 * resolves goals using the given program  
 * @param prog The program to use
 * @param goals The list of goals to solve
 * @returns An iterator over all solutions
 */
export function* resolve(prog: Prog, goals: Fun[]): Iterable<Subst> {
    // variables occuring in the query
    const queryVars = [...goals.reduce((vs, g) => vars(g, vs), new Set<string>())];

    const answers: Subst[] = [];
    const unifiers: Subst[] = [];

    // start the search at the root of the proof tree
    // goals are in reverse order for O(1) append
    const choices: Choice[] = [{ goals: [...goals].reverse(), unifiersCount: 0, nextRuleIndex: 0 }];

    // keep backtracking until a solution is found
    while (choices.length > 0) {
        const { goals, nextRuleIndex, unifiersCount } = choices.pop() as Choice;
        // only keep unifiers that haven't been ruled out yet
        trimArray(unifiers, unifiersCount);

        const succeeded = resolveNext(
            prog,
            goals,
            nextRuleIndex,
            choices,
            unifiers,
            [0]
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

/**
 * formats a substitution to a representation that can be displayed in a REPL
 * @param ans the computed answer to display (generated by resolve)
 */
export const formatAnswer = (ans: Subst): string => {
    const entries = Object.entries(ans);
    if (entries.length === 0) return 'true.';

    return entries.map(([x, val]) => `${x} = ${showTerm(val)}`).join('\n');
};