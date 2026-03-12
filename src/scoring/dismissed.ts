import fs from 'fs';
import path from 'path';
import { CALIBER_DIR } from '../constants.js';

const DISMISSED_FILE = path.join(CALIBER_DIR, 'dismissed-checks.json');

export interface DismissedCheck {
  id: string;
  reason: string;
  dismissedAt: string;
}

export function readDismissedChecks(): DismissedCheck[] {
  try {
    if (!fs.existsSync(DISMISSED_FILE)) return [];
    return JSON.parse(fs.readFileSync(DISMISSED_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function writeDismissedChecks(checks: DismissedCheck[]): void {
  if (!fs.existsSync(CALIBER_DIR)) {
    fs.mkdirSync(CALIBER_DIR, { recursive: true });
  }
  fs.writeFileSync(DISMISSED_FILE, JSON.stringify(checks, null, 2) + '\n');
}

export function getDismissedIds(): Set<string> {
  return new Set(readDismissedChecks().map(c => c.id));
}
