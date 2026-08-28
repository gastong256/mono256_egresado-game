# User flows

## Demo flow

```text
Landing
→ nickname/setup
→ 7.º intro
→ challenge slot 1
→ feedback
→ ...
→ challenge slot N
→ 7.º complete
→ career summary + demo score
→ play again
```

Second run should select different valid variants/templates so replayability is visible.

## Full fair flow

```text
QR / URL
→ event landing
→ nickname / participant token
→ request official run
→ server issues descriptor
→ local-first gameplay
→ graduate
→ final summary
→ submit action log
→ pending verification state if necessary
→ server verified score
→ personal best / ranking
→ play again
```

## Network interruption

During an issued run:

```text
network lost
→ continue locally if all required variant data already available
→ finish
→ submission pending
→ retry idempotently
→ verified when connectivity returns
```

If no authoritative run could be issued before start, the app can offer non-official/free play rather than silently making an unverified run prize-eligible.

## Recovery flow

```text
academic insufficient
→ consequence
→ recovery required flag/event
→ compressed recovery challenge/storylet
→ next stage
```

No loop that forces replaying the same year indefinitely.
