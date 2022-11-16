import path from 'path';
import { fileURLToPath } from 'url';
import { debugLogger, isPlainObject, has } from '@terascope/utils';
import { RulesLoader, OperationConfigInput } from '../../src/index.js';

const dirPath = fileURLToPath(new URL('.', import.meta.url));

describe('rules-loader', () => {
    const logger = debugLogger('rules-loader-test');

    async function getConfigList(fileName: string): Promise<OperationConfigInput[]> {
        const filePath = path.join(dirPath, `../fixtures/${fileName}`);
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
