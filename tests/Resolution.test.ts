import { assertEquals } from "https://deno.land/std@0.71.0/testing/asserts.ts";
import { parse, query, rules } from "../src/Parser/Parser.ts";
import { formatComputedAnswer, resolve } from "../src/Resolution.ts";
import { okOrThrow } from "../src/Result.ts";
import { groupByHead } from "../src/Rule.ts";
import { Fun, funOf, showTerm } from "../src/Term.ts";

const take = <T>(count: number, it: Iterable<T>): T[] => {
    if (count === 0) return [];

    const elems: T[] = [];

    for (const elem of it) {
        elems.push(elem);
        if (count === elems.length) break;
    }

    return elems;
};

Deno.test('peano', () => {
    const peanoAux = (n: number): Fun => n === 0 ? funOf('0') : funOf('s', [peanoAux(n - 1)]);
    const peano = (n: number): string => showTerm(peanoAux(n));

    const peanoRules = [
        'nat(0).',
        'nat(s(X)) :- nat(X).',
        'plus(X, 0, X) :- nat(X).',
        'plus(0, Y, Y) :- nat(Y).',
        'plus(s(X), Y, s(Z)) :- plus(X, Y, Z).',
        'plus(X, s(Y), s(Z)) :- plus(X, Y, Z).',
        'minus(X, Y, M) :- plus(M, Y, X).',
        'mult(_, 0, 0).',
        'mult(0, _, 0).',
        'mult(s(X), Y, Z) :- mult(X, Y, Z2), plus(Z2, Y, Z).',
        'mult(X, s(Y), Z) :- mult(X, Y, Z2), plus(Z2, X, Z).'
    ].join('\n');

    const prog = groupByHead(okOrThrow(parse(peanoRules, rules)));

    const tests: Array<[string, string[]]> = [];

    for (let a = 0; a < 10; a++) {
        tests.push([`nat(${peano(a)}).`, ['true.']]);
        for (let b = 0; b < 10; b++) {
            tests.push([`plus(${peano(a)}, ${peano(b)}, ${peano(a + b)}).`, ['true.']]);
            tests.push([`mult(${peano(a)}, ${peano(b)}, ${peano(a * b)}).`, ['true.']]);
        }
    }

    tests.push([`plus(${peano(3)}, ${peano(7)}, ${peano(11)}).`, ['false.']]);

    for (const [q, expected] of tests) {
        const goals = okOrThrow(parse(q, query));
        const results = take(expected.length, resolve(prog, goals)).map(formatComputedAnswer);
        if (results.length === 0) {
            assertEquals(expected, ['false.']);
        } else {
            assertEquals(results, expected);
        }
    }
});