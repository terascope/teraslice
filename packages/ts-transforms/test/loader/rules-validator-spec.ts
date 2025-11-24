import 'jest-extended';
import { jest } from '@jest/globals';
import { debugLogger, cloneDeep } from '@terascope/core-utils';
import { isPrimaryConfig } from '../../src/loader/utils.js';
import {
    RulesValidator,
    RulesParser,
    OperationConfig,
    OperationConfigInput,
    OperationsManager,
    PluginList
} from '../../src/index.js';

describe('rules-validator', () => {
    const testLogger = debugLogger('rules-validator-test');

    function parseData(configList: OperationConfigInput[]) {
        const rulesParser = new RulesParser(configList, testLogger);
        return rulesParser.parse();
    }

    const basicExtractionConfig = parseData([
        {
            selector: 'hello:world',
            source: 'first',
            target: 'first_name',
        },
        {
            selector: 'hello:world',
            source: 'last',
            target: 'last_name',
        },
    ]);

    const basicExpressionConfig = parseData([
        {
            selector: 'hello:world',
            target: 'value',
            exp: '20'
        },
        {
            selector: 'hello:world',
            source: 'field',
            target: 'target',
        },
    ]);

    const mutateExtractionConfig = parseData([
        {
            selector: 'hello:world',
            source: 'first',
            target: 'first_name',
        },
        {
            selector: 'other:thing',
            source: 'other',
            target: 'thing',
            mutate: true,
        },
    ]);

    const mutateExtractionPostProcessConfig = parseData([
        {
            selector: 'hello:world',
            source: 'first',
            target: 'first_name',
            tag: 'someTag',
        },
        {
            follow: 'someTag',
            post_process: 'extraction',
            source: 'other',
            target: 'thing',
            tag: 'otherTag',
        },
        {
            follow: 'otherTag',
            post_process: 'extraction',
            source: 'some',
            target: 'otherthing',
            mutate: false,
        },
    ]);

    const multiSelectorConfig = parseData([
        {
            selector: 'hello:world',
            source: 'first',
            target: 'first_name',
        },
        {
            selector: 'other:things',
            source: 'last',
            target: 'last_name',
        },
        {
            source: 'person',
            target: 'valid_person',
            mutate: true,
        },
    ]);

    const postSelector = parseData([
        {
            selector: 'hello:world',
            source: 'first',
            target: 'first_name',
            tag: 'hello',
        },
        {
            follow: 'hello',
            post_process: 'selector',
            selector: 'first:name',
        },
    ]);

    const basicPostProcessing = parseData([
        {
            selector: 'hello:world',
            source: 'first',
            target: 'first_name',
        },
        {
            selector: 'hello:world',
            source: 'hex',
            target: 'decoded',
            output: false,
            tag: 'someTag',
        },
        {
            follow: 'someTag',
            post_process: 'hexdecode',
        },
    ]);

    const basicExpressionPostProcessing = parseData([
        {
            selector: 'hello:world',
            source: 'first_name',
            target: 'first',
            output: false,
            tag: 'someTag',
        },
        {
            follow: 'someTag',
            post_process: 'extraction',
            exp: 'first + " Doe"',
            target: 'final'
        },
    ]);

    const defaultExpressionPostProcessing = parseData([
        {
            selector: 'hello:world',
            source: 'first_name',
            target: 'first',
            output: false,
            tag: 'someTag',
        },
        {
            follow: 'someTag',
            exp: 'first + " Doe"',
            target: 'final'
        },
    ]);

    const chainedRules1 = parseData([
        {
            source: 'somefield',
            start: 'value=',
            end: 'EOP',
            target: 'hashoutput',
            tag: 'source',
        },
        {
            follow: 'source',
            post_process: 'base64decode',
            tag: 'hash_field',
        },
        {
            follow: 'hash_field',
            post_process: 'urldecode',
            tag: 'urldecoded',
        },
        {
            follow: 'urldecoded',
            post_process: 'jsonparse',
            tag: 'parsed',
        },
    ]);

    const newJoinRules = parseData([
        {
            selector: 'hello:world',
            source: 'first',
            target: 'first_name',
            tag: 'A',
        },
        {
            selector: 'hello:world',
            source: 'last',
            target: 'last_name',
            tag: 'A',
        },
        {
            follow: 'A',
            post_process: 'join',
            fields: ['first_name', 'last_name'],
            delimiter: ' ',
            target: 'full_name',
        },
    ]);

    const oneToOne = parseData([
        {
            selector: 'hello:world',
            source: 'inc_byte',
            target: 'byte',
            tag: 'A',
        },
        {
            selector: 'hello:world',
            source: 'person.age',
            target: 'age',
            tag: 'A',
        },
        {
            follow: 'A',
            validation: 'number',
        },
    ]);

    const cyclicRules = parseData([
        {
            source: 'somefield',
            start: 'value=',
            end: 'EOP',
            target: 'hashoutput',
            tag: 'source',
        },
        {
            follow: 'parsed',
            post_process: 'base64decode',
            tag: 'hash_field',
        },
        {
            follow: 'hash_field',
            post_process: 'urldecode',
            tag: 'urldecoded',
        },
        {
            follow: 'urldecoded',
            post_process: 'jsonparse',
            tag: 'parsed',
        },
    ]);

    const matchRequiredError = parseData([
        {
            selector: 'some:selector',
            source: 'somefield',
            start: 'value=',
            end: 'EOP',
            other_match_required: true,
            target: 'hashoutput',
            tag: 'source',
        },
        {
            selector: 'thing:other',
            source: 'somefield',
            start: 'value=',
            end: 'EOP',
            target: 'hashoutput',
            tag: 'source',
        },
        {
            follow: 'source',
            post_process: 'base64decode',
            tag: 'hash_field',
        },
        {
            follow: 'hash_field',
            post_process: 'urldecode',
            tag: 'urldecoded',
        },
        {
            follow: 'urldecoded',
            post_process: 'jsonparse',
            tag: 'parsed',
        },
    ]);

    const followTagError = parseData([
        {
            selector: 'some:selector',
            source: 'somefield',
            start: 'value=',
            end: 'EOP',
            other_match_required: true,
            target: 'hashoutput',
        },
        {
            follow: 'source',
            post_process: 'base64decode',
            tag: 'hash_field',
        },
        {
            follow: 'hash_field',
            post_process: 'urldecode',
        },
    ]);

    const multipleSources = parseData([
        { source: 'field1', target: 'fields', tag: 'fields' },
        { source: 'field2', target: 'fields', tag: 'fields' },
        { source: 'field3', target: 'fields', tag: 'fields' },
        { source: 'field4', target: 'fields', tag: 'fields' },
        { follow: 'fields', post_process: 'array', target: 'fields' }
    ]);

    const multiOutput = parseData([
        {
            selector: 'some:value', source: 'other', target: 'field', tag: 'hello', output: false
        },
        {
            post_process: 'extraction', target: 'first_copy', follow: 'hello', mutate: true
        },
        {
            source: 'key', target: 'key', other_match_required: true, mutate: true
        },
    ]);

    function constructValidator(
        configList: OperationConfig[],
        Plugins?: PluginList,
        logger = testLogger
    ) {
        const opsManager = new OperationsManager(Plugins);
        return new RulesValidator(configList, opsManager, logger);
    }

    describe('selector phase configs', () => {
        it('will throw an error is no selectors where found', () => {
            const validator = constructValidator([]);
            expect(() => validator.validate()).toThrowWithMessage(
                Error,
                'Invalid configuration file, no selector configurations where found'
            );
        });
        // TODO: look to combine this to an each call
        it('can return an array of selectors from basicExtractionConfig', () => {
            const validator = constructValidator(basicExtractionConfig);
            const { selectors } = validator.validate();
            const results = [basicExtractionConfig[0]];

            expect(selectors).toEqual(results);
        });

        it('can return an array of selectors from multiSelectorConfig', () => {
            const validator = constructValidator(multiSelectorConfig);
            const { selectors } = validator.validate();
            const results = multiSelectorConfig.filter(isPrimaryConfig);

            expect(selectors).toEqual(results);
        });

        it('can return an array of selectors from postSelector', () => {
            const validator = constructValidator(postSelector);
            const { selectors } = validator.validate();
            const results = postSelector.filter(isPrimaryConfig);

            expect(selectors).toEqual(results);
        });
    });

    describe('extractions', () => {
        it('can return an basic extractions formatted correctly', () => {
            const validator = constructValidator(basicExtractionConfig);
            const { extractions } = validator.validate();
            const results: Record<string, OperationConfig[]> = {};
            results['hello:world'] = basicExtractionConfig;

            expect(extractions).toEqual(results);
        });

        it('can return an expression extractions formatted correctly', () => {
            const validator = constructValidator(basicExpressionConfig);
            const { extractions } = validator.validate();
            const results: Record<string, OperationConfig[]> = {};
            results['hello:world'] = basicExpressionConfig;

            expect(extractions).toEqual(results);
        });

        it('can multiple extractions', () => {
            const validator = constructValidator(multiSelectorConfig);
            const { extractions } = validator.validate();
            const results: Record<string, OperationConfig[]> = {};

            results['hello:world'] = [multiSelectorConfig[0]];
            results['other:things'] = [multiSelectorConfig[1]];
            results['*'] = [multiSelectorConfig[2]];

            expect(extractions).toEqual(results);
        });

        it('can work with newJoinRules', () => {
            const validator = constructValidator(newJoinRules);
            const { extractions } = validator.validate();
            const results: Record<string, OperationConfig[]> = {};

            results['hello:world'] = newJoinRules.slice(0, 2);

            expect(extractions['hello:world'].length).toEqual(2);
            expect(extractions).toEqual(results);
        });

        it('can add mutate defaults to extraction configs', () => {
            const validator = constructValidator(mutateExtractionConfig);
            const {
                extractions: {
                    'hello:world': [config1],
                    'other:thing': [config2],
                },
            } = validator.validate();

            expect(config1.mutate).toEqual(false);
            expect(config2.mutate).toEqual(false);
        });
    });

    describe('postProcess', () => {
        it('can return an empty array if there is no post processing to do', () => {
            const validator = constructValidator(basicExtractionConfig);
            const { postProcessing } = validator.validate();

            expect(postProcessing).toBeEmpty();
        });

        it('can return a mapping of basic post processing', () => {
            const validator = constructValidator(basicPostProcessing);
            const {
                postProcessing: { 'hello:world': results },
            } = validator.validate();

            expect(results).toBeArrayOfSize(1);
            expect(results[0].post_process).toEqual('hexdecode');
            expect(results[0].source).toEqual('decoded');
            expect(results[0].target).toEqual('decoded');
        });

        it('can return a mapping of basic expression post processing', () => {
            const validator = constructValidator(basicExpressionPostProcessing);
            const {
                postProcessing: { 'hello:world': results },
            } = validator.validate();

            expect(results).toBeArrayOfSize(1);
            expect(results[0].post_process).toEqual('extraction');
            expect(results[0].source).toEqual('first');
            expect(results[0].target).toEqual('final');
        });

        it('can extraction in post processing does not have to specify post_process field', () => {
            const validator = constructValidator(defaultExpressionPostProcessing);
            const {
                postProcessing: { 'hello:world': results },
            } = validator.validate();

            expect(results).toBeArrayOfSize(1);
            expect(results[0].post_process).toEqual('extraction');
            expect(results[0].source).toEqual('first');
            expect(results[0].target).toEqual('final');
        });

        it('can return a mapping of for chained post processing', () => {
            const validator = constructValidator(chainedRules1);
            const { postProcessing } = validator.validate();

            const resultsOrder = postProcessing['*'].map((obj) => obj.post_process);

            expect(postProcessing['*']).toBeArrayOfSize(3);
            expect(resultsOrder).toEqual(['base64decode', 'urldecode', 'jsonparse']);
        });

        it('can add mutate defaults to extraction post_process configs', () => {
            const validator = constructValidator(mutateExtractionPostProcessConfig);
            const {
                postProcessing: {
                    'hello:world': [config1, config2],
                },
            } = validator.validate();

            expect(config1.mutate).toEqual(true);
            expect(config2.mutate).toEqual(false);
        });

        it('can throw error if graph is cyclic', () => {
            const validator = constructValidator(cyclicRules);
            expect(() => validator.validate()).toThrow();
        });

        it('can throw error if you follow a tag that does not exist', () => {
            const validator = constructValidator(followTagError);
            expect(() => validator.validate()).toThrow(
                `rule attempts to follow a tag that doesn't exist: ${JSON.stringify(followTagError[1])}`
            );
        });

        it('can normalize post_processing fields', () => {
            const results = cloneDeep(chainedRules1);
            const validator = constructValidator(chainedRules1);
            const { postProcessing } = validator.validate();
            let prev: OperationConfig | undefined;

            results.forEach((config) => {
                if (config.post_process) {
                    if (prev) {
                        config.source = prev.target;
                        config.target = config.source;
                    }
                }
                prev = config;
            });

            postProcessing['*'].forEach((config) => {
                const testConfig = Object.assign({}, results.find((obj) => obj.__id === config.__id), { __pipeline: '*' });
                expect(config).toEqual(testConfig);
            });
        });

        it('will not throw errors with duplicate tags', () => {
            const validator = constructValidator(newJoinRules);
            expect(() => validator.validate()).not.toThrow();
        });

        it('will log warning if other_match_required is not paired with another extraction', () => {
            const logger = debugLogger('other_match_required');
            // @ts-expect-error
            logger.warn = jest.fn();
            const validator = constructValidator(matchRequiredError, [], logger);
            validator.validate();
            expect(logger.warn).toHaveBeenCalled();
        });

        it('if op cardinality is one-to-one then multi inputs will make multiple ops.', () => {
            const validator = constructValidator(oneToOne);
            const {
                postProcessing: { 'hello:world': results },
            } = validator.validate();

            expect(results).toBeArrayOfSize(2);
            expect(results[0].source).toEqual('byte');
            expect(results[0].target).toEqual('byte');

            expect(results[1].source).toEqual('age');
            expect(results[1].target).toEqual('age');
        });

        it('if op cardinality is many-to-one then multi inputs will results in a single op', () => {
            const validator = constructValidator(newJoinRules);
            const {
                postProcessing: { 'hello:world': results },
            } = validator.validate();

            expect(results).toBeArrayOfSize(1);
            expect(results[0].post_process).toEqual('join');
            expect(results[0].sources).toEqual(results[0].fields);
        });

        it('if op cardinality is many-to-one then sources will only have unique fields', () => {
            const validator = constructValidator(multipleSources);
            const {
                postProcessing: { '*': results },
            } = validator.validate();

            expect(results).toBeArrayOfSize(1);
            expect(results[0].post_process).toEqual('array');
            expect(results[0].sources).toEqual(['fields']);
        });
    });

    describe('output', () => {
        it('can format data for output phase with no results', () => {
            const validator = constructValidator(newJoinRules);
            const {
                output: { restrictOutput, matchRequirements },
            } = validator.validate();

            expect(restrictOutput).toEqual({});
            expect(matchRequirements).toEqual({});
        });

        it('can format data for output phase', () => {
            const validator = constructValidator(multiOutput);
            const {
                output: { restrictOutput, matchRequirements },
            } = validator.validate();

            expect(restrictOutput).toEqual({ field: true });
            expect(matchRequirements).toEqual({ key: '*' });
        });
    });
});
