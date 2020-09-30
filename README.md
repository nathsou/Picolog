# Picolog

## Minimalistic prolog interpreter

Picolog provides a minimal prolog
interpreter implementation that can be embedded in other js/ts/node/deno projects to perform logical computations.

### Usage

To use launch the REPL:
```bash
$ deno run --allow-read --allow-env --unstable repl/Repl.ts src.pl
```

To embed in a project :

```typescript
import {
    resolve, parse, program, query,
    isOk, formatComputedAnswer
} from './src/Lib.ts';

const prog = parse([
    'member(X, [X|_]).',
    'member(X, [_|T]) :- member(X, T).'
].join('\n'), program);

const goals = parse('member(M, [1, 2, 3]).', query);

if (isOk(prog) && isOk(goals)) {
    // iterator of all solutions
    const solutions = resolve(prog.value, goals.value);

    for (const answer of solutions) {
        // answer maps free variables from the query
        // to values satisfying the rules
        console.log(formatComputedAnswer(answer));
    }
    // output:
    // M = 1
    // M = 2
    // M = 3
}
```

### Todo

- [] support the cut operator
- [] support arithmetic expressions
- [] add modules
- [] add a trace mode
- [] compile to TRSs for better performance ?