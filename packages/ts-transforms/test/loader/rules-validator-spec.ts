
import _ from 'lodash';
import 'jest-extended';
import { debugLogger } from '@terascope/utils';
import { RulesValidator, RulesParser, OperationConfig, UnParsedConfig } from '../../src';
import { isPrimaryConfig } from '../../src/loader/utils';

describe('rules-validator', () => {
    const testLogger = debugLogger('rules-validator-test');

    function parseData(configList: UnParsedConfig[]) {
        const rulesParser = new RulesParser(configList, testLogger);
        return rulesParser.parse();
    }

    const basicExtractionConfig = parseData([
        {
            selector: 'hello:world',
            source_field: 'first',
            target_field: 'first_name'
        },
        {
            selector:'hello:world',
            source_field: 'last',
            target_field: 'last_name'
        }
    ]);

    const multiSelectorConfig = parseData([
        {
            selector: 'hello:world',
            source_field: 'first',
            target_field: 'first_name'
        },
        {
            selector: 'other:things',
            source_field: 'last',
            target_field: 'last_name'
        },
        {
            source_field: 'person',
            target_field: 'valid_person'
        }
    ]);

    const postSelector = parseData([
        {
            selector: 'hello:world',
            source_field: 'first',
            target_field: 'first_name',
            tag: 'hello',
        },
        {
            follow: 'hello',
            post_process: 'selector',
            selector: 'first:name',
        }
    ]);

    const basicPostProcessing = parseData([
        {
            selector: 'hello:world',
            source_field: 'first',
            target_field: 'first_name',
            output: false,
        },
        {
            selector: 'hello:world',
            source_field: 'last',
            target_field: 'last_name',
            output: false,
            tag: 'someTag'
        },
        {
            follow: 'someTag',
            post_process: 'join',
            fields: ['first_name', 'last_name'],
            delimiter: ' ',
            target_field: 'full_name'
        }
    ]);

    const chainedRules1 = parseData([
        {
            source_field: 'somefield',
            start: 'value=', end: 'EOP',
            target_field: 'hashoutput',
            tag: 'source'
        },
        {
            follow: 'source',
            post_process: 'base64decode',
            tag: 'hash_field'
        },
        {
            follow: 'hash_field',
            post_process: 'urldecode',
            tag: 'urldecoded'
        },
        {
            follow: 'urldecoded',
            post_process: 'jsonparse',
            tag: 'parsed'
        }
    ]);

    const OldJoinRules = parseData([
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
    ]);

    const NewJoinRules = parseData([
        {
            selector: 'hello:world',
            source_field: 'first',
            target_field: 'first_name',
            tag: 'A'
        },
        {
            selector: 'hello:world',
            source_field: 'last',
            target_field: 'last_name',
            tag: 'A'
        },
        {
            follow: 'A',
            post_process: 'join',
            fields: ['first_name', 'last_name'],
            delimiter: ' ',
            target_field: 'full_name'
        }
    ]);

    const oldExtractionValidation = parseData([
        {
            selector: 'hello:world',
            source_field:  'txt',
            target_field: 'hex',
            validation: 'hexdecode'
        }
    ]);

    const cyclicRules = parseData([
        {
            source_field: 'somefield',
            start: 'value=',
            end: 'EOP',
            target_field: 'hashoutput',
            tag: 'source'
        },
        {
            follow: 'parsed',
            post_process: 'base64decode',
            tag: 'hash_field'
        },
        {
            follow: 'hash_field',
            post_process: 'urldecode',
            tag: 'urldecoded'
        },
        {
            follow: 'urldecoded',
            post_process: 'jsonparse',
            tag: 'parsed'
        },
    ]);

    const matchRequiredError = parseData([
        {
            selector: 'some:selector',
            source_field: 'somefield',
            start: 'value=',
            end: 'EOP',
            other_match_required: true,
            target_field: 'hashoutput',
            tag: 'source'
        },
        {
            selector: 'thing:other',
            source_field: 'somefield',
            start: 'value=',
            end: 'EOP',
            target_field: 'hashoutput',
            tag: 'source'
        },
        {
            follow: 'source',
            post_process: 'base64decode',
            tag: 'hash_field'
        },
        {
            follow: 'hash_field',
            post_process: 'urldecode',
            tag: 'urldecoded'
        },
        {
            follow: 'urldecoded',
            post_process: 'jsonparse',
            tag: 'parsed'
        }
    ]);

    function constructValidator(configList: OperationConfig[], logger = testLogger) {
        return new RulesValidator(configList, logger);
    }

    describe('selector phase configs', () => {

        it('will throw an error is no selectors where found', () => {
            const validator = constructValidator([]);
            expect(() => validator.validate()).toThrowWithMessage(Error, 'Invalid configuration file, no selector configurations where found');
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
            const results = {};
            results['hello:world'] = basicExtractionConfig;
            expect(extractions).toEqual(results);
        });

        it('can multiple extractions', () => {
            const validator = constructValidator(multiSelectorConfig);
            const { extractions } = validator.validate();
            const results = {};

            results['hello:world'] = [multiSelectorConfig[0]];
            results['other:things'] = [multiSelectorConfig[1]];
            results['*'] = [multiSelectorConfig[2]];

            expect(extractions).toEqual(results);
        });

        it('can work with OldJoinRules', () => {
            const validator = constructValidator(OldJoinRules);
            const { extractions } = validator.validate();
            const results = {};

            results['hello:world'] = OldJoinRules.slice(0, 2);

            expect(extractions['hello:world'].length).toEqual(2);
            expect(extractions).toEqual(results);
        });

        it('can work with NewJoinRules', () => {
            const validator = constructValidator(NewJoinRules);
            const { extractions } = validator.validate();
            const results = {};

            results['hello:world'] = NewJoinRules.slice(0, 2);

            expect(extractions['hello:world'].length).toEqual(2);
            expect(extractions).toEqual(results);
        });

        it('can work with other stuff', () => {
            const validator = constructValidator(oldExtractionValidation);
            const { extractions } = validator.validate();
            const results = {
                'hello:world': [oldExtractionValidation[0]]
            };

            expect(extractions).toEqual(results);
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
            const { postProcessing } = validator.validate();
            const results = { 'hello:world': [basicPostProcessing[2]] };

            expect(postProcessing).toEqual(results);
        });

        it('can return a mapping of for chained post processing', () => {
            const validator = constructValidator(chainedRules1);
            const { postProcessing } = validator.validate();

            const resultsOrder = postProcessing['*'].map(obj => obj.post_process);

            expect(postProcessing['*']).toBeArrayOfSize(3);
            expect(resultsOrder).toEqual(['base64decode', 'urldecode', 'jsonparse']);
        });

        it('can throw error if graph is cyclic', () => {
            const validator = constructValidator(cyclicRules);
            expect(() => validator.validate()).toThrow();
        });

        it('can normalize post_processing fields', () => {
            const results = _.cloneDeep(chainedRules1);
            const validator = constructValidator(chainedRules1);
            const { postProcessing } = validator.validate();
            let prev:OperationConfig|undefined;

            results.forEach((config) => {
                if (config.post_process) {
                    if (prev) {
                        config.source_field = prev.target_field;
                        config.target_field = config.source_field;
                    }
                }
                prev = config;
            });

            postProcessing['*'].forEach((config) => {
                const testConfig = results.find((obj) => obj.__id === config.__id);
                expect(config).toEqual(testConfig);
            });

        });

        it('will not throw errors with duplicate tags', () => {
            const validator = constructValidator(NewJoinRules);
            expect(() => validator.validate()).not.toThrow();
        });

        it('will not throw errors with OldJoinRules', () => {
            const validator = constructValidator(OldJoinRules);
            expect(() => validator.validate()).not.toThrow();
        });
        // TODO: check more of code
        it('OldJoinRules config will be correctly formated with source_fields', () => {
            const validator = constructValidator(OldJoinRules);
            const { postProcessing } = validator.validate();
            const selectors = _.get(postProcessing, 'hello:world');
            const results = _.get(selectors, '[0]');

            expect(results).toBeDefined();
            expect(results.post_process).toEqual('join');
            expect(results.source_fields).toEqual(['first_name', 'last_name']);
        });

        it('will log warning if other_match_required is not paired with another extraction', () => {
            const logger = debugLogger('other_match_required');
            logger.warn = jest.fn();
            const validator = constructValidator(matchRequiredError, logger);
            validator.validate();
            expect(logger.warn).toHaveBeenCalled();
        });
    });

    describe('output', () => {
        it('', () => {

        });
    });
});
