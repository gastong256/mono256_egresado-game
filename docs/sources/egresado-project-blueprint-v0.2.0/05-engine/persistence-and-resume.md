# Persistence and resume

## Client local persistence

During an active run persist enough to restore:

- RunDescriptor;
- canonical commands/action log;
- current snapshot if used as optimization;
- pending official submission state.

The action log + descriptor is the durable logical truth; snapshot is an optimization and must be versioned/validated.

## Restore strategy

1. Load persisted envelope.
2. Validate schema/version.
3. If compatible, restore snapshot or replay log.
4. If migration exists, migrate deterministically.
5. If incompatible, present explicit recovery message; do not crash or silently corrupt.

## Official pending submissions

Network retry must not create a new score entry. Use idempotent run submission.
