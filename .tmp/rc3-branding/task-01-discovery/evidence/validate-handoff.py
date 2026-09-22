"""Validate only the local TASK-01 handoff; never change product files."""
from pathlib import Path
from collections import Counter
import json
import re
import subprocess

root = Path.cwd()
out = root / '.tmp/rc3-branding/task-01-discovery'
ev = out / 'evidence'
checks = []

def check(condition, label):
    if not condition:
        raise AssertionError(label)
    checks.append(label)

def read(name):
    return json.loads((ev / name).read_text())

required = [
    'README.md', '00-scope.md', '01-scenario-inventory.md',
    '02-ui-surface-inventory.md', '03-copy-audit.md', '04-asset-manifest.md',
    '05-brand-direction.md', '06-implementation-plan.md',
    '07-risks-and-guardrails.md', '08-source-map.md',
    '11-existing-assets-inventory.md', '12-verification.md',
    'asset-generation-prompts.md', 'final-report.txt',
]
check(all((out / n).is_file() and (out / n).stat().st_size > 100 for n in required), 'All handoff deliverables present')
for path in ev.glob('*.json'):
    json.loads(path.read_text())
check(True, 'Every evidence JSON parses')
catalog = read('catalog.json')
assets = read('assets.json')
reach = read('reachability.json')
templates = catalog['templates']
check(len(catalog['families']) == 22 and len(templates) == 42, '22 families and 42 templates')
check(sum(len(t['approvedVariants']) for t in templates) == catalog['entryCount'] == 1031, '1031 approved variant IDs')
check({stage for t in templates for stage in t['stages']} == {'grade-7', 'year-1', 'year-2', 'year-3', 'year-4', 'year-5'}, 'All six grades covered')
eligible = {t['id'] for t in templates if t['publicEligible']}
check(len(eligible) == 38 and set(reach['templates']) == eligible, 'Witness for every public template; dev templates absent')
check(reach['runs'] == reach['completed'] == 128, '128 of 128 runs completed')
check(len(reach['storylets']) == 44 and len(catalog['storylets']) == 50 and len(reach['rareEvents']) == 4, 'Storylet and rare-event evidence complete')
check(len(assets) == len({a['id'] for a in assets}) == 36, '36 unique candidate asset contracts')
check(Counter(a['priority'] for a in assets) == {'P0': 8, 'P1': 16, 'P2': 12}, 'Priorities reconcile 8/16/12')
scenario = [a for a in assets if a['group'] == 'SCENARIO']
check(len(scenario) == 28 and sum(a['active'] for a in scenario) == 24, '28 visual contexts; 24 public')
mapped = [t for a in scenario for t in a['templates']]
check(Counter(mapped) == Counter(t['id'] for t in templates), 'Every template mapped exactly once, including reviews/dev')
check(len({a['sourcePath'] for a in scenario}) == len({a['runtimePath'] for a in scenario}) == 28, 'Unique scene source and runtime filenames')
check(len(read('existing-assets.json')) == 8, 'Eight existing binary assets inventoried')
check(read('ui-copy-counts.json') == {'uiSurfaces': 36, 'interactionKinds': 11, 'copyRecords': 36}, 'UI, interaction and copy counts reconcile')
docs = read('reviewed-documents.json')
check(len(docs) == 39 and all((root / p).is_file() for p in docs), '39 reviewed document references exist')
prompts = (out / 'asset-generation-prompts.md').read_text()
for a in assets:
    match = re.search(r'^## ' + re.escape(a['id']) + r'\n(.*?)(?=^## |\Z)', prompts, re.M | re.S)
    check(match is not None, 'Prompt/production card: ' + a['id'])
    for field in ['ASSET ID:', 'TARGET FILE:', 'ASPECT RATIO:', 'SCENE:', 'PEOPLE:', 'OBJECTS:', 'ACTION:', 'COMPOSITION:', 'LOCAL CONTEXT:', 'MANDATORY DETAILS:', 'AVOID:', 'TEXT:']:
        check(field in match.group(1), a['id'] + ' field ' + field)
    for source in a['sourceRefs']:
        check((root / source.split(':')[0]).is_file(), 'Asset source exists: ' + source.split(':')[0])
check('MASTER STYLE' in prompts and 'NEGATIVE / AVOID' in prompts, 'Master style and negative prompt present')
links = 0
for path in out.glob('*.md'):
    content = path.read_text()
    check(content.count('```') % 2 == 0, 'Balanced fences: ' + path.name)
    check(not re.search(r'[ \t]+$', content, re.M), 'No trailing whitespace: ' + path.name)
    for href in re.findall(r'\[[^\]]+\]\(([^)]+)\)', content):
        if href.startswith(('https:', 'http:', '#')):
            continue
        target = href.split('#')[0]
        check((path.parent / target).exists() or (path.parent / target) == ev / 'handoff-validation.json', 'Local link: ' + path.name + ' → ' + href)
        links += 1
    for source in re.findall(r'(?<![/\w])(?:src|docs|tests|scripts)/[a-zA-Z0-9_./-]+\.(?:tsx|ts|md|json|mjs|css|txt|woff2)', content):
        check((root / source).is_file(), 'Concrete code/document citation exists: ' + source)
check(not subprocess.check_output(['git', 'diff', '--name-only'], text=True).strip(), 'No tracked working-tree change')
check(not subprocess.check_output(['git', 'diff', '--cached', '--name-only'], text=True).strip(), 'No staged change')
untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], text=True).splitlines()
check(bool(untracked) and all(p.startswith('.tmp/rc3-branding/task-01-discovery/') for p in untracked), 'All untracked files inside authorized output')
subprocess.run(['git', 'diff', '--check'], check=True)
result = {'status': 'PASS', 'checks': len(checks), 'localLinks': links, 'untrackedFilesAtCheck': len(untracked), 'templates': 42, 'publicTemplatesWitnessed': 38, 'runsCompleted': 128, 'visualContexts': 28, 'candidateContracts': 36, 'productModified': False}
(ev / 'handoff-validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
