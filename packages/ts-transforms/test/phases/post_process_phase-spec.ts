
import path from 'path';
import { DataEntity } from '@terascope/job-components';
import { PostProcessPhase, Loader } from '../../src';
import { OperationConfig } from '../../src/interfaces';
import { OperationsManager } from '../../src/operations';

describe('post_process phase', () => {

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ type: 'transform', rules: [filePath] });
        return myFileLoader.load();
    }
    // rules is only used in loader
    const transformOpconfig = { rules: ['some/path'], type: 'transform' };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules1.txt');

        expect(() => new PostProcessPhase(transformOpconfig, configList, new OperationsManager())).not.toThrow();
    });

    it('has the proper properties', async () => {
        const configList1 = await getConfigList('transformRules1.txt');
        const postProcessPhase1 = new PostProcessPhase(transformOpconfig, configList1, new OperationsManager());

        expect(postProcessPhase1.hasProcessing).toEqual(false);
        expect(postProcessPhase1.phase).toBeDefined();
        expect(Object.keys(postProcessPhase1.phase).length).toEqual(0);

        const configList2 = await getConfigList('transformRules17.txt');
        const postProcessPhase2 = new PostProcessPhase(transformOpconfig, configList2, new OperationsManager());

        expect(postProcessPhase2.hasProcessing).toEqual(true);
        expect(postProcessPhase2.phase).toBeDefined();
        expect(Object.keys(postProcessPhase2.phase).length).toEqual(1);

        const postProcess = postProcessPhase2.phase['host:example.com'];

        expect(Array.isArray(postProcess)).toEqual(true);
        expect(postProcess.length).toEqual(1);
    });

    it('can run and process data', async () => {
        const configList = await getConfigList('transformRules17.txt');
        const postProcessPhase = new PostProcessPhase(transformOpconfig, configList, new OperationsManager());

        function encode(str: string) {
            return Buffer.from(str).toString('base64');
        }
        const str = 'hello';
        const data = [
            new DataEntity({ host: 'www.example.com', field1: `${encode(str)}` }, { selectors: { 'host:example.com': true } }),
            new DataEntity({ host: 'www.example.com', field1: {} }, { selectors: { 'host:example.com': true } }),
            new DataEntity({ host: 'www.example.com', url: 'http://hello.com?field1=hello&value4=goodbye' }, { selectors: { 'host:example.com': true } })
        ];

        const results = postProcessPhase.run(data);

        expect(results.length).toEqual(3);
        expect(results[0]).toEqual({ host: 'www.example.com', field1: 'hello' });
        expect(results[1]).toEqual({ host: 'www.example.com' });
        expect(results[2]).toEqual(data[2]);
    });
});
