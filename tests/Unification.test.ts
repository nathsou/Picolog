import { assert } from "https://deno.land/std@0.71.0/testing/asserts.ts";
import { isSome } from "../src/Maybe.ts";
import { functor, parse, term } from "../src/Parser/Parser.ts";
import { okOrThrow } from "../src/Result.ts";
import { Fun } from "../src/Term.ts";
import { Subst, substEq, unify } from "../src/Unification.ts";

const substOf = (bindings: { [key: string]: string }): Subst => {
    let sig: Subst = {};

    for (const [x, t] of Object.entries(bindings)) {
        sig[x] = okOrThrow(parse(t, term));
    }

    return sig;
};

Deno.test('unify', () => {
    const tests: Array<[Fun, Fun, Subst]> = [
        [
            'reverse(R, [], R)',
            'reverse([1, 2, 3], TL3, [H3, H2, H1])',
            { R: '[H3, H2, H1]', TL3: '[]', H1: '3', H2: '2', H3: '1' }
        ]
    ].map(([s, t, sig]) => [
        okOrThrow(parse(s as string, functor)),
        okOrThrow(parse(t as string, functor)),
        substOf(sig as { [key: string]: string })
    ]);

    for (const [s, t, sig] of tests) {
        const unifier = unify(s, t);
        assert(isSome(unifier));
        assert(substEq(unifier, sig));
    }
});