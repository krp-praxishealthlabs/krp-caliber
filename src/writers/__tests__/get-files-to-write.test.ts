import { describe, it, expect } from 'vitest';
import { getFilesToWrite } from '../index.js';

describe('getFilesToWrite', () => {
    it('returns skill paths matching the OpenSkills directory format', () => {
        const files = getFilesToWrite({
            targetAgent: ['claude'],
            claude: {
                claudeMd: '# Test',
                skills: [
                    { name: 'My Skill', description: 'desc', content: 'body' },
                    { name: 'another-one', description: 'desc', content: 'body' },
                ],
            },
        });

        expect(files).toContain('.claude/skills/my-skill/SKILL.md');
        expect(files).toContain('.claude/skills/another-one/SKILL.md');
        expect(files).not.toContain('.claude/skills/my-skill.md');
        expect(files).not.toContain('.claude/skills/another-one.md');
    });
});
