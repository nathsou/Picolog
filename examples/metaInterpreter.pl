% https://www.youtube.com/watch?v=nmBkU-l1zyc

% meta interpreter of prolog

% peano integers
head_body(natnum(0), Rs, Rs).
head_body(natnum(s(X)), [natnum(X)|Rs], Rs).
% meta-circular interpreter:
head_body(mi([]), Rs, Rs).
head_body(mi([G|Gs]), [head_body(G, Goals, Gs), mi(Goals)|Rs], Rs).
head_body(head_body(Head, Goals0, Goals), Rs, Rs) :-
    head_body(Head, Goals0, Goals).

mi([]).
mi([G|Gs]) :- head_body(G, Goals, Gs), mi(Goals).

% queries:
% mi([natnum(X)]).
% mi([mi([natnum(X)])]).
% mi([mi([mi([natnum(X)])])]).