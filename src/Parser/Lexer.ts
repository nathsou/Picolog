import { isNone, Maybe } from "../Maybe.ts";
import { error, ok, Result } from "../Result.ts";
import { Position, showPosition, SingleCharToken, Token } from "./Token.ts";

const singleCharTokens = new Map<string, SingleCharToken['type']>([
    ['(', 'lparen'],
    [')', 'rparen'],
    ['[', 'lbracket'],
    [']', 'rbracket'],
    ['.', 'dot'],
    ['|', 'pipe'],
    [',', 'comma']
]);

export type LexerError = string;

export function* lex(input: string): Iterable<Result<Token, LexerError>> {
    let offset = 0;
    let pos: Position = { line: 1, column: 1 };

    const advance = () => {
        if (current() === '\n') {
            pos.line++;
            pos.column = 1;
        } else {
            pos.column++;
        }

        offset++;
    };

    const current = (): Maybe<string> => input[offset];

    const skipSpaces = () => {
        while (offset < input.length && [' ', '\n', '\r', '\t'].includes(current() ?? '')) {
            advance();
        }
    };

    while (offset < input.length) {
        skipSpaces();

        const cur = current();
        if (isNone(cur)) break;

        if (singleCharTokens.has(cur)) {
            const type = singleCharTokens.get(cur) as SingleCharToken['type'];
            yield ok({ type, ...pos });
            advance();
            continue;
        }

        if (cur === ':') {
            advance();
            if (current() === '-') {
                yield ok({ type: "leftarrow", ...pos });
                advance();
                continue;
            }
        }

        if (/[A-Z_]/.test(cur)) {
            let varName = '';
            do {
                varName += current();
                advance();
            } while (/[a-zA-Z0-9_]/.test(current() ?? ''));

            if (varName === '_') {
                varName = `__${pos.line}_${pos.column}`;
            }

            yield ok({ type: 'variable', name: varName, ...pos });
            continue;
        }

        if (/[a-z0-9]/.test(cur)) {
            let f = '';
            do {
                f += current();
                advance();
            } while (/[a-zA-Z0-9_]/.test(current() ?? ''));

            yield ok({ type: 'functor', name: f, ...pos });
            continue;
        }

        // skip comments
        if (current() === '%') {
            do {
                advance();
            } while (offset < input.length && current() !== '\n');
            continue;
        }

        yield error(`Unrecognized token near "${input.substr(offset, 10)}", at ${showPosition(pos)}`);
        return;
    }
};