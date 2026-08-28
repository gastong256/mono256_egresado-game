# Variant generation engine

## Recommended interfaces

```ts
interface ChallengeFamilyDefinition {
  id: FamilyId;
  templateIds: TemplateId[];
}

interface ChallengeTemplate<P, PublicView, Answer> {
  id: TemplateId;
  difficulty: DifficultyBand;
  generate(ctx: GenerationContext): GeneratedVariant<P>;
  toPublicView(params: P): PublicView;
  evaluate(params: P, answer: Answer): Evaluation;
  validate(params: P): ValidationResult;
}
```

Exact repository architecture may differ; preserve its challenge registry strategy.

## Generation context

Should contain explicit:

- seed/substream;
- content version;
- requested difficulty;
- locale if genuinely necessary;
- feature/ruleset version.

## Generator responsibilities

Generator creates parameters, not React nodes.

## Validator responsibilities

Validator checks domain invariants independent of UI.

Examples:

- `hasSolution`;
- `intendedOutcomeOrdering`;
- `noAmbiguousOptimum`;
- `readableArithmetic`;
- `uniqueOptions`;
- `validMoneyMinorUnits`;
- `difficultyBandConsistent`.

## Deployed catalog

Competitive build job can generate many candidate seeds, retain only validated approved variants and create a versioned catalog:

```json
{
  "catalogVersion": "fair-2026-v1",
  "templateId": "bus.delay.v1",
  "variants": [{"seed": 123, "difficulty": "STANDARD", "fingerprint": "..."}]
}
```

## Fingerprint/question note

Compute a canonical fingerprint of public parameters/answer semantics so duplicate seeds producing equivalent variants can be detected.

## Distribution validation

Run aggregate checks for:

- correct-answer position balance;
- template frequency;
- difficulty distribution;
- duplicate rate;
- parameter edge distribution;
- invalid seed count = 0 in deployed catalog.
