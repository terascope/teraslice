import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'node:fs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const overviewPath = path.resolve(dirname, '../../../docs/packages/data-types/overview.md');
const v1Dir = path.resolve(dirname, '../src/types/v1');

/**
 * The Field Types list in `overview.md` should link to every v1 type
 * and only to v1 types that actually exist.
 */
describe('data-types overview.md', () => {
    const overview = readFileSync(overviewPath, 'utf8');

    // Every `./api/types/v1/<name>/classes/default.md` link target in the doc.
    const linkedTypes = new Set(
        [...overview.matchAll(/\.\/api\/types\/v1\/([\w-]+)\/classes\/default\.md/g)]
            .map((m) => m[1])
    );

    // Every v1 type, by source-file basename
    const sourceTypes = new Set(
        readdirSync(v1Dir)
            .filter((name) => name.endsWith('.ts'))
            .map((name) => name.replace(/\.ts$/, ''))
    );

    it('links to every v1 type (nothing missing from the list)', () => {
        const missing = [...sourceTypes].filter((name) => !linkedTypes.has(name)).sort();
        expect(missing).toEqual([]);
    });

    it('only links to v1 types that exist (no dead links)', () => {
        const dead = [...linkedTypes].filter((name) => !sourceTypes.has(name)).sort();
        expect(dead).toEqual([]);
    });
});
