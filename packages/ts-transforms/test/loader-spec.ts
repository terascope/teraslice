
import path from 'path';
import { Loader, PhaseConfig } from '../src';

describe('Loader', () => {
    const matchRules1Path = path.join(__dirname, './fixtures/matchRules1.txt');
    const transformRules2Path = path.join(__dirname, './fixtures/transformRules2.txt');

    it('it can instantiate a matcher from file', async () => {
        const config: PhaseConfig = { rules: [matchRules1Path], type: 'matcher' };
        let loader: Loader;

        expect(() => {
            loader = new Loader(config);
        }).not.toThrow();

        // @ts-ignore
        const results = await loader.load();
        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ selector: 'some:data AND bytes:>=1000' });
        expect(results[1]).toEqual({ selector: 'other:/.*abc.*/ OR _created:>=2018-11-16T15:16:09.076Z' });
    });

    it('it can instantiate a transform with operations from file', async () => {
        const config: PhaseConfig = { rules: [transformRules2Path], type: 'transform' };
        let loader!: Loader;

        expect(() => {
            loader = new Loader(config);
        }).not.toThrow();

        const results = await loader.load();
        expect(results.length > 0).toEqual(true);
    });
});
