#!/usr/bin/env bash
# Helper script that shows the caliber value loop with real output.
# Used by demo.tape for recording.
set -euo pipefail
export CALIBER_SKIP_UPDATE_CHECK=1
cd /tmp/caliber-demo-repo

# ── Act 1: Score before ──────────────────────────
echo ""
echo "  ▸ Before caliber"
echo ""
git checkout before-init -q
caliber score | head -5
sleep 1

# ── Act 2: Score after ───────────────────────────
echo ""
echo "  ▸ After: caliber init"
echo ""
git checkout after-init -q
caliber score | head -5
sleep 1

# ── Act 3: Continuous sync ───────────────────────
echo ""
echo "  ▸ You push code → caliber refresh keeps docs in sync"
echo ""

# Create a meaningful code change
mkdir -p src/lib
cat > src/lib/auth.ts << 'CODEOF'
import { verify } from "jsonwebtoken";
export function authenticate(token: string) {
  return verify(token, process.env.JWT_SECRET!);
}
CODEOF

cat >> src/api/routes.ts << 'CODEOF'

app.post("/api/webhooks", async (c) => {
  const payload = await c.req.json();
  return c.json({ received: payload.event });
});
CODEOF

git add -A && git commit -q -m "feat: add auth module and webhook endpoint"
caliber refresh
echo ""
# Reset
git checkout -- . 2>/dev/null || true
git clean -fd -q 2>/dev/null || true
