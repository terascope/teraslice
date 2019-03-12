
import path from 'path';
import _ from 'lodash';
import { debugLogger } from '@terascope/utils';
import { RulesLoader, UnparsedConfig } from '../../src';

describe('rules-loader', () => {
    const logger = debugLogger('rules-loader-test');

    async function getConfigList(fileName: string): Promise<UnparsedConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new RulesLoader({ rules: [filePath] }, logger);
        return await myFileLoader.load();
    }

    it('can load from transform file', async() => {
        const results = await getConfigList('transformRules8.txt');

        expect(results).toBeArrayOfSize(2);
        expect(results[0].selector).toEqual('hello:world');
        expect(results[1].validation).toEqual('hexdecode');
    });

    it('can load from matcher file', async() => {
        const results = await getConfigList('matchRules1.txt');

        expect(results).toBeArrayOfSize(2);

        results.forEach((config) => {
            expect(_.isObject(config)).toBeTrue();
            expect(_.has(config, 'selector')).toBeTrue();
        });
    });
});
