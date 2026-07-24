import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const overviewPath = path.resolve(dirname, '../../../docs/packages/data-types/overview.md');
const typesDir = path.resolve(dirname, '../src/types');
const v1Dir = path.join(typesDir, 'v1');

/**
 * Ensure that the Field Types list in `overview.md` stays up to date.
 */
describe('data-types overview.md', () => {
    const overview = readFileSync(overviewPath, 'utf8');

    // Every class-doc link target under the api dir, as its `types/...` path.
    const linkedPaths = [...overview.matchAll(/\.\/api\/(types\/[\w-/]+)\/classes\/default\.md/g)]
        .map((m) => m[1]);

    // Every v1 type, by source-file basename (the source of truth for the list).
    const v1Types = new Set(
        readdirSync(v1Dir)
            .filter((name) => name.endsWith('.ts'))
            .map((name) => name.replace(/\.ts$/, ''))
    );

    it('only links to types that exist (no dead links)', () => {
        const dead = linkedPaths
            .filter((p) => !existsSync(path.join(typesDir, '..', `${p}.ts`)))
            .sort();
        expect(dead).toEqual([]);
    });

    it('links to every v1 type (nothing missing from the list)', () => {
        const linkedV1 = new Set(
            linkedPaths
                .filter((p) => p.startsWith('types/v1/'))
                .map((p) => p.replace('types/v1/', ''))
        );
        const missing = [...v1Types].filter((name) => !linkedV1.has(name)).sort();
        expect(missing).toEqual([]);
    });
});
