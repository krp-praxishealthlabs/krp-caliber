#!/usr/bin/env bash
# ─────────────────────────────────────────────────
# Sets up a realistic demo repo for recording the Caliber demo GIF.
# Creates a TypeScript + React project with real files but no AI configs.
#
# Usage:
#   chmod +x assets/demo-setup.sh
#   ./assets/demo-setup.sh
#   vhs assets/demo.tape
# ─────────────────────────────────────────────────

set -euo pipefail

DEMO_DIR="/tmp/caliber-demo-repo"

echo "🧹 Cleaning up previous demo repo..."
rm -rf "$DEMO_DIR"

echo "📁 Creating demo project: $DEMO_DIR"
mkdir -p "$DEMO_DIR"
cd "$DEMO_DIR"

# Initialize git repo (required for caliber)
git init -q
git checkout -b main

# ── package.json ──────────────────────────────────
cat > package.json <<'EOF'
{
  "name": "acme-dashboard",
  "version": "2.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest watch",
    "lint": "eslint src/",
    "db:migrate": "drizzle-kit migrate",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.60.0",
    "drizzle-orm": "^0.36.0",
    "hono": "^4.6.0",
    "zod": "^3.23.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^2.1.0",
    "@types/react": "^19.0.0",
    "eslint": "^9.0.0",
    "drizzle-kit": "^0.28.0"
  }
}
EOF

# ── tsconfig.json ─────────────────────────────────
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
EOF

# ── Source files ──────────────────────────────────
mkdir -p src/app src/components src/lib src/api src/db

cat > src/app/layout.tsx <<'EOF'
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Acme Dashboard" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
EOF

cat > src/app/page.tsx <<'EOF'
import { Dashboard } from "@/components/dashboard";
export default function Home() {
  return <Dashboard />;
}
EOF

cat > src/components/dashboard.tsx <<'EOF'
"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "@/lib/api-client";

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["metrics"], queryFn: fetchMetrics });
  if (isLoading) return <div>Loading...</div>;
  return (
    <div className="grid grid-cols-3 gap-4 p-6">
      {data?.map((m) => (
        <div key={m.id} className="rounded-lg border p-4">
          <h3 className="text-sm text-gray-500">{m.label}</h3>
          <p className="text-2xl font-bold">{m.value}</p>
        </div>
      ))}
    </div>
  );
}
EOF

cat > src/lib/api-client.ts <<'EOF'
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchMetrics() {
  const res = await fetch(`${BASE_URL}/api/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  return res.json();
}

export async function fetchUsers(page = 1) {
  const res = await fetch(`${BASE_URL}/api/users?page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}
EOF

cat > src/api/routes.ts <<'EOF'
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "@/db/client";
import { metrics, users } from "@/db/schema";

const app = new Hono();

app.get("/api/metrics", async (c) => {
  const rows = await db.select().from(metrics);
  return c.json(rows);
});

app.get("/api/users", zValidator("query", z.object({ page: z.coerce.number().default(1) })), async (c) => {
  const { page } = c.req.valid("query");
  const rows = await db.select().from(users).limit(20).offset((page - 1) * 20);
  return c.json(rows);
});

export default app;
EOF

cat > src/db/schema.ts <<'EOF'
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});
EOF

cat > src/db/client.ts <<'EOF'
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(process.env.DATABASE_URL!, { schema });
EOF

# ── Test file ─────────────────────────────────────
mkdir -p src/__tests__

cat > src/__tests__/api.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import app from "../api/routes";

describe("API routes", () => {
  it("GET /api/metrics returns 200", async () => {
    const res = await app.request("/api/metrics");
    expect(res.status).toBe(200);
  });
});
EOF

# ── Minimal hand-written CLAUDE.md (typical starting point) ──
cat > CLAUDE.md <<'EOF'
# Acme Dashboard

A dashboard app built with Next.js and Hono.

## Commands

- `npm run dev` — start dev server
- `npm run build` — build
- `npm test` — run tests
EOF

# ── Drizzle config ────────────────────────────────
cat > drizzle.config.ts <<'EOF'
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
EOF

# ── Git commit so caliber can see history ─────────
git add -A
git commit -q -m "initial commit"

echo ""
echo "✅ Demo repo ready at: $DEMO_DIR"
echo ""
echo "Next steps:"
echo "  1. Ensure caliber is built:  npm run build  (in the caliber repo)"
echo "  2. Ensure LLM is configured: export ANTHROPIC_API_KEY=sk-ant-..."
echo "  3. Record the demo:          cd $(pwd) && vhs assets/demo.tape"
echo ""
