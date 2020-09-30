import { parse, ParserError, query, rules } from "../src/Parser/Parser.ts";
import { formatComputedAnswer, resolve } from "../src/Resolution.ts";
import { bind, isError, ok, okOrThrow, Result } from "../src/Result.ts";
import { groupByHead, Prog } from "../src/Rule.ts";
import type { Fun } from "../src/Term.ts";
import { TTYManager } from "./TTYManager.ts";

const printUsage = () => {
    console.info(`usage: picolog src.pl`);
    Deno.exit();
};

const parseProg = (src: string): Result<Prog, ParserError> => {
    return bind(parse(src, rules), rs => ok(groupByHead(rs)));
};

const parseQuery = (q: string): Result<Fun[], ParserError> => parse(q, query);

async function writeln(msg: string): Promise<void> {
    await Deno.write(Deno.stdin.rid, new TextEncoder().encode(msg + '\n'));
}

const repl = async (prog: Prog): Promise<void> => {
    const tty = new TTYManager();

    while (true) {
        const q = parseQuery(await tty.prompt('?- '));
        if (isError(q)) {
            await writeln(`could not parse query: ${q.value}`);
            continue;
        }

        let foundAnswer = false;
        const answers = resolve(prog, q.value)[Symbol.iterator]();
        let next = answers.next();

        while (!next.done) {
            foundAnswer = true;
            const out = formatComputedAnswer(next.value);
            await writeln(out + '\n');
            if (out === 'true.') break;

            // look for more answers
            const searchMore = await tty.expect(k => k.sequence === ';');
            if (!searchMore) break;
            next = answers.next();
        }

        if (!foundAnswer) {
            await writeln('false.');
        }
    }
};

const enterRepl = (path: string): void => {
    const contents = new TextDecoder("utf-8").decode(Deno.readFileSync(path));
    const prog = okOrThrow(parseProg(contents));
    repl(prog);
};

if (Deno.args.length !== 1) {
    printUsage();
} else {
    const [path] = Deno.args;
    enterRepl(path);
}