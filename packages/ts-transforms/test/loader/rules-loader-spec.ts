import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { debugLogger, isPlainObject, has } from '@terascope/core-utils';
import { RulesLoader, OperationConfigInput } from '../../src';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('rules-loader', () => {
    const logger = debugLogger('rules-loader-test');

    async function getConfigList(fileName: string): Promise<OperationConfigInput[]> {
        const filePath = path.join(dirname, `../fixtures/${fileName}`);
        const myFileLoader = new RulesLoader({ rules: [filePath] }, logger);
        return myFileLoader.load();
    }

    it('can load from transform file', async () => {
        const results = await getConfigList('transformRules8.txt');

        expect(results).toBeArrayOfSize(2);
        expect(results[0].selector).toEqual('hello:world');
        expect(results[1].validation).toEqual('hexdecode');
    });

    it('can load from matcher file', async () => {
        const results = await getConfigList('matchRules1.txt');

        expect(results).toBeArrayOfSize(2);

        results.forEach((config) => {
            expect(isPlainObject(config)).toBeTrue();
            expect(has(config, 'selector')).toBeTrue();
        });
    });

    it('can load notifications', async () => {
        const notificationRules = 'some:thing AND other:thing \n last:thing OR really:lastThing';
        const notificationResults = notificationRules.split('\n').map((str) => ({ selector: str.trim() }));
        const dataLoader = new RulesLoader({ notification_rules: notificationRules }, logger);
        const results = await dataLoader.load();

        expect(results).toEqual(notificationResults);
    });
});
