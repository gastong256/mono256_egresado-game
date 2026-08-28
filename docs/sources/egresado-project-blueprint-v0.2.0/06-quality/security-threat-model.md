# Security and competition threat model

## Assets at risk

- prize ranking integrity;
- event availability;
- moderation controls;
- participant pseudonymous identity;
- fair rules/version integrity.

## Primary threats

### Client score forgery
Mitigation: server computes/replays score.

### Modified action log
Mitigation: deterministic replay validates command legality/state sequence.

### Run descriptor tampering
Mitigation: server-issued/stored descriptor; validate run/player/event binding.

### Submission replay/duplication
Mitigation: idempotency key/run id; immutable official result.

### Resource abuse / DoS
Mitigation: rate limits, payload/command caps, timeouts, monitoring. OWASP API4/API6 are directly relevant.

### Nickname abuse
Mitigation: length/character validation, profanity moderation/hide, admin tools.

### Admin privilege abuse
Mitigation: authenticated admin role, least privilege, audit log.

### Version mixing
Mitigation: reject official submissions whose version tuple does not match allowed event configuration.

## Avoid overbuilding

This is a school fair, not an esports platform. Use risk-proportionate controls, but do not trust the browser with prize-determining values.
