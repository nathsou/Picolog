export type Token =
    | SingleCharToken
    | LeftArrow
    | Variable
    | Functor
    | Comment
    | EOF;

export type SingleCharToken =
    | LeftParen
    | RightParen
    | LeftBracket
    | RightBracket
    | Dot
    | Pipe
    | Comma;

export type Position = {
    line: number;
    column: number;
};

type WithPosition<Name extends string, T = {}> = Position & { type: Name } & T;

type LeftParen = WithPosition<"lparen">;
type RightParen = WithPosition<"rparen">;
type LeftBracket = WithPosition<"lbracket">;
type RightBracket = WithPosition<"rbracket">;
type Pipe = WithPosition<"pipe">;
type Dot = WithPosition<"dot">;
type Comma = WithPosition<"comma">;
type LeftArrow = WithPosition<"leftarrow">;

type Variable = WithPosition<"variable", {
    name: string;
}>;

type Functor = WithPosition<"functor", {
    name: string;
}>;

type Comment = WithPosition<"comment", {
    value: string;
}>;

type EOF = WithPosition<"EOF">;

const tokenSymbs = {
    'dot': '.',
    'lparen': '(',
    'rparen': ')',
    'lbracket': '[',
    'rbracket': ']',
    'pipe': '|',
    'comma': ',',
    'leftarrow': ':-',
};

export const showToken = (t: Token): string => {
    switch (t.type) {
        case 'variable':
        case 'functor':
            return t.name;
        case 'comment':
            return `% ${t.value}`;
        case 'EOF':
            return 'eof';
        default:
            return tokenSymbs[t.type];
    }
};

export const showPosition = ({ line, column }: Position) => {
    return `${line}:${column}`;
};