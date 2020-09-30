nat(0).
nat(s(X)) :- nat(X).

plus(X, 0, X) :- nat(X).
plus(0, Y, Y) :- nat(Y).
plus(s(X), Y, s(Z)) :- plus(X, Y, Z).
plus(X, s(Y), s(Z)) :- plus(X, Y, Z).

minus(X, Y, M) :- plus(M, Y, X).

mult(_, 0, 0).
mult(0, _, 0).
mult(s(X), Y, Z) :- mult(X, Y, Z2), plus(Z2, Y, Z).
mult(X, s(Y), Z) :- mult(X, Y, Z2), plus(Z2, X, Z).