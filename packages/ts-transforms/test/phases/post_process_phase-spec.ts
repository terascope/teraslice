
import { DataEntity } from '@terascope/job-components';
import PostProcessPhase from '../../src/phase_manager/post_process_phase';
import Loader from '../../src/loader';
import { OperationConfig } from '../../src/interfaces';

import path from 'path';

describe('post_process phase', () => {

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ type: 'transform', file_path: filePath });
        return myFileLoader.load();
    }
    // file_path is only used in loader
    const transformOpconfig = { file_path: 'some/path', type: 'transform' };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules1.txt');

        expect(() => new PostProcessPhase(transformOpconfig, configList)).not.toThrow();
    });

    it('has the proper properties', async () => {
        const configList1 = await getConfigList('transformRules1.txt');
        const postProcessPhase1 = new PostProcessPhase(transformOpconfig, configList1);

        expect(postProcessPhase1.hasProcessing).toEqual(false);
        expect(postProcessPhase1.phase).toBeDefined();
        expect(Object.keys(postProcessPhase1.phase).length).toEqual(0);

        const configList2 = await getConfigList('transformRules17.txt');
        const postProcessPhase2 = new PostProcessPhase(transformOpconfig, configList2);

        expect(postProcessPhase2.hasProcessing).toEqual(true);
        expect(postProcessPhase2.phase).toBeDefined();
        expect(Object.keys(postProcessPhase2.phase).length).toEqual(1);

        const postProcess = postProcessPhase2.phase['host:example.com'];

        expect(Array.isArray(postProcess)).toEqual(true);
        expect(postProcess.length).toEqual(1);
    });

    it('can run and process data', async () => {
        const configList = await getConfigList('transformRules17.txt');
        const postProcessPhase = new PostProcessPhase(transformOpconfig, configList);

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
