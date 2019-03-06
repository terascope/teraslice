
import path from 'path';
import _ from 'lodash';
import { debugLogger } from '@terascope/utils';
import { RulesLoader, RulesParser, OperationConfig, UnParsedConfig } from '../../src';

describe('Loader', () => {
    const logger = debugLogger('rules-loader-test');

    async function getConfigList(fileName: string): Promise<OperationConfig[]> {
        const filePath = path.join(__dirname, `../fixtures/${fileName}`);
        const myFileLoader = new RulesLoader({ rules: [filePath] }, logger);
        const configList = await myFileLoader.load();
        const rulesParser = new RulesParser(configList, logger);
        return rulesParser.parse();
    }

    function parseData(configList: UnParsedConfig[]) {
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
                target_field: 'first_name'
            },
            {
                selector: 'hello:world',
                source_field: 'last',
                target_field: 'last_name'
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

    it('can parse old style basic post processerors', () => {
        const parsedRules = parseData([
            {
                selector: 'hello:world',
                source_field:  'txt',
                target_field: 'hex',
                validation: 'hexdecode'
            }
        ]);

        const [config1, config2] = parsedRules;

        expect(parsedRules).toBeArray();
        expect(parsedRules).toBeArrayOfSize(2);

        expect(config1.selector).toEqual('hello:world');
        expect(config1.source_field).toEqual('txt');
        expect(config1.target_field).toEqual('hex');
        expect(config1.tags).toBeArray();

        expect(config2.follow === _.get(config1, 'tags[0]')).toBeTrue();
        expect(config2.validation).toEqual('hexdecode');
    });
});
