
import path from 'path';
import { DataEntity } from '@terascope/job-components';
import { ValidationPhase, Loader } from '../../src';
import { OperationConfig } from '../../src/interfaces';
import { OperationsManager } from '../../src/operations';

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

        const configList2 = await getConfigList('transformRules16.txt');
        const postProcessPhase2 = new ValidationPhase(transformOpconfig, configList2, new OperationsManager());

        expect(postProcessPhase2.hasProcessing).toEqual(true);
        expect(postProcessPhase2.phase).toBeDefined();
        expect(postProcessPhase2.phase['__all']).toBeDefined();
        expect(postProcessPhase2.phase['__all'].length).toEqual(1);

        expect(Object.keys(postProcessPhase2.phase).length).toEqual(1);
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

    it('can run and validate data for other_match_required', async () => {
        const configList = await getConfigList('transformRules16.txt');
        const postProcessPhase = new ValidationPhase(transformOpconfig, configList, new OperationsManager());
        const date = new Date().toISOString();
        const data = [
            new DataEntity({ some: 'data', date }, { selectors: { 'fc2.com': true } }),
            new DataEntity({ date }, { selectors: { 'fc2.com': true } }),
        ];

        const results = postProcessPhase.run(data);

        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({ some: 'data', date });
    });
});
