
only(_, []).
only(X, [X|T]) :- only(X, T).

all_same([]).
all_same([X|T]) :- only(X, T).

len(0, []).
len(s(L), [_|TL]) :- len(L, TL).

digit(0).
digit(1).

digits([]).
digits([H|T]) :- digit(H), digits(T).

lss(0, s(_)).
lss(s(A), s(B)) :- lss(A, B).

binary(Len, Num) :- len(Len, Num), digits(Num).

% count in binary:
% binary(Len, B).