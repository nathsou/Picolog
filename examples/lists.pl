
last(X, [X]).
last(X, [_|TL]) :- last(X, TL).

len(0, []).
len(s(L), [_|TL]) :- len(L, TL).

second_to_last(X, [X|[_]]).
second_to_last(X, [_|TL]) :- second_to_last(X, TL).

nth(X, [X|_], s(0)).
nth(X, [_|TL], s(N)) :- nth(X, TL, N).

reverse(R, [], R).
reverse(R, [H|TL], Acc) :- reverse(R, TL, [H|Acc]).
reverse(R, L) :- reverse(R, L, []).

member(X, [X|_]).
member(X, [_|TL]) :- member(X, TL).

palindrome(L) :- reverse(L, L).

is_list([]).
is_list([_|T]) :- is_list(T).

append([], Bs, Bs).
append([A|As], Bs, [A|ABs]) :- append(As, Bs, ABs).

not(Goal) :- Goal, !, fail.
not(_).

flatten(X, [X]) :- not(is_list(X)).
flatten([], []).
flatten([As|Bs], Flat) :- flatten(As, As2), flatten(Bs, Bs2), append(As2, Bs2, Flat).