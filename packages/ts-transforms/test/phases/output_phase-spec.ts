
import path from 'path';
import { DataEntity } from '@terascope/utils';
import { OutputPhase, Loader, OperationsManager, OperationConfig } from '../../src';

describe('post_process phase', () => {

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ type: 'transform', rules: [filePath] });
        return myFileLoader.load();
    }
    // rules is only used in loader
    const transformOpconfig = { rules: ['some/path'], type: 'transform' };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules22.txt');

        expect(() => new OutputPhase(transformOpconfig, configList, new OperationsManager())).not.toThrow();
    });

    it('can run and validate data for other_match_required', async () => {
        const configList = await getConfigList('transformRules16.txt');
        const postProcessPhase = new OutputPhase(transformOpconfig, configList, new OperationsManager());
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
        const outputPhase = new OutputPhase(transformOpconfig, configList, new OperationsManager());

        const data = [
            new DataEntity({ field: 'something' }),
            new DataEntity({ myjson: 'null' }),
            new DataEntity({ myjson: 'otherthing' })
        ];

        const results = outputPhase.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ field: 'something' });
    });

    it('can join _multi_target_fields', async () => {
        const configList = await getConfigList('transformRules19.txt');
        const outputPhase = new OutputPhase(transformOpconfig, configList, new OperationsManager());
        const metaData = { _multi_target_fields: {  myfield: { myfield0: true, myfield1: true }  } };
        const data = [
            new DataEntity({ myfield0: 'something' , myfield1: 'otherthing' }, metaData),
        ];

        const results = outputPhase.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ myfield: ['something', 'otherthing'] });
    });
});
