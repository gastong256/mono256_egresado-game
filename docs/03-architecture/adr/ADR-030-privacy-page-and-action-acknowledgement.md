# ADR-030 — Privacidad centralizada y aceptación al iniciar

- Estado: Aceptado por encargo explícito del Product Owner
- Fecha: 2026-09-23
- Supersede parcialmente: ADR-026, sólo presentación y control de reconocimiento
- Relacionados: ADR-027 y ADR-029

## Contexto

El PO solicita retirar duplicaciones de privacidad de Home, publicar el aviso v1
completo en una ruta y sustituir el checkbox por aceptación asociada al inicio.
La política existente es información sobre tratamiento; una interfaz no determina
por sí sola su base jurídica ni la capacidad de un menor para consentir.

## Decisión

1. `/privacidad` renderiza en servidor el aviso completo de `buildPrivacyNotice`,
   con versión y responsable configurados. No duplica ni reescribe sus secciones.
   Sin configuración muestra indisponibilidad; nunca inventa datos del responsable.
2. Home conserva sólo el enlace del footer. El formulario elimina checkbox y
   desplegable; muestra junto al CTA: «Al elegir “Aceptar y jugar”, confirmás que
   leíste y aceptás el tratamiento de datos explicado en la Política de Privacidad
   para participar en la competencia». El enlace abre otra pestaña, anunciado
   accesiblemente, para conservar los campos en memoria sin almacenar PII.
3. La acción afirmativa es enviar el formulario válido mediante **Aceptar y jugar**
   (mouse, touch o teclado). Navegar, leer el aviso o completar campos no envía una
   aceptación. Se conserva la validación servidor de `privacyNoticeAcknowledged:
   true` y la versión vigente. No se cambia schema, retención, datos recogidos ni
   cookies. El campo persistido sigue siendo la versión reconocida, no una nueva
   firma ni un historial de consentimientos.
4. La aceptación queda limitada al tratamiento ya explicado para participar;
   no añade marketing, tracking, términos generales o aceptación por mera visita.
   El texto v1 y el contrato congelado no cambian. `/test` sigue sin identificación.
5. `/privacidad` recibe nonce CSP como las demás páginas públicas. No se abren
   rutas DEV ni se incorporan dependencias, servicios, env o migraciones.

## Investigación y límites

La [Ley 25.326, arts. 5–6](https://www.argentina.gob.ar/normativa/nacional/64790/actualizacion)
requiere información previa y, cuando el consentimiento es la base aplicable,
que sea libre, expreso e informado. El mero uso o silencio no se presenta como
consentimiento. La [guía del ICO](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/consent/how-should-we-obtain-record-and-manage-consent/)
incluye botones de opt-in; se usa como referencia de UX, no como ley argentina.

Esto implementa un patrón de aceptación mediante acción, sin certificar validez
jurídica universal ni sustituir la política institucional sobre menores. La
pregunta legal institucional existente conserva su alcance. Se descarta browsewrap
pasivo por ambiguo y persistir el formulario para volver del aviso por innecesario.

## Verificación

Aviso íntegro/versionado y accesible sin registro; footer resuelve la ruta;
formulario sin checkbox ni envío previo; enlace conserva campos; submit válido
envía versión/reconocimiento; ausencia o versión falsa siguen rechazadas por API.
E2E en producción local, móvil, teclado, axe y guards de rutas; `pnpm verify`.
