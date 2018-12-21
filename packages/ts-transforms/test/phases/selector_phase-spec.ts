
import { DataEntity } from '@terascope/job-components';
import SelectorPhase from '../../src/phase_manager/selector_phase';
import Loader from '../../src/loader';
import { OperationConfig } from '../../src/interfaces';

import path from 'path';

describe('selector phase', () => {

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ type: 'transform', file_path: filePath });
        return myFileLoader.load();
    }
    // file_path is only used in loader
    const transformOpconfig = { file_path: 'some/path', type: 'transform' };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules1.txt');

        expect(() => new SelectorPhase(transformOpconfig, configList)).not.toThrow();
    });

    it('has the proper properties', async () => {
        const configList = await getConfigList('transformRules1.txt');
        const selectorPhase = new SelectorPhase(transformOpconfig, configList);

        expect(selectorPhase.selectionPhase).toBeDefined();
        expect(selectorPhase.selectionPhase.length).toEqual(6);
    });

    it('can run data to match based on selector and selector_config', async () => {
        const configList = await getConfigList('transformRules1.txt');
        const myOpConfig = Object.assign({}, transformOpconfig, { selector_config: { location: 'geo' } });
        const selectorPhase = new SelectorPhase(myOpConfig, configList);
        const data = DataEntity.makeArray([
            { some: 'data', isTall: true },
            { some: 'thing else', person: {} },
            { hostname: 'www.example.com', bytes: 1000 },
            { location: '33.435967,-111.867710', zip: 94302 },
            {}
        ]);

        const results = selectorPhase.run(data);

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual(data[0]);
        expect(results[1]).toEqual(data[2]);
        expect(results[2]).toEqual(data[3]);
    });

    it('can match all', async () => {
        const configList = await getConfigList('transformRules3.txt');
        const selectorPhase = new SelectorPhase(transformOpconfig, configList);
        const data = DataEntity.makeArray([
            { some: 'data', isTall: true },
            { some: 'thing else', person: {} },
            { hostname: 'www.example.com', bytes: 1000 },
            { location: '33.435967,-111.867710', zip: 94302 },
            {},
            { 'asdpf98| aof': 1212387961234 }
        ]);

        const results = selectorPhase.run(data);

        expect(results.length).toEqual(6);
    });

    it('can loads only the appropriate selectors and disregards certain ones', async () => {
        const configList = await getConfigList('transformRules16.txt');
        const selectorPhase = new SelectorPhase(transformOpconfig, configList);

        // this is to check that a match-all has not been added
        // by the other_match_required or refs (ie the second and third config in file)
        expect(selectorPhase.selectionPhase.length).toEqual(1);
        expect(selectorPhase.selectionPhase[0].selector).toEqual('host:fc2.com');
    });
});
