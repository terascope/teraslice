import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataEntity, debugLogger } from '@terascope/core-utils';
import {
    OperationsManager, PostProcessPhase, Loader,
    PostProcessingDict
} from '../../src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('post_process phase', () => {
    const logger = debugLogger('postProcessPhaseTest');
    const opManager = new OperationsManager();

    async function getConfigList(fileName: string): Promise<PostProcessingDict> {
        const filePath = path.join(dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ rules: [filePath] }, logger);
        const { postProcessing } = await myFileLoader.load(opManager);
        return postProcessing;
    }
    // rules is only used in loader
    const transformOpconfig = { rules: ['some/path'] };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules1.txt');
        expect(() => new PostProcessPhase(transformOpconfig, configList, opManager)).not.toThrow();
    });

    it('has the proper properties', async () => {
        const configList1 = await getConfigList('transformRules3.txt');
        const postProcessPhase1 = new PostProcessPhase(transformOpconfig, configList1, opManager);

        expect(postProcessPhase1.hasProcessing).toEqual(false);
        expect(postProcessPhase1.phase).toBeDefined();
        expect(Object.keys(postProcessPhase1.phase).length).toEqual(0);

        const configList2 = await getConfigList('transformRules17.txt');
        const postProcessPhase2 = new PostProcessPhase(transformOpconfig, configList2, opManager);

        expect(postProcessPhase2.hasProcessing).toEqual(true);
        expect(postProcessPhase2.phase).toBeDefined();
        expect(Object.keys(postProcessPhase2.phase).length).toEqual(1);

        const postProcess = postProcessPhase2.phase['host:example.com'];

        expect(Array.isArray(postProcess)).toEqual(true);
        expect(postProcess.length).toEqual(1);
    });

    it('can run and process data', async () => {
        const configList = await getConfigList('transformRules17.txt');
        const postProcessPhase = new PostProcessPhase(transformOpconfig, configList, opManager);

        function encode(s: string) {
            return Buffer.from(s).toString('base64');
        }
        const str = 'hello';
        const data = [
            new DataEntity({ host: 'www.example.com', field1: `${encode(str)}` }, { selectors: ['host:example.com'] }),
            new DataEntity({ host: 'www.example.com', field1: {} }, { selectors: ['host:example.com'] }),
            new DataEntity(
                { host: 'www.example.com', url: 'http://hello.com?field1=hello&value4=goodbye' },
                { selectors: ['host:example.com'] }
            ),
        ];

        const results = postProcessPhase.run(data);

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual({ host: 'www.example.com', field1: 'hello' });
        expect(results[1]).toEqual({ host: 'www.example.com' });
        expect(results[2]).toEqual(data[2]);
    });

    it('can run and validate data', async () => {
        const configList = await getConfigList('transformRules22.txt');
        const postProcessPhase = new PostProcessPhase(transformOpconfig, configList, opManager);

        const data = [
            new DataEntity({ newField: 'null' }, { selectors: ['some:value'] }),
            new DataEntity({ newField: 'other' }, { selectors: ['some:value'] }),
        ];

        const results = postProcessPhase.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ newField: 'other' });
    });
});
