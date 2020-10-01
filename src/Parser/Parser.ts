import { isSome, Maybe } from "../Maybe.ts";
import { bind, error, isError, isOk, ok, Result, mapResult } from "../Result.ts";
import { groupByHead, Rule, ruleOf } from "../Rule.ts";
import { Fun, funOf, Term, varOf } from "../Term.ts";
import { lex, LexerError } from "./Lexer.ts";
import { showPosition, showToken, Token } from "./Token.ts";

/**
 * type returned when parsing is unsuccessful
 */
export type ParserError = string;

/**
 * A parser is a function attempting to match a pattern in
 * the tokens given as input
 * 
 * parsers are not pure functions, the state's current token
 * position is mutated
 * @param T the type returned when parsing is successfull
 */
export type Parser<T> = (state: ParserState) => Result<T, ParserError>;

/**
 * the state used by parsers
 * it consists of an immutable array of tokens
 * along with a mutable index indicating
 * the current position into that array
 */
interface ParserState {
    readonly tokens: Token[];
    pos: number;
}

const advance = (state: ParserState): void => {
    state.pos++;
};

const current = ({ tokens, pos }: ParserState): Maybe<Token> => {
    return tokens[pos];
};

const then = <A, B>(a: Parser<A>, b: Parser<B>): Parser<[A, B]> => state => {
    return bind(a(state), resA => bind(b(state), resB => ok([resA, resB])));
};

const alt = <T>(a: Parser<T>, b: Parser<T>): Parser<T> => state => {
    const { pos } = state;
    const resA = a(state);
    if (isOk(resA)) {
        return resA;
    }

    state.pos = pos;
    return b(state);
};

const map = <A, B>(p: Parser<A>, f: (v: A) => B): Parser<B> => {
    return state => bind(p(state), v => ok(f(v)));
};

const many = <T>(p: Parser<T>): Parser<T[]> => state => {
    const values: T[] = [];

    let res = p(state);

    while (isOk(res)) {
        values.push(res.value);
        res = p(state);
    }

    return ok(values);
};

/**
 * formats a token for debugging
 * @param t the token to format
 */
export const formatToken = (t: Maybe<Token>): string => {
    if (isSome(t)) {
        return `'${showToken(t)}' at ${showPosition(t)}`;
    }

    return 'invalid token';
};

/**
 * parses a single token of the specified type
 * @param type the type of token to be parsed
 */
const token = (type: Token['type']): Parser<Token> => {
    return state => {
        const tok = current(state);
        if (tok?.type === type) {
            advance(state);
            return ok(tok);
        }

        return error(`expected token of type "${type}"`);
    };
};

/**
 * parses a value surrounded by parentheses
 * @param p the parser matching the value between the parentheses
 */
const parens = <T>(p: Parser<T>): Parser<T> => {
    return map(then(token('lparen'), then(p, token('rparen'))), ([_l, [res, _r]]) => res);
};

/**
 * parses a value surrounded by square brackets
 * @param p the parser matching the value between the square brackets
 */
const brackets = <T>(p: Parser<T>): Parser<T> => {
    return map(then(token('lbracket'), then(p, token('rbracket'))), ([_l, [res, _r]]) => res);
};

/**
 * parses a list of values separated by commas
 * @param p the parser matching comma separated values
 */
const commas = <T>(p: Parser<T>): Parser<T[]> => {
    return state => {
        const values: T[] = [];
        let first = true;

        do {
            if (!first) {
                advance(state);
            } else {
                first = false;
            }

            const res = p(state);
            if (isError(res)) {
                return res;
            } else {
                values.push(res.value);
            }
        } while (current(state)?.type === "comma");

        return ok(values);
    };
};

// desugar lists
const termOfList = (ts: Term[], lastElemIsTail = false): Term => {
    if (ts.length === 0) return funOf('nil');
    if (ts.length === 1 && lastElemIsTail) return ts[0];
    return funOf('.', [ts[0], termOfList(ts.slice(1), lastElemIsTail)]);
};

const list: Parser<Term> = alt(
    alt(
        map(then(token('lbracket'), token('rbracket')), () => funOf('nil')),
        map(brackets(commas(term)), termOfList),
    ),
    map(brackets(then(commas(term), then(token('pipe'), term))), ([xs, [_, tl]]) => termOfList([...xs, tl], true)),
);

/**
 * parses a prolog term, can be used with the `parse` function
 */
export function term(state: ParserState): Result<Term, ParserError> {
    const tok = current(state);

    if (tok?.type === "variable") {
        advance(state);
        return ok(varOf(tok.name));
    }

    return alt(functor, list)(state);
}

/**
 * parses a prolog non-variable term, can be used with the `parse` function
 */
export const functor: Parser<Fun> = state => {
    const tok = current(state);

    if (tok?.type === "functor") {
        advance(state);
        const f = tok.name;
        if (current(state)?.type !== "lparen") {
            // nullary symbol
            return ok(funOf(f));
        } else {
            // compound term
            return map(parens(commas(term)), args => funOf(f, args))(state);
        }
    }

    return error(`expected a functor, got ${formatToken(current(state))}`);
};

/**
 * parses a prolog rule, can be used with the `parse` function
 */
export const rule: Parser<Rule> = state =>
    bind(functor(state), (head) => {
        if (current(state)?.type === "leftarrow") {
            return bind(token("leftarrow")(state), () =>
                bind(commas(term)(state), (args) =>
                    bind(token("dot")(state), () => ok(ruleOf(head, args)))
                )
            );
        } else {
            return bind(token("dot")(state), () => ok(ruleOf(head, [])));
        }
    });

/**
 * parses a list of rules 
 */
export const rules = many(rule);

/**
 * parses a prolog program
 */
export const program = map(rules, groupByHead);

/**
 * parses a prolog query, can be used with the `parse` function
 * a query is a comma-separated list of functors followed by a dot
 */
export const query: Parser<Fun[]> = map(then(commas(functor), token('dot')), ([qs, _]) => qs);

/**
 * utility function to parse an input string with the given parser
 * it handles the tokenization and the creation of an internal state
 * and attempts to process the entire input
 * @param input the string to parse
 * @param parser the parser to use
 */
export const parse = <T>(
    input: string,
    parser: Parser<T>
): Result<T, ParserError | LexerError> => {
    return bind(mapResult([...lex(input)], x => x), tokens => {
        const state = { tokens, pos: 0 };
        const res = parser(state);
        if (state.pos !== state.tokens.length) {
            return error(`Unexpected token: ${formatToken(state.tokens[state.pos])}`);
        }

        return res;
    });
};
