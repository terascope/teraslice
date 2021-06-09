import 'jest-extended';
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
