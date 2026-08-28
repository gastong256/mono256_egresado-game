# Research and standards basis

**Access context:** August 2026. These sources inform recommendations; Egresado still requires school-specific validation.

## STACK — seeded and deployed random variants

- STACK Docs, “Deploying”: https://docs.stack-assessment.org/en/STACK_question_admin/Deploying/
- STACK Docs, “Random objects”: https://docs.stack-assessment.org/en/CAS/Random/
- STACK Docs, “Systematic deployment”: https://docs.stack-assessment.org/en/STACK_question_admin/Deploying_systematically/

Relevant principle: pseudo-random seeded variants are reproducible; pre-generating/testing/deploying variants reduces the risk of impossible or defective random cases.

## CAST Universal Design for Learning Guidelines 3.0

- https://udlguidelines.cast.org/
- Action & Expression: https://udlguidelines.cast.org/action-expression/
- Representation: https://udlguidelines.cast.org/representation/
- Engagement: https://udlguidelines.cast.org/engagement/

Relevant principles: optimize challenge/support, clarify mathematical notation/symbols, use multiple representations, vary response/navigation methods, authentic relevance, action-oriented feedback.

## Low-floor / high-ceiling task design

- Radmehr et al.-related 2025 literature review: https://www.tandfonline.com/doi/full/10.1080/0020739X.2025.2457365
- Educational Designer example: https://www.educationaldesigner.org/ed/volume5/issue17/article68/

Relevant principle: accessible entry with opportunities for deeper mathematical reasoning and multiple paths.

## Repeatable leaderboard / Best Score

- Apple GameKit, “Choosing a leaderboard for your challenges”: https://developer.apple.com/documentation/gamekit/choosing-a-leaderboard-for-your-challenges

Relevant principle: repeatable challenges should generally use Best Score rather than cumulative activity that can unfairly advantage heavy-volume players.

## Property-based testing

- fast-check, “Why Property-Based Testing?”: https://fast-check.dev/docs/introduction/why-property-based/

Relevant principle: property-based tests can remain reproducible using seeds and failure seeds.

## Accessibility

- W3C WCAG 2.2: https://www.w3.org/TR/wcag/

Relevant principles: semantic name/role/value, programmatically determinable state, status messages, keyboard/accessibility requirements.

## API/game security

- OWASP API Security Top 10 2023: https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- API4 Unrestricted Resource Consumption: https://owasp.org/API-Security/editions/2023/en/0xa4-unrestricted-resource-consumption/
- OWASP Game Security Framework: https://owasp.org/www-project-gamesec-framework/OGSF

Relevant principles: validate trust-boundary data, keep sensitive competition logic authoritative, apply rate/resource limits.
