import { assertEquals } from "https://deno.land/std@0.92.0/testing/asserts.ts";
import { parse, program, query } from "../src/Parser/Parser.ts";
import { formatAnswer, resolve } from "../src/Resolution.ts";
import { okOrThrow } from "../src/Result.ts";
import type { Prog } from "../src/Rule.ts";
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

const runSuite = (prog: Prog, tests: Array<[string, string[]]>): void => {
    for (const [q, expected] of tests) {
        const goals = okOrThrow(parse(q, query));
        const results = take(expected.length, resolve(prog, goals)).map(s => formatAnswer(s).split('\n').join(', '));
        if (results.length === 0) {
            assertEquals(expected, ['false.']);
        } else {
            assertEquals(results, expected);
        }
    }
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

    const prog = okOrThrow(parse(peanoRules, program));

    const tests: Array<[string, string[]]> = [];

    for (let a = 0; a < 10; a++) {
        tests.push([`nat(${peano(a)}).`, ['true.']]);
        for (let b = 0; b < 10; b++) {
            tests.push([`plus(${peano(a)}, ${peano(b)}, ${peano(a + b)}).`, ['true.']]);
            tests.push([`mult(${peano(a)}, ${peano(b)}, ${peano(a * b)}).`, ['true.']]);
        }
    }

    tests.push([`plus(${peano(3)}, ${peano(7)}, ${peano(11)}).`, ['false.']]);

    runSuite(prog, tests);
});

Deno.test('reverse', () => {
    const prog = okOrThrow(parse(`
    reverse(R, [], R).
    reverse(R, [H|TL], Acc) :- reverse(R, TL, [H|Acc]).
    reverse(R, L) :- reverse(R, L, []).
`, program));

    const tests: Array<[string, string[]]> = [
        ['reverse(R, [1, 2, 3]).', ['R = [3, 2, 1]']],
        ['reverse([1, 2, 3], R).', ['R = [3, 2, 1]']],
        ['reverse([], []).', ['true.']],
        ['reverse([7, 8, 9], [9, 7, 8]).', ['false.']],
    ];

    runSuite(prog, tests);
});

Deno.test('append', () => {
    const prog = okOrThrow(parse(`
        append([], Bs, Bs).
        append([A|As], Bs, [A|ABs]) :- append(As, Bs, ABs).
`, program));

    const tests: Array<[string, string[]]> = [
        ['append(A, [4, 5, 6], [1, 2, 3, 4, 5, 6]).', ['A = [1, 2, 3]']],
        ['append([1, 2, 3], B, [1, 2, 3, 4, 5, 6]).', ['B = [4, 5, 6]']],
        ['append(A, B, [1, 2, 3]).', [
            'A = [], B = [1, 2, 3]',
            'A = [1], B = [2, 3]',
            'A = [1, 2], B = [3]',
            'A = [1, 2, 3], B = []'
        ]]
    ];

    runSuite(prog, tests);
});

Deno.test('cut', () => {
    const prog = okOrThrow(parse(`
        a(X, Y) :- b(X), !, c(Y).
        b(1).
        b(2).
        b(3).
        
        c(1).
        c(2).
        c(3).
    `, program));

    const tests: Array<[string, string[]]> = [
        ['a(Q, R).', [
            'Q = 1, R = 1',
            'Q = 1, R = 2',
            'Q = 1, R = 3'
        ]]
    ];

    runSuite(prog, tests);
});

Deno.test('not', () => {
    const prog = okOrThrow(parse(`
        not(Goal) :- Goal, !, fail.
        not(_).

        blue(sky).
        blue(sea).
        white(clouds).
        yellow(sun).
`, program));

    const tests: Array<[string, string[]]> = [
        ['not(false).', ['true.']],
        ['not(true).', ['false.']],
        ['not(white(sky)).', ['true.']],
        ['not(blue(sky)).', ['false.']],
    ];

    runSuite(prog, tests);
});

Deno.test('flatten', () => {
    const prog = okOrThrow(parse(`
        is_list([]).
        is_list([_|T]) :- is_list(T).
        
        append([], Bs, Bs).
        append([A|As], Bs, [A|ABs]) :- append(As, Bs, ABs).
        
        not(Goal) :- Goal, !, fail.
        not(_).
        
        flatten(X, [X]) :- not(is_list(X)).
        flatten([], []).
        flatten([As|Bs], Flat) :- flatten(As, As2), flatten(Bs, Bs2), append(As2, Bs2, Flat).
`, program));

    const tests: Array<[string, string[]]> = [
        ['flatten([a], X).', ['X = [a]']],
        ['flatten([a, b], X).', ['X = [a, b]']],
        ['flatten([a, [b]], X).', ['X = [a, b]']],
        ['flatten([[[a]], [[[b]]]], X).', ['X = [a, b]']],
        ['flatten([a, [b, [c, d], e]], X).', ['X = [a, b, c, d, e]']],
        ['flatten([[[a], [[b]]], [[c, [d]], [[[e]]]]], X).', ['X = [a, b, c, d, e]']],
    ];

    runSuite(prog, tests);
});

Deno.test('binary', () => {
    const prog = okOrThrow(parse(`
        digit(0).
        digit(1).
        
        digits([]).
        digits([H|T]) :- digit(H), digits(T).
        
        lss(0, s(_)).
        lss(s(A), s(B)) :- lss(A, B).

        len(0, []).
        len(s(L), [_|TL]) :- len(L, TL).
        
        binary(Len, Num) :- len(Len, Num), digits(Num).
`, program));

    const tests: Array<[string, string[]]> = [
        ['digit(0).', ['true.']],
        ['digit(1).', ['true.']],
        ['digit(2).', ['false.']],
        ['binary(s(s(s(0))), B).', [
            'B = [0, 0, 0]',
            'B = [0, 0, 1]',
            'B = [0, 1, 0]',
            'B = [0, 1, 1]',
            'B = [1, 0, 0]',
            'B = [1, 0, 1]',
            'B = [1, 1, 0]',
            'B = [1, 1, 1]'
        ]],
        ['binary(L, B).', [
            'L = 0, B = []',
            'L = s(0), B = [0]',
            'L = s(0), B = [1]',
            'L = s(s(0)), B = [0, 0]',
            'L = s(s(0)), B = [0, 1]',
            'L = s(s(0)), B = [1, 0]',
            'L = s(s(0)), B = [1, 1]',
            'L = s(s(s(0))), B = [0, 0, 0]',
            'L = s(s(s(0))), B = [0, 0, 1]',
            'L = s(s(s(0))), B = [0, 1, 0]',
            'L = s(s(s(0))), B = [0, 1, 1]',
            'L = s(s(s(0))), B = [1, 0, 0]',
            'L = s(s(s(0))), B = [1, 0, 1]',
            'L = s(s(s(0))), B = [1, 1, 0]',
            'L = s(s(s(0))), B = [1, 1, 1]'
        ]]
    ];

    runSuite(prog, tests);
});