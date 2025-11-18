import 'jest-extended';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uniq } from '@terascope/core-utils';
import { functionConfigRepository, FunctionDefinitionConfig } from '../../src/index.js';
import { functionTestHarness } from './functionTestHarness.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('function configs', () => {
    Object.entries(functionConfigRepository).forEach(([key, fnDef]) => {
        functionTestHarness(fnDef as FunctionDefinitionConfig<any>, key);
    });

    it('should not have any duplicate names', () => {
        function* allFnNames(): Iterable<string> {
            for (const fnDef of Object.values(functionConfigRepository)) {
                yield fnDef.name.toLowerCase();

                if (fnDef.aliases) yield* fnDef.aliases.map((s: string) => s.toLowerCase());
            }
        }
        const names = Array.from(allFnNames());
        expect(names).toEqual(uniq(names));
    });
});

describe('function registries', () => {
    it('should ensure that each config file is exported', async () => {
        const dirPath = path.join(dirname, '..', '..', 'src', 'function-configs');
        const configDirs = await fsp.readdir(dirPath);

        for (const item of configDirs) {
            // ignore non-directories
            if (item.endsWith('.ts')) continue;

            const functionPath = path.join(dirPath, item);

            const imports = await parseIndexFile(path.join(functionPath, 'index.ts'));
            const configFiles = await fsp.readdir(functionPath);

            for (const f of configFiles.filter((i) => !(i.endsWith('utils.ts') || i === 'index.ts'))) {
                expect(imports.includes(f.split('.')[0])).toBeTrue();
            }
        }
    });
});

function sanitize(file: string) {
    return file.replace('.js', '').replace(/\W/g, '');
}

async function parseIndexFile(indexPath: string): Promise<string[]> {
    const indexFile = await fsp.readFile(indexPath, 'utf-8');

    return indexFile.split('\n').reduce((imports: string[], line) => {
        if (line.includes('import')) {
            const sourceFile = line.split('from', 2)[1];
            imports.push(sanitize(sourceFile));
        }

        return imports;
    }, []);
}
