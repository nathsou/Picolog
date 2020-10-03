letter(a).
letter(b).
letter(c).
letter(d).
letter(e).
letter(f).
letter(g).
letter(h).
letter(i).
letter(j).
letter(k).
letter(l).
letter(m).
letter(n).
letter(o).
letter(p).
letter(q).
letter(r).
letter(s).
letter(t).
letter(u).
letter(v).
letter(w).
letter(x).
letter(y).
letter(z).

len([], 0).
len([_|T], s(L)) :- len(T, L).

letters([]).
letters([H|T]) :- letter(H), letters(T).

name(Len, Name) :- len(Name, Len), letters(Name).

% name(s(s(s(s(s(s(0)))))), [n, a, t, h, a, n]).

% list all strings containing 3 characters
% name(s(s(s(0))), X).

% what's the length of the string "nathan"?
% name(Len, [n, a, t, h, a, n]).