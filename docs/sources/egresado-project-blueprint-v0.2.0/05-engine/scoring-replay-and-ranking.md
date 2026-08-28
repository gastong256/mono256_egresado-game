# Scoring, replay and ranking engine

## Never trust a submitted final score

Official client submission should send an immutable run identity plus canonical action log/result evidence. The server reconstructs/replays the run under the recorded versions and computes the official score.

## Run descriptor

At minimum:

```ts
interface RunDescriptor {
  runId: string;
  eventId: string;
  playerId: string; // pseudonymous
  runSeed: string | number;
  engineVersion: string;
  rulesetVersion: string;
  contentVersion: string;
  scoreVersion: string;
  variantCatalogVersion: string;
  slots: VariantAssignment[];
}
```

## Scoring output

Store a transparent breakdown:

- MathRaw;
- MathPerformance normalized;
- TeamPerformance normalized;
- AuraPerformance normalized;
- FairScore;
- optimal count;
- accuracy;
- difficulty solved;
- active time if measured;
- version.

## Replay verification

Server:

1. loads exact engine/content/rules version;
2. reconstructs variants;
3. replays commands;
4. rejects impossible/invalid action logs;
5. computes career state and competition score;
6. writes immutable official run result;
7. updates leaderboard personal best transactionally.

## Personal-best update

Update only if new rank tuple is better than current best according to the versioned comparator.

## Idempotency

Final submission must support idempotency by `runId`/submission id to avoid duplicate network retries creating multiple leaderboard entries.

## Time

If active time is a tie-breaker, define it carefully. Wall-clock time can be distorted by background tabs/network. Prefer engine-controlled active intervals or server-verifiable start/end events, and use time only after mathematical tie-breakers.
