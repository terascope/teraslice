import 'jest-extended';
import { promises as fsp } from 'fs';
import path from 'path';
import { uniq } from '@terascope/utils';
import {
    functionConfigRepository,
    FunctionDefinitionConfig,
} from '../../src';
import { functionTestHarness } from './functionTestHarness';

describe('function configs', () => {
    Object.entries(functionConfigRepository).forEach(([key, fnDef]) => {
        if (key === 'addToDate') {
            functionTestHarness(fnDef as FunctionDefinitionConfig<any>, key);
        }
    });

    xit('should not have any duplicate names', () => {
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
    xit('should ensure that each config file is exported', async () => {
        const dirPath = path.join(__dirname, '..', '..', 'src', 'function-configs');
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

async function parseIndexFile(indexPath: string): Promise<string[]> {
    const indexFile = await fsp.readFile(indexPath, 'utf-8');

    return indexFile.split('\n').reduce((imports: string[], line) => {
        if (line.includes('import')) {
            imports.push(line.split('from', 2)[1].replace(/\W/g, ''));
        }

        return imports;
    }, []);
}
