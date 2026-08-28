# Graduation, recovery and fail-forward

## Intended invariant

> Every valid completed run reaches `GRADUATED`.

The player competes on quality and builds a distinct career, but is not locked out of completion.

## Separate progression from performance

Performance changes:

- Promedio;
- score;
- recovery content;
- flags;
- final archetype;
- Aura/Equipo/Estilo where contextually relevant.

Performance does **not** directly create a terminal “you cannot continue” state.

## Academic recovery pattern

Suggested compressed year states:

- promotion/direct closure;
- normal closure;
- recovery required;
- promotion “con lo justo” / pending subject callback.

A recovery can itself be imperfect. The system still converges through another compressed consequence rather than replaying the year indefinitely.

## Pending subjects

A hidden `academicDebt/pendingSubjects` structure can create callbacks:

`1.º: te quedó una previa → 2.º/3.º: esa previa sigue ahí → 5.º: final recovery arc`.

Do not expose this as another permanent HUD stat unless product later requires it.

## Property requirement

Property-based/simulation testing should attempt thousands of valid command sequences and establish:

- every completable run reaches `GRADUATED`;
- no academic-failure state is terminal;
- recovery cannot create a dead end;
- state remains serializable/replayable.
