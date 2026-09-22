# Asset mapping — escenas RC3

Baseline: `main` · HEAD `cfcde1e` (RC.2) · 2026-09-22. Reconciliación de `resources/rc3-assets/` contra `04-asset-manifest.md` y `01-scenario-inventory.md` del discovery TASK-01.

## Reconciliación

| Categoría | Resultado |
|---|---|
| EXPECTED PUBLIC ASSETS | 24 (`scenario.*` con estado PROPOSED en el manifiesto) |
| FOUND | **24 / 24**, todos en `resources/rc3-assets/scenarios/grade-{7,1,2,3,4,5}/` con los nombres exactos del manifiesto |
| MISSING | 0 |
| UNEXPECTED | 1: `resources/rc3-assets/style/master-style-test-source.png` — **idéntico byte a byte** (SHA-256) a `scenario-y1-expo-source.png`; el style test se reutilizó como piloto, tal como recomendó el discovery. Consumido a través de `y1-expo`. |
| DEV-ONLY | 0 encontrados (`g7.group`, `g7.mural`, `g7.notebook`, `g7.stand`): correcto, quedan diferidos |
| DUPLICATED | 1 (el style test, ver arriba) |
| AMBIGUOUS | 0 |
| `provenance.json` / SVG de marca / hero | No entregados en este batch; no son alcance de esta tarea |

Todos los sources: PNG RGB 8 bit, **1672×941** (≈16:9, 1,777), sin alpha, ~1,9–2,2 MB cada uno. No coinciden con el "ideal" de 3200×1800 del discovery; son suficientes para el runtime de 412 px (la columna de juego) incluso a DPR 3, así que **no se hizo upscale**: se derivó a 1600×900 exactos (recorte de ≤1 px para fijar 16:9).

## Matriz

| Asset ID | Source file | Runtime file | Source dims | Runtime dims | Source bytes | Runtime bytes | Reducción | PSNR | Content mapping (Template IDs) | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| `scenario.g7.bus` | `resources/rc3-assets/scenarios/grade-7/scenario-g7-bus-source.png` | `public/assets/scenes/g7-bus.webp` | 1672×941 | 1600×900 | 2,071,646 | 116,484 | 94.4 % | 40.36 dB | g7.bus-timing · g7.bus-latest-departure (Repaso g7.bus-travel-review sin imagen) | INTEGRATED |
| `scenario.g7.may-25` | `resources/rc3-assets/scenarios/grade-7/scenario-g7-may-25-source.png` | `public/assets/scenes/g7-may-25.webp` | 1672×941 | 1600×900 | 2,092,981 | 149,890 | 92.8 % | 39.35 dB | g7.may-25-act | INTEGRATED |
| `scenario.y1.classroom` | `resources/rc3-assets/scenarios/grade-1/scenario-y1-classroom-source.png` | `public/assets/scenes/y1-classroom.webp` | 1672×941 | 1600×900 | 1,958,578 | 100,306 | 94.9 % | 40.74 dB | y1.classroom-layout (Repaso y1.scale-fit-review sin imagen) | INTEGRATED |
| `scenario.y1.expo` | `resources/rc3-assets/scenarios/grade-1/scenario-y1-expo-source.png` | `public/assets/scenes/y1-expo.webp` | 1672×941 | 1600×900 | 2,158,395 | 129,286 | 94.0 % | 39.92 dB | y1.course-project-expo | INTEGRATED |
| `scenario.y1.mobile-data` | `resources/rc3-assets/scenarios/grade-1/scenario-y1-mobile-data-source.png` | `public/assets/scenes/y1-mobile-data.webp` | 1672×941 | 1600×900 | 2,001,276 | 112,692 | 94.4 % | 40.47 dB | y1.mobile-data | INTEGRATED |
| `scenario.y1.rehearsal` | `resources/rc3-assets/scenarios/grade-1/scenario-y1-rehearsal-source.png` | `public/assets/scenes/y1-rehearsal.webp` | 1672×941 | 1600×900 | 2,089,532 | 141,128 | 93.2 % | 39.87 dB | y1.rehearsal-schedule (Repaso y1.schedule-review sin imagen) | INTEGRATED |
| `scenario.y1.wheel` | `resources/rc3-assets/scenarios/grade-1/scenario-y1-wheel-source.png` | `public/assets/scenes/y1-wheel.webp` | 1672×941 | 1600×900 | 2,111,402 | 151,438 | 92.8 % | 39.53 dB | y1.student-day-challenge-wheel | INTEGRATED |
| `scenario.y2.survey` | `resources/rc3-assets/scenarios/grade-2/scenario-y2-survey-source.png` | `public/assets/scenes/y2-survey.webp` | 1672×941 | 1600×900 | 2,097,320 | 140,418 | 93.3 % | 39.72 dB | y2.course-project-survey (Repaso y2.data-claim-review sin imagen) | INTEGRATED |
| `scenario.y2.court` | `resources/rc3-assets/scenarios/grade-2/scenario-y2-court-source.png` | `public/assets/scenes/y2-court.webp` | 1672×941 | 1600×900 | 2,121,674 | 139,936 | 93.4 % | 39.78 dB | y2.court-zones | INTEGRATED |
| `scenario.y2.intercurso` | `resources/rc3-assets/scenarios/grade-2/scenario-y2-intercurso-source.png` | `public/assets/scenes/y2-intercurso.webp` | 1672×941 | 1600×900 | 2,204,566 | 161,420 | 92.7 % | 38.96 dB | y2.intercurso-plan · y2.standings-claim | INTEGRATED |
| `scenario.y2.team-kit` | `resources/rc3-assets/scenarios/grade-2/scenario-y2-team-kit-source.png` | `public/assets/scenes/y2-team-kit.webp` | 1672×941 | 1600×900 | 2,118,366 | 145,940 | 93.1 % | 39.57 dB | y2.team-kit-order | INTEGRATED |
| `scenario.y3.tech` | `resources/rc3-assets/scenarios/grade-3/scenario-y3-tech-source.png` | `public/assets/scenes/y3-tech.webp` | 1672×941 | 1600×900 | 2,064,048 | 140,298 | 93.2 % | 39.90 dB | y3.course-project-tech (Repaso y3.rate-capacity-review sin imagen) | INTEGRATED |
| `scenario.y3.friend` | `resources/rc3-assets/scenarios/grade-3/scenario-y3-friend-source.png` | `public/assets/scenes/y3-friend.webp` | 1672×941 | 1600×900 | 2,223,584 | 163,236 | 92.7 % | 39.22 dB | y3.friend-day | INTEGRATED |
| `scenario.y3.route` | `resources/rc3-assets/scenarios/grade-3/scenario-y3-route-source.png` | `public/assets/scenes/y3-route.webp` | 1672×941 | 1600×900 | 2,121,500 | 136,970 | 93.5 % | 39.86 dB | y3.route-plan | INTEGRATED |
| `scenario.y3.transport` | `resources/rc3-assets/scenarios/grade-3/scenario-y3-transport-source.png` | `public/assets/scenes/y3-transport.webp` | 1672×941 | 1600×900 | 2,041,916 | 120,636 | 94.1 % | 40.29 dB | y3.transport-pass (Repaso y3.fixed-variable-review sin imagen) | INTEGRATED |
| `scenario.y3.week` | `resources/rc3-assets/scenarios/grade-3/scenario-y3-week-source.png` | `public/assets/scenes/y3-week.webp` | 1672×941 | 1600×900 | 2,019,532 | 100,164 | 95.0 % | 40.57 dB | y3.week-planner | INTEGRATED |
| `scenario.y4.fundraiser` | `resources/rc3-assets/scenarios/grade-4/scenario-y4-fundraiser-source.png` | `public/assets/scenes/y4-fundraiser.webp` | 1672×941 | 1600×900 | 2,176,690 | 148,926 | 93.2 % | 39.44 dB | y4.course-project-fundraiser (Repaso y4.margin-review sin imagen) | INTEGRATED |
| `scenario.y4.event` | `resources/rc3-assets/scenarios/grade-4/scenario-y4-event-source.png` | `public/assets/scenes/y4-event.webp` | 1672×941 | 1600×900 | 2,032,535 | 125,720 | 93.8 % | 39.96 dB | y4.event-floor-plan · y4.school-event-flow · y4.shift-coverage (Repaso y4.spatial-capacity-review sin imagen) | INTEGRATED |
| `scenario.y4.represent` | `resources/rc3-assets/scenarios/grade-4/scenario-y4-represent-source.png` | `public/assets/scenes/y4-represent.webp` | 1672×941 | 1600×900 | 2,083,571 | 142,082 | 93.2 % | 39.82 dB | y4.represent-class | INTEGRATED |
| `scenario.y5.final-project` | `resources/rc3-assets/scenarios/grade-5/scenario-y5-final-project-source.png` | `public/assets/scenes/y5-final-project.webp` | 1672×941 | 1600×900 | 2,120,869 | 147,804 | 93.0 % | 39.56 dB | y5.course-project-final | INTEGRATED |
| `scenario.y5.trip` | `resources/rc3-assets/scenarios/grade-5/scenario-y5-trip-source.png` | `public/assets/scenes/y5-trip.webp` | 1672×941 | 1600×900 | 2,188,834 | 164,716 | 92.5 % | 39.23 dB | y5.final-trip-or-event (Repaso y5.multi-option-comparison-review sin imagen) | INTEGRATED |
| `scenario.y5.screen` | `resources/rc3-assets/scenarios/grade-5/scenario-y5-screen-source.png` | `public/assets/scenes/y5-screen.webp` | 1672×941 | 1600×900 | 2,147,599 | 154,918 | 92.8 % | 39.65 dB | y5.stage-screen | INTEGRATED |
| `scenario.y5.yearbook` | `resources/rc3-assets/scenarios/grade-5/scenario-y5-yearbook-source.png` | `public/assets/scenes/y5-yearbook.webp` | 1672×941 | 1600×900 | 2,150,917 | 156,722 | 92.7 % | 39.69 dB | y5.yearbook (Repaso y5.proportion-capacity-review sin imagen) | INTEGRATED |
| `scenario.y5.next-step` | `resources/rc3-assets/scenarios/grade-5/scenario-y5-next-step-source.png` | `public/assets/scenes/y5-next-step.webp` | 1672×941 | 1600×900 | 1,906,920 | 102,434 | 94.6 % | 41.08 dB | y5.next-step-options | INTEGRATED |
| **Total** | 24 PNG | 24 WebP | | | **50,304,251** | **3,293,564** | **93.5 %** | | 28 Templates públicas | |

Content mapping = `src/components/game/scene-registry.ts`. Las Templates de Repaso figuran entre paréntesis porque comparten situación visual pero el registro **no** les asigna imagen (ver `ux-decision.md`).

## Procedencia (SHA-256)

Los originales se retiraron de `resources/` al cerrar la tarea (ver `README.md` de esta carpeta); estos digests permiten verificar cualquier copia que el equipo conserve.

| Source file | SHA-256 (source) | Runtime file | SHA-256 (runtime) |
|---|---|---|---|
| `scenarios/grade-7/scenario-g7-bus-source.png` | `73baee347706cb52ac9ae55fc06c421a4e35ed91f31c324bd43eba66cc86bcac` | `g7-bus.webp` | `86be0d9cf372a5570fe1d4f1841c44f1b4fd843d7ab203598314e01226ffd1c7` |
| `scenarios/grade-7/scenario-g7-may-25-source.png` | `6131706918a6fe16bc838651643be217540131156331572c3344228f6c095475` | `g7-may-25.webp` | `de8e65620af686b22351cef87500b3b38b895800b7f48e859260e0a1ecea7c74` |
| `scenarios/grade-1/scenario-y1-classroom-source.png` | `3fa8cbf1d4d095da70943c02bb7cb2bb760759d9d48b9c08d1efde50b46fb323` | `y1-classroom.webp` | `bf7903d3059914c199ab817d49ab9ec4e6bea45a4d6903ffb70628eee8629e23` |
| `scenarios/grade-1/scenario-y1-expo-source.png` | `92735217c75c86aeb1492089470dab4f3e6f5548b76dfac2b687ef7b5c736068` | `y1-expo.webp` | `aa2080528e22802701ede5052cd4af62f1efe0b41d1734836fd7ac8b70591c9f` |
| `scenarios/grade-1/scenario-y1-mobile-data-source.png` | `118ec48a7a923428cdccf0e0cdd4a5786313193e9bd85449e1d9a62c5c7b8696` | `y1-mobile-data.webp` | `ede8c6166a4c4927296625a030ce91688b54214191386ab2e0fb09cd059ba3f2` |
| `scenarios/grade-1/scenario-y1-rehearsal-source.png` | `6fa445a6ac18e8c2a63f14a1ddc681b4f7b81c081465e09f013bd4cc400d8ae1` | `y1-rehearsal.webp` | `2a7a011e89b5052693c433fa9609271ad15eb192660ebc41b492b8db43f934b4` |
| `scenarios/grade-1/scenario-y1-wheel-source.png` | `2e2af2ed5efa92cc53dfa2fee079e6293c8bdd3c73662fe8e3b8f1cb3315e11f` | `y1-wheel.webp` | `da830e4e640031da78f449c953e98cc634b7b4e9c893b7603c918325ed7d7a1d` |
| `scenarios/grade-2/scenario-y2-survey-source.png` | `9b6d3e81ff4acb612ae50f223ebf91de551fafc85a382727db0d827862963a05` | `y2-survey.webp` | `0d0ba05c5e7f6efa9b7dadf9b7c31834c2c0942039c8b0c9550615193901b4cb` |
| `scenarios/grade-2/scenario-y2-court-source.png` | `f39f8918fab81b6153adca1aa09b8fa51b94b8ace6d9c9adf92f3072f36a8dca` | `y2-court.webp` | `8fcd4e06da64e03a2694f2de1cc797fb56d3e4589c543a551957176579c0b928` |
| `scenarios/grade-2/scenario-y2-intercurso-source.png` | `68e6f876c9cab1eeb7c99d9eb7f59124ee5795c64487d5889cef2ec27eaf5719` | `y2-intercurso.webp` | `404fd47a4dd66001d8b85108e85e189cf793d607319b4c402ac3dac3b6fb3dee` |
| `scenarios/grade-2/scenario-y2-team-kit-source.png` | `4ac35596bca065928c06aa4ebb10b9eb1573f5f7e2f0c0c8bfb90f4d4d00705a` | `y2-team-kit.webp` | `88d03c7b2504c9eef2707a8d2a72428c9c043fafe2f9dbb8412cef42a5e3b2c3` |
| `scenarios/grade-3/scenario-y3-tech-source.png` | `46ed5983f455879df3df21c914bddead9698d86588f1aabbab40994d83650ccb` | `y3-tech.webp` | `d85c0ddac647ca2df117fd2759cb0369f2a2e2f0c0c934ffcc533fff3641018c` |
| `scenarios/grade-3/scenario-y3-friend-source.png` | `ec5bbc57498cdad1581c0560c108d876309339a3bcd4dad1f25523b1d1075dcc` | `y3-friend.webp` | `88271c6e1949a5da4bb6100b5b72cfdf049dd8ce107f1050041af7b13f518658` |
| `scenarios/grade-3/scenario-y3-route-source.png` | `b00b9db8c82bcb4c4e052adbd3e213f627a16608f5f5e8e83735fd6c7c4c2615` | `y3-route.webp` | `271366f190aac785067cc0b8e704fffb7637309bdc953c3b44680371ea639f36` |
| `scenarios/grade-3/scenario-y3-transport-source.png` | `342d96698ccd80f5356158125b386ad2e3c9a45caaa11506c96d593cdebf1f9d` | `y3-transport.webp` | `883f3430ca0b92a54fc93bd8d2c4845c0d3191638f2d2dba97ae0739cdfd6be3` |
| `scenarios/grade-3/scenario-y3-week-source.png` | `b070237bb70abd2b18968f33a58883ab629c0d1ce85826231ae57f1be14be9f1` | `y3-week.webp` | `8cca65769f7610cc6ec0ff2b9cacc8a12dbb17e122400b7eb88f254fd5c81c34` |
| `scenarios/grade-4/scenario-y4-fundraiser-source.png` | `47779785f0c22ce3e84caa60aac4264955b4c7376e6fcf6e0fe795b2d9fbf972` | `y4-fundraiser.webp` | `732eeaa93707a1645dfd676b3e3bf9cbc2e9a1ea01a42dd8f06781a8230729c7` |
| `scenarios/grade-4/scenario-y4-event-source.png` | `4c829f0bb3713d9d81e68d75a855bb853436b4f3b38b362f38bab565a6bec928` | `y4-event.webp` | `ac8cc8439f67c6afd00b0f3e39b075d3d4be0b0668887dc1b1d829b6bc8160e6` |
| `scenarios/grade-4/scenario-y4-represent-source.png` | `37dc9d9f31ec14e84f6440c384b3c9ee807a7641199e3be9a239117ff3fd64a3` | `y4-represent.webp` | `872acc6a38a01da6d16b820b488ad4965dd8a26467045e98fba932926bbe50c8` |
| `scenarios/grade-5/scenario-y5-final-project-source.png` | `28c2c3f72c7c30c01c84237910f48a888fbd0fecf19598389750ea2cda20cdc6` | `y5-final-project.webp` | `3477c996a481209362a5ab80e51292882104e8105f99783f41ca41e09279a0c0` |
| `scenarios/grade-5/scenario-y5-trip-source.png` | `80d51bb056f12a972b9b8abbf3c8c2c2afc30ba51a0ebe06cf841966d60d6cc2` | `y5-trip.webp` | `e727230a0efcf2b997e3683fd1d62c66a71cf37fc53d0acbeed11b97e2506b82` |
| `scenarios/grade-5/scenario-y5-screen-source.png` | `68f52c3e816f3758efb99c1dad2327069bb7ef982e12acbc945d2f0cbedf4313` | `y5-screen.webp` | `214bb505af904cb53a75b2181f1314d33e2260e09da96c102ebffe58d3fd0f31` |
| `scenarios/grade-5/scenario-y5-yearbook-source.png` | `d9d315ec39fff22c51e8e3449d06f11b9996ff1518a135d141cca7dac69fb794` | `y5-yearbook.webp` | `e8b15f23114921beb6c135937ece09babf29a97231d0949ca616d0d47604b32e` |
| `scenarios/grade-5/scenario-y5-next-step-source.png` | `fdef3e9d976b07862bf8a7aa406ab17150c15f577d59c11ea0d2b9ce7f87a85c` | `y5-next-step.webp` | `473c97a9972638cee787db71963b4c4172b01e6dfcb6c1a1b40207a014984857` |
| `style/master-style-test-source.png` | `92735217c75c86aeb1492089470dab4f3e6f5548b76dfac2b687ef7b5c736068` | — (idéntico byte a byte a `scenario-y1-expo-source.png`) | — |
