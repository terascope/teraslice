import 'jest-extended';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { debugLogger } from '@terascope/core-utils';
import { Loader, PhaseConfig, OperationsManager } from '../../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Loader', () => {
    const logger = debugLogger('loader-test');
    const opsManager = new OperationsManager();
    const matchRules1Path = path.join(dirname, '../fixtures/matchRules1.txt');
    const transformRules2Path = path.join(dirname, '../fixtures/transformRules2.txt');

    it('will not throw with a matcher config', async () => {
        const config: PhaseConfig = { rules: [matchRules1Path], type: 'matcher' };
        expect(() => new Loader(config, logger)).not.toThrow();
    });

    it('will not throw with a transform config', async () => {
        const config: PhaseConfig = { rules: [transformRules2Path], type: 'transform' };
        expect(() => new Loader(config, logger)).not.toThrow();
    });

    it('should instantiate a matcher from file', async () => {
        const config: PhaseConfig = { rules: [matchRules1Path], type: 'matcher' };
        const loader = new Loader(config, logger);

        const phaseConfig = await loader.load(opsManager);
        const { selectors } = phaseConfig;
        const results = selectors.map((obj) => ({ selector: obj.selector }));

        expect(selectors).toBeArrayOfSize(2);
        expect(results[0]).toEqual({ selector: 'some:data AND bytes:>=1000' });
        expect(results[1]).toEqual({ selector: 'other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z' });
    });

    it('should instantiate a transform with operations from file', async () => {
        const config: PhaseConfig = { rules: [transformRules2Path], type: 'transform' };
        const loader = new Loader(config, logger);

        const phaseConfig = await loader.load(opsManager);
        const {
            selectors, extractions, postProcessing, output
        } = phaseConfig;
        const { matchRequirements, restrictOutput } = output;
        const results = selectors.map((obj) => ({ selector: obj.selector }));

        expect(selectors).toBeArrayOfSize(2);
        expect(results[0]).toEqual({ selector: 'hello:world' });
        expect(results[1]).toEqual({ selector: 'geo:true' });

        expect(extractions).not.toBeEmpty();
        expect(postProcessing['geo:true']).toBeArrayOfSize(2);
        expect(postProcessing['hello:world']).toBeArrayOfSize(1);

        expect(postProcessing).not.toBeEmpty();

        expect(matchRequirements).toBeEmpty();
        expect(restrictOutput).toEqual({ first_name: true, last_name: true });
    });
});
