import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { debugLogger } from '@terascope/core-utils';
import { DataEntity } from '@terascope/entity-utils';
import {
    SelectionPhase, Loader, OperationsManager,
    SelectorConfig, WatcherConfig
} from '../../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('selector phase', () => {
    const logger = debugLogger('selectorPhaseTest');
    const opManager = new OperationsManager();

    async function getConfigList(fileName: string): Promise<SelectorConfig[]> {
        const filePath = path.join(dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ rules: [filePath] }, logger);
        const { selectors } = await myFileLoader.load(opManager);
        return selectors;
    }
    // file_path is only used in loader
    const transformOpconfig = { rules: ['some/path'] };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules1.txt');

        expect(() => new SelectionPhase(transformOpconfig, configList, opManager)).not.toThrow();
    });

    it('has the proper properties', async () => {
        const configList = await getConfigList('transformRules1.txt');
        const selectorPhase = new SelectionPhase(transformOpconfig, configList, opManager);

        expect(selectorPhase.selectionPhase).toBeDefined();
        expect(selectorPhase.selectionPhase.length).toEqual(6);
    });

    it('can run data to match based on selector and types', async () => {
        const configList = await getConfigList('transformRules1.txt');
        const myOpConfig = {
            ...transformOpconfig,
            type_config: { location: 'geo' }
        } as WatcherConfig;
        const selectorPhase = new SelectionPhase(myOpConfig, configList, opManager);
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
        const selectorPhase = new SelectionPhase(transformOpconfig, configList, opManager);
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

    it('can loads only the appropriate selectors', async () => {
        const configList = await getConfigList('transformRules16.txt');
        const selectorPhase = new SelectionPhase(transformOpconfig, configList, opManager);
        // this is to check that a match-all has not been added
        // by the other_match_required or refs (ie the second and third config in file)
        expect(selectorPhase.selectionPhase).toBeArrayOfSize(2);
        // @ts-expect-error
        expect(selectorPhase.selectionPhase[0].selector).toEqual('host:fc2.com');
        // @ts-expect-error
        expect(selectorPhase.selectionPhase[1].selector).toEqual('*');
    });
});
