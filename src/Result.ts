export type Result<T, E> = Ok<T> | Error<E>;
export type Ok<T> = { type: "ok", value: T };
export type Error<E> = { type: "error", value: E };

export const ok = <T>(value: T): Ok<T> => ({ type: "ok", value });
export const error = <E>(value: E): Error<E> => ({
    type: "error",
    value
});

export const isOk = <T, E>(res: Result<T, E>): res is Ok<T> =>
    res.type === "ok";

export const isError = <T, E>(res: Result<T, E>): res is Error<E> =>
    res.type === "error";


// bind for the Result Monad
export const bind = <A, B, E>(res: Result<A, E>, f: (val: A) => Result<B, E>): Result<B, E> => {
    if (isError(res)) return res;
    return f(res.value);
};

export const mapResult = <A, B, E>(as: Result<A, E>[], f: (a: A) => B): Result<B[], E> => {
    const bs: B[] = [];

    for (const val of as) {
        if (isError(val)) return val;
        bs.push(f(val.value));
    }

    return ok(bs);
};

export const okOrThrow = <T, E extends string>(res: Result<T, E>): T => {
    if (isError(res)) {
        throw new Error(res.value);
    }

    return res.value;
};