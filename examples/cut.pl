% https://en.wikibooks.org/wiki/Prolog/Cuts_and_Negation

a(X, Y) :- b(X), !, c(Y).
b(1).
b(2).
b(3).

c(1).
c(2).
c(3).

% ?- a(Q, R).
% Q = 1
% R = 1 ;
% Q = 1
% R = 2 ;
% Q = 1
% R = 3 ;