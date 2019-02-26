
import _ from 'lodash';
import shortid from 'shortid';
import { RulesValidator, OperationConfig } from '../../src';

import 'jest-extended';

describe('rules-validator', () => {

    function addId(config: object): OperationConfig {
        config['__id'] = shortid.generate();
        return config as OperationConfig;
    }

    const basicExtractionConfig: OperationConfig[] = [
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
    ].map(addId);

    const multiSelectorConfig: OperationConfig[] = [
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
            selector: '*',
            source_field: 'person',
            target_field: 'valid_person'
        }
    ].map(addId);

    const postSelector: OperationConfig[] = [
        {
            selector: 'hello:world',
            source_field: 'first',
            target_field: 'first_name',
            tag: 'hello',
            __id: shortid.generate()
        },
        {
            follow: 'hello',
            post_process: 'selector',
            selector: 'first:name',
            __id: shortid.generate()
        }
    ].map(addId);

    const basicPostProcessing: OperationConfig[] = [
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
            output: false, tag: 'someTag'
        },
        {
            follow: 'someTag',
            post_process: 'join',
            fields: ['first_name', 'last_name'],
            delimiter: ' ',
            target_field: 'full_name'
        }
    ].map(addId);

    const chainedRules1: OperationConfig[] = [
        {
            selector: '*',
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
        },
    ].map(addId);

    const duplicateTagRules: OperationConfig[] = [
        {
            selector: '*',
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
            tag: 'hash_field'
        },
    ].map(addId);

    const cyclicRules: OperationConfig[] = [
        {
            selector: '*',
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
    ].map(addId);

    describe('selector phase configs', () => {

        it('will throw an error is no selectors where found', () => {
            const validator = new RulesValidator([]);
            expect(() => validator.validate()).toThrowWithMessage(Error, 'Invalid configuration file, no selector configurations where found');
        });
        // TODO: look to combine this to an each call
        it('can return an array of selectors from basicExtractionConfig', () => {
            const validator = new RulesValidator(basicExtractionConfig);
            const { selectors } = validator.validate();
            expect(selectors).toEqual(['hello:world']);
        });

        it('can return an array of selectors from multiSelectorConfig', () => {
            const validator = new RulesValidator(multiSelectorConfig);
            const { selectors } = validator.validate();
            expect(selectors).toEqual(['hello:world', 'other:things', '*']);
        });

        it('can return an array of selectors from postSelector', () => {
            const validator = new RulesValidator(postSelector);
            const { selectors } = validator.validate();
            expect(selectors).toEqual(['hello:world']);
        });
    });

    describe('extractions', () => {

        it('can return an basic extractions formatted correctly', () => {
            const validator = new RulesValidator(basicExtractionConfig);
            const { extractions } = validator.validate();
            const results = {};
            results['hello:world'] = basicExtractionConfig;
            expect(extractions).toEqual(results);
        });

        it('can multiple extractions', () => {
            const validator = new RulesValidator(multiSelectorConfig);
            const { extractions } = validator.validate();
            const results = {};

            results['hello:world'] = [multiSelectorConfig[0]];
            results['other:things'] = [multiSelectorConfig[1]];
            results['*'] = [multiSelectorConfig[2]];

            expect(extractions).toEqual(results);
        });
    });

    describe('postProcess', () => {

        it('can return an empty array if there is no post processing to do', () => {
            const validator = new RulesValidator(basicExtractionConfig);
            const { postProcessing } = validator.validate();

            expect(postProcessing).toBeEmpty();
        });

        it('can return a mapping of basic post processing', () => {
            const validator = new RulesValidator(basicPostProcessing);
            const { postProcessing } = validator.validate();
            const results = { 'hello:world': [basicPostProcessing[2]] };

            expect(postProcessing).toEqual(results);
        });

        it('can return a mapping of for chained post processing', () => {
            const validator = new RulesValidator(chainedRules1);
            const { postProcessing } = validator.validate();

            const resultsOrder = postProcessing['*'].map(obj => obj.post_process);

            expect(postProcessing['*']).toBeArrayOfSize(3);
            expect(resultsOrder).toEqual(['base64decode', 'urldecode', 'jsonparse']);
        });

        it('can throw error if graph is cyclic', () => {
            const validator = new RulesValidator(cyclicRules);
            expect(() => validator.validate()).toThrow();
        });

        it('can normalize post_processing fields', () => {
            const results = _.cloneDeep(chainedRules1);
            const validator = new RulesValidator(chainedRules1);
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

        it('will throw errors with duplicate tags', () => {
            const validator = new RulesValidator(duplicateTagRules);
            expect(() => validator.validate()).toThrow('must have unique tag, hash_field is a duplicate');
        });
    });
});
