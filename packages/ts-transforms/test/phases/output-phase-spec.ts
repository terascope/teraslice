import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { debugLogger } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import {
    OutputPhase, Loader, OperationsManager, OutputValidation
} from '../../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('output phase', () => {
    const logger = debugLogger('outputPhaseTest');
    const opManager = new OperationsManager();

    async function getConfigList(fileName: string): Promise<OutputValidation> {
        const filePath = path.join(dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ rules: [filePath] }, logger);
        const { output } = await myFileLoader.load(opManager);
        return output;
    }
    // rules is only used in loader
    const transformOpconfig = { rules: ['some/path'] };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules22.txt');

        expect(() => new OutputPhase(transformOpconfig, configList, opManager)).not.toThrow();
    });

    it('can run and validate data for other_match_required', async () => {
        const configList = await getConfigList('transformRules16.txt');
        const postProcessPhase = new OutputPhase(transformOpconfig, configList, opManager);
        const date = new Date().toISOString();
        const data = [
            new DataEntity({ some: 'data', date }, { selectors: { 'fc2.com': true } }),
            new DataEntity({ date }, { selectors: { 'fc2.com': true } }),
        ];

        const results = postProcessPhase.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ some: 'data', date });
    });

    it('can run and omit fields', async () => {
        const configList = await getConfigList('transformRules21.txt');
        const outputPhase = new OutputPhase(transformOpconfig, configList, opManager);

        const data = [
            new DataEntity({ field: 'something' }),
            new DataEntity({ myjson: 'null' }),
            new DataEntity({ myjson: 'otherthing' })
        ];

        const results = outputPhase.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ field: 'something' });
    });
});
