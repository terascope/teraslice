
import path from 'path';
import { DataEntity } from '@terascope/utils';
import { ValidationPhase, Loader, OperationConfig, OperationsManager } from '../../src';

describe('validation phase', () => {

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new Loader({ type: 'transform', rules: [filePath] });
        return myFileLoader.load();
    }
    // file_path is only used in loader
    const transformOpconfig = { rules: ['some/path'], type: 'transform' };

    it('can instantiate', async () => {
        const configList = await getConfigList('transformRules1.txt');

        expect(() => new ValidationPhase(transformOpconfig, configList, new OperationsManager())).not.toThrow();
    });

    it('has the proper properties', async () => {
        const configList1 = await getConfigList('transformRules5.txt');
        const postProcessPhase1 = new ValidationPhase(transformOpconfig, configList1, new OperationsManager());

        expect(postProcessPhase1.hasProcessing).toEqual(false);
        expect(postProcessPhase1.phase).toBeDefined();
        expect(Object.keys(postProcessPhase1.phase).length).toEqual(0);
    });

    it('can run and validate data', async () => {
        const configList = await getConfigList('transformRules4.txt');
        const postProcessPhase = new ValidationPhase(transformOpconfig, configList, new OperationsManager());

        const data = [
            new DataEntity({ full_name: 'John Doe' }, { selectors: { 'hello:world': true } }),
            new DataEntity({ full_name: true }, { selectors: { 'hello:world': true } }),
        ];

        const results = postProcessPhase.run(data);

        expect(results.length).toEqual(2);
        expect(results[0]).toEqual({ full_name: 'John Doe' });
        expect(results[1]).toEqual({ full_name: 'true' });

    });
});
