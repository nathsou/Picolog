export type Maybe<T> = T | undefined;

export const isSome = <T>(opt: Maybe<T>): opt is T => {
    return opt !== undefined;
};

export const isNone = <T>(opt: Maybe<T>): opt is undefined => {
    return opt === undefined;
};

export const None = undefined;
export const Some = <T>(x: T): T => x;
