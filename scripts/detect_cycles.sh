#!/bin/bash
# Mapa de imports entre stores para detectar ciclos ESM.
cd "$(dirname "$0")/.."

echo "=== Grafo store -> store ==="
for f in src/store/*.ts; do
  name=$(basename "$f" .ts)
  deps=$(grep -oE "@/store/[a-zA-Z]+" "$f" 2>/dev/null | sed 's|@/store/||' | sort -u | tr '\n' ' ')
  if [ -n "$deps" ]; then
    echo "$name -> $deps"
  fi
done

echo ""
echo "=== Detección de ciclos (via python) ==="
python3 - <<'PY'
import re, os, glob

edges = {}
for f in glob.glob('src/store/*.ts'):
    name = os.path.basename(f)[:-3]
    with open(f) as fh:
        content = fh.read()
    deps = sorted(set(re.findall(r"@/store/([a-zA-Z]+)", content)))
    edges[name] = deps

# Detectar ciclos simples (DFS)
def find_cycles():
    cycles = []
    def dfs(node, path, visited):
        for dep in edges.get(node, []):
            if dep in path:
                # ciclo encontrado
                idx = path.index(dep)
                cycle = path[idx:] + [dep]
                cycles.append(cycle)
            elif dep not in visited:
                dfs(dep, path + [dep], visited | {dep})
    for start in edges:
        dfs(start, [start], {start})
    # dedup
    seen = set()
    uniq = []
    for c in cycles:
        key = tuple(sorted(c))
        if key not in seen:
            seen.add(key)
            uniq.append(c)
    return uniq

for c in find_cycles():
    print("CICLO:", " -> ".join(c))
PY
