# Picolog

## Minimalistic prolog interpreter

Picolog provides a minimal prolog
interpreter implementation that can be embedded in other js/ts/node/deno projects to perform logical computations.

### Usage

To launch the REPL:
```bash
$ deno run --allow-read --allow-env --unstable repl/Repl.ts src.pl
```
the --unstable flag is needed since Deno.setRaw (used by the REPL) is a new API.

To embed in a project :

```typescript
import {
    resolve, parse, program, query,
    isOk, formatComputedAnswer
} from './src/Lib.ts';

const prog = parse(`
    append([], Bs, Bs).
    append([A|As], Bs, [A|ABs]) :- append(As, Bs, ABs).
`, program);

const goals = parse('append(A, [4, 5, 6], [1, 2, 3, 4, 5, 6]).', query);

if (isOk(prog) && isOk(goals)) {
    // iterator of all solutions
    const solutions = resolve(prog.value, goals.value);

    for (const answer of solutions) {
        // answer maps free variables from the query
        // to values satisfying the rules
        console.log(formatComputedAnswer(answer));
    }
    // output:
    // A = [1, 2, 3]
}
```

### Todo

- [ ] support the cut operator
- [ ] support arithmetic expressions
- [ ] add modules
- [ ] add a trace mode
- [ ] compile to WAM for better performance?
