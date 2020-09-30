
last(X, [X]).
last(X, [_|TL]) :- last(X, TL).

length(0, []).
length(s(L), [_|TL]) :- length(L, TL).

second_to_last(X, [X|[_]]).
second_to_last(X, [_|TL]) :- second_to_last(X, TL).

nth(X, [X|_], 0).
nth(X, [_|TL], s(N)) :- nth(X, TL, N).

reverse(R, [], R).
reverse(R, [H|TL], Acc) :- reverse(R, TL, [H|Acc]).
reverse(R, L) :- reverse(R, L, []).

member(X, [X|_]).
member(X, [_|TL]) :- member(X, TL).