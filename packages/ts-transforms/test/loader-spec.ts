
import path from 'path';
import Loader from '../src/loader';
import { WatcherConfig } from '../src/interfaces';

describe('Loader', () => {
    const matchRules1Path = path.join(__dirname, './fixtures/matchRules1.txt');
    const transformRules2Path = path.join(__dirname, './fixtures/transformRules2.txt');
    const transformRules16Path = path.join(__dirname, './fixtures/transformRules16.txt');

    it('it can instantiate a matcher from file', async () => {
        const config: WatcherConfig = { file_path: matchRules1Path, type: 'matcher' };
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
        const config: WatcherConfig = { file_path: transformRules2Path, type: 'transform' };
        let loader: Loader;

        expect(() => {
            loader = new Loader(config);
        }).not.toThrow();

        // @ts-ignore
        const results = await loader.load();
        expect(results.length > 0).toEqual(true);
    });

    it('it will not add selector: * to config with refs and other_match_required', async () => {
        const config: WatcherConfig = { file_path: transformRules16Path, type: 'transform' };
        let loader: Loader;

        expect(() => {
            loader = new Loader(config);
        }).not.toThrow();

        // @ts-ignore
        const results = await loader.load();
        expect(results.length === 3).toEqual(true);

        const selectors = results.filter(config => config.selector != null);

        expect(selectors.length).toEqual(1);
        expect(selectors[0]).toEqual({ selector: 'host:fc2.com', source_field: 'field1', start: 'field1=', end: 'EOP', target_field: 'field1', tag: 'ID1' });
    });

});
