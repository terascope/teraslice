
import path from 'path';
import { DataEntity } from '@terascope/utils';
import { OutputPhase, Loader } from '../../src';
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
        const configList = await getConfigList('transformRules22.txt');

        expect(() => new OutputPhase(transformOpconfig, configList, new OperationsManager())).not.toThrow();
    });

    xit('can run and omit fields', async () => {
        const configList = await getConfigList('transformRules22.txt');
        const outputPhase = new OutputPhase(transformOpconfig, configList, new OperationsManager());

        const data = [
            new DataEntity({ some: 'value', field: 'something' }),
            new DataEntity({ some: 'value', field: 'null' }),
            new DataEntity({ some: 'value', field: 'otherthing' })
        ];

        const results = outputPhase.run(data);
        console.log('what are the results', results)
        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ newField: 'something' });
        expect(results[1]).toEqual({ newField: 'otherthing' });
    });
});
