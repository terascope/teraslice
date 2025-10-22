import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    debugLogger, has, isPlainObject,
    get
} from '@terascope/core-utils';
import {
    RulesLoader, RulesParser, OperationConfig,
    OperationConfigInput
} from '../../src';

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Loader', () => {
    const logger = debugLogger('rules-loader-test');

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(dirname, `../fixtures/${fileName}`);
        const myFileLoader = new RulesLoader({ rules: [filePath] }, logger);
        const configList = await myFileLoader.load();
        const rulesParser = new RulesParser(configList, logger);
        return rulesParser.parse();
    }

    function parseData(configList: OperationConfigInput[]) {
        const rulesParser = new RulesParser(configList, logger);
        return rulesParser.parse();
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

    it('can adds __id to every config', async () => {
        const results = await getConfigList('transformRules2.txt');
        const hasIds = results.every((obj) => obj.__id != null);

        expect(hasIds).toBeTrue();
    });

    it('can convert empty selectors to *', async () => {
        const results = await getConfigList('transformRules3.txt');

        expect(results).toBeArrayOfSize(1);
        expect(results[0].selector).toEqual('*');
    });

    it('can convert tag selectors to tags', async () => {
        const results = await getConfigList('transformRules8.txt');

        expect(results).toBeArrayOfSize(2);
        expect(get(results, '[0].tags')).toEqual(['hexId']);
    });

    it('can seperate simple post/validation configs out to seperate configs', async () => {
        const results = await getConfigList('transformRules11.txt');
        const [config1, config2] = results;

        expect(results).toBeArrayOfSize(2);
        expect(config1.selector).toEqual('domain:example.com');
        expect(has(config1, 'tags')).toBeTrue();

        expect(has(config2, 'follow')).toBeTrue();
        expect(has(config2, '__id')).toBeTrue();

        const tags = config1.tags as string[];
        expect(tags.find((tag) => tag === config2.follow) !== undefined).toBeTrue();
        expect(config2.post_process).toEqual('base64decode');
    });

    it('will throw with old style basic post processerors', () => {
        const configList = [
            {
                selector: 'hello:world',
                source: 'first',
                target: 'first_name',
                validation: 'string'
            },
            {
                selector: 'hello:world',
                post_process: 'join',
                fields: ['first_name', 'last_name'],
                delimiter: ' ',
                target: 'full_name'
            }
        ];

        expect(() => parseData(configList)).toThrow();
    });

    it('will convert source_field => source, target_fields => target', () => {
        const configList = [
            {
                selector: 'hello:world',
                source_field: 'first',
                target_field: 'first_name',
                tag: 'someTag'
            },
            {
                follow: 'someTag',
                target_field: 'full_name',
                exp: 'true'
            }
        ];

        const [selectorConfig, postConfig] = parseData(configList);

        expect(selectorConfig.source).toEqual(configList[0].source_field);
        expect(selectorConfig.target).toEqual(configList[0].target_field);

        expect(postConfig.target).toEqual(configList[1].target_field);
    });
});
