# RC3 — práctica pública

Encargo del PO: `/test`, carrera completa anónima sin participación competitiva.
**Implementación y verificación local completas:** `pnpm verify` PASS, 2.428 tests
y 254 E2E sin skips. `/test` responde 200 en el build de producción local; no se
afirma un deployment remoto.

Base auditada: `main` en `8c24a8fcb64eab5af2a962beed60de970a228635`; cambios
preexistentes de TASK-A e ilustraciones preservados. No se corta RC3 ni se despliega
manualmente. El estado de push se informa al cierre, sin reescribir historia.

- [Arquitectura](architecture.md): mismo juego, frontera separada.
- [Seguridad y privacidad](security-and-privacy.md): contador como única escritura.
- [Flujo y accesibilidad](ux-flow.md): inicio, reanudación, resultado y nueva seed.
- [Verificación](verification.md): comandos, evidencia y límites.

Fuente canónica: [ADR-029](../../../docs/03-architecture/adr/ADR-029-public-practice-mode.md)
y FR-021 de la especificación funcional. Es una excepción funcional explícita del
PO al sprint congelado, no una apertura general de STAGE-10 a features.
