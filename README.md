# Picolog

## Minimalistic prolog interpreter

Picolog provides a minimal prolog
interpreter implementation that can be embedded in other js/ts/node/deno projects to perform logical computations.

### Installation

Picolog is available on [deno.land](https://deno.land/x/pico)

### Usage

See the [documentation](https://doc.deno.land/https/deno.land/x/pico/mod.ts)

To launch the REPL:

```bash
deno run -A --unstable https://deno.land/x/pico/repl/Repl.ts src.pl
```

the --unstable flag is needed since Deno.setRaw (used by the REPL) is a new API.

To embed in a project :

```typescript
import {
    resolve, parse, program, query,
    isOk, formatAnswer
} from 'https://deno.land/x/pico/mod.ts';

const prog = parse(`
    append([], Bs, Bs).
    append([A|As], Bs, [A|ABs]) :- append(As, Bs, ABs).
`, program);

const goals = parse('append(A, B, [1, 2, 3]).', query);

if (isOk(prog) && isOk(goals)) {
    // iterator of all solutions
    const solutions = resolve(prog.value, goals.value);

    for (const answer of solutions) {
        // answer maps free variables from the query
        // to values satisfying the rules
        console.log(formatAnswer(answer));
    }
}

// output:
// A = []
// B = [1, 2, 3]

// A = [1]
// B = [2, 3]

// A = [1, 2]
// B = [3]

// A = [1, 2, 3]
// B = []
```

### Todo

- [x] support the cut operator
- [ ] support arithmetic expressions
- [ ] add modules
- [ ] add a trace mode
- [ ] compile to [WAM](https://www.wikiwand.com/fr/Warren%27s_Abstract_Machine) for better performance?
