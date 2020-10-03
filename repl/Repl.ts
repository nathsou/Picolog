import type { LexerError } from "../src/Parser/Lexer.ts";
import { parse, ParserError, program, query } from "../src/Parser/Parser.ts";
import { formatAnswer, resolve } from "../src/Resolution.ts";
import { isError, okOrThrow, Result } from "../src/Result.ts";
import type { Prog } from "../src/Rule.ts";
import type { Fun } from "../src/Term.ts";
import { TTYManager } from "./TTYManager.ts";
import { red, bold } from "https://deno.land/std@0.71.0/fmt/colors.ts";

const printUsage = () => {
    console.info(`usage: picolog src.pl [query]`);
    Deno.exit();
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
            const out = formatAnswer(next.value);
            await writeln(out === 'true.' ? bold(out) : out);
            if (out === 'true.') break;

            // look for more answers
            const searchMore = await tty.expect(k => k.sequence === ';');
            if (!searchMore) break;
            next = answers.next();
        }

        if (!foundAnswer) {
            await writeln(bold(red('false.')));
        }
    }
};

const parseProgram = (path: string): Result<Prog, ParserError | LexerError> => {
    const contents = new TextDecoder('utf-8').decode(Deno.readFileSync(path));
    return parse(contents, program);
};

const enterRepl = (path: string): void => {
    repl(okOrThrow(parseProgram(path)));
};

const runQuery = (path: string, query: string): void => {
    const prog = okOrThrow(parseProgram(path));
    const q = okOrThrow(parseQuery(query));
    const solutions = resolve(prog, q)[Symbol.iterator]();
    console.log(formatAnswer(solutions.next().value));
};

switch (Deno.args.length) {
    case 1:
        {
            const [path] = Deno.args;
            enterRepl(path);
            break;
        }
    case 2:
        {
            const [path, query] = Deno.args;
            runQuery(path, query);
            break;
        }
    default:
        printUsage();
        break;
}