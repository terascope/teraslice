
import { RulesValidator, OperationConfig } from '../../src';

import 'jest-extended';

describe('rules-validator', () => {

    const basicExtractionConfig: OperationConfig[] = [
        { selector: 'hello:world', source_field: 'first', target_field: 'first_name' },
        { selector: 'hello:world', source_field: 'last', target_field: 'last_name' }
    ];

    const multiSelectorConfig: OperationConfig[] = [
        { selector: 'hello:world', source_field: 'first', target_field: 'first_name' },
        { selector: 'other:things', source_field: 'last', target_field: 'last_name' },
        { selector: '*', source_field: 'person', target_field: 'valid_person' }
    ];
    // @ts-ignore
    const postSelector: OperationConfig[] = [
        { selector: 'hello:world', source_field: 'first', target_field: 'first_name', tag: 'hello' },
        { follow: 'hello', post_process: 'selector', selector: 'first:name',  }
    ];
    // @ts-ignore
    const basicPostProcessing = [
        { selector: 'hello:world', source_field: 'first', target_field: 'first_name', output: false },
        { selector: 'hello:world', source_field: 'last', target_field: 'last_name', output: false, tag: 'someTag' },
        { follow: 'someTag', post_process: 'join', fields: ['first_name', 'last_name'], delimiter: ' ', target_field: 'full_name' }
    ];

    const chainedRules1 = [
        { selector: '*', source_field: 'somefield', start: 'value=', end: 'EOP', target_field: 'hashoutput', tag: 'source' },
        { follow: 'source', post_process: 'base64decode', tag: 'hash_field' },
        { follow: 'hash_field', post_process: 'urldecode', tag: 'urldecoded' },
        { follow: 'urldecoded', post_process: 'jsonparse', tag: 'parsed' },
    ];

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

    });
});
