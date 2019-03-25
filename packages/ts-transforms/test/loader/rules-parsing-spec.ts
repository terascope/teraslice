
import path from 'path';
import _ from 'lodash';
import { debugLogger } from '@terascope/utils';
import { RulesLoader, RulesParser, OperationConfig, OperationConfigInput } from '../../src';

describe('Loader', () => {
    const logger = debugLogger('rules-loader-test');

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new RulesLoader({ rules: [filePath] }, logger);
        const configList = await myFileLoader.load();
        const rulesParser = new RulesParser(configList, logger);
        return rulesParser.parse();
    }

    function parseData(configList: OperationConfigInput[]) {
        const rulesParser = new RulesParser(configList, logger);
        return rulesParser.parse();
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

    it('can adds __id to every config', async() => {
        const results = await getConfigList('transformRules2.txt');
        const hasIds = _.every(results, obj => obj.__id != null);

        expect(hasIds).toBeTrue();
    });

    it('can convert empty selectors to *', async() => {
        const results = await getConfigList('transformRules3.txt');

        expect(results).toBeArrayOfSize(1);
        expect(results[0].selector).toEqual('*');
    });

    it('can convert tag selectors to tags', async() => {
        const results = await getConfigList('transformRules8.txt');

        expect(results).toBeArrayOfSize(2);
        expect(_.get(results, '[0].tags')).toEqual(['hexId']);
    });

    it('can seperate simple post/validation configs out to seperate configs', async() => {
        const results = await getConfigList('transformRules11.txt');
        const[config1, config2] = results;

        expect(results).toBeArrayOfSize(2);
        expect(config1.selector).toEqual('domain:example.com');
        expect(_.has(config1, 'tags')).toBeTrue();

        expect(_.has(config2, 'follow')).toBeTrue();
        expect(_.has(config2, '__id')).toBeTrue();

        const tags = config1.tags as string[];
        expect(tags.find(tag => tag === config2.follow) !== undefined).toBeTrue();
        expect(config2.post_process).toEqual('base64decode');
    });

    it('will throw with old style basic post processerors', () => {
        const configList = [
            {
                selector: 'hello:world',
                source_field: 'first',
                target_field: 'first_name',
                validation: 'string'
            },
            {
                selector: 'hello:world',
                post_process: 'join',
                fields: ['first_name', 'last_name'],
                delimiter: ' ',
                target_field: 'full_name'
            }
        ];

        expect(() => parseData(configList)).toThrowError();
    });
});
