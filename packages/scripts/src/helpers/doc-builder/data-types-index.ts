import path from 'node:path';
import fse from 'fs-extra';
import { PackageInfo } from '../interfaces.js';
import { writeIfChanged } from '../misc.js';
import { getDocPath } from '../packages.js';

const START_MARKER = '<!-- AUTO-GENERATED-DATA-TYPES:START -->';
const END_MARKER = '<!-- AUTO-GENERATED-DATA-TYPES:END -->';

/**
 * Scan the generated per-type doc dirs and return the kebab type names that
 * actually produced a `classes/default.md`. Scanning the generated dirs (rather
 * than the source files) guarantees every link in the index resolves.
 */
function listGeneratedTypes(typesDir: string): string[] {
    if (!fse.existsSync(typesDir)) return [];

    return fse.readdirSync(typesDir)
        .filter((name) => {
            const classDoc = path.join(typesDir, name, 'classes', 'default.md');
            return fse.statSync(path.join(typesDir, name)).isDirectory()
                && fse.existsSync(classDoc);
        })
        .sort();
}

function buildIndexBlock(types: string[]): string {
    const items = types
        .map((name) => `- [${name}](./api/types/v1/${name}/classes/default.md)`)
        .join('\n');

    return [
        START_MARKER,
        '',
        '## Field Types',
        '',
        items,
        '',
        END_MARKER,
    ].join('\n');
}

/**
 * Inject the generated block between the markers, leaving all other content
 * untouched. If the markers are missing, append the block to the end.
 */
function injectBlock(existing: string, block: string): string {
    const startIdx = existing.indexOf(START_MARKER);
    const endIdx = existing.indexOf(END_MARKER);

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const before = existing.slice(0, startIdx);
        const after = existing.slice(endIdx + END_MARKER.length);
        return `${before.replace(/\s+$/, '')}\n\n${block}\n\n${after.replace(/^\s+/, '')}`.trimEnd();
    }

    return `${existing.trimEnd()}\n\n${block}`;
}

/**
 * Regenerate the auto-generated data-types index inside the package's
 * `overview.md`. Scoped to `@terascope/data-types`; a no-op for other packages
 * and when no generated type docs exist.
 */
export async function updateDataTypesIndex(pkgInfo: PackageInfo, log?: boolean): Promise<void> {
    if (pkgInfo.name !== '@terascope/data-types') return;

    const typesDir = path.join('docs', pkgInfo.relativeDir, 'api', 'types', 'v1');
    const types = listGeneratedTypes(typesDir);
    if (!types.length) return;

    const overviewPath = getDocPath(pkgInfo, true, true);
    if (!fse.existsSync(overviewPath)) return;

    const existing = await fse.readFile(overviewPath, 'utf8');
    const contents = injectBlock(existing, buildIndexBlock(types));

    await writeIfChanged(overviewPath, contents, { log });
}
