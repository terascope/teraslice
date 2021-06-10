import 'jest-extended';
import fs from 'fs-extra';
import path from 'path';
import { uniq } from '@terascope/utils';
import {
    functionConfigRepository,
    FunctionDefinitionConfig,
} from '../../src';
import { functionTestHarness } from './functionTestHarness';

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
    const dirPath = path.join(__dirname, '..', '..', 'src', 'function-configs');

    const configDirs = fs.readdirSync(dirPath);

    for (const item of configDirs) {
        // ignore non-directories
        if (item.includes('.ts')) continue;

        const functionPath = path.join(dirPath, item);

        const imports = parseIndexFile(path.join(functionPath, 'index.ts'));

        const configFiles = fs.readdirSync(functionPath).filter((i) => !(i.includes('utils') || i === 'index.ts'));

        for (const f of configFiles) {
            it(`${f} should be exported by ${item}`, () => {
                expect(imports.includes(f.split('.')[0])).toBeTrue();
            });
        }
    }
});

function parseIndexFile(indexPath: string): string[] {
    const indexFile = fs.readFileSync(indexPath, 'utf-8');

    return indexFile.split('\n').reduce((imports: string[], line) => {
        if (line.includes('import')) {
            imports.push(line.split('from')[1].replace(/\W/g, ''));
        }

        return imports;
    }, []);
}
