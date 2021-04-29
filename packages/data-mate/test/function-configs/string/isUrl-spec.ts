import 'jest-extended';
import { FieldType } from '@terascope/types';

import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../../src';

const isURLConfig = functionConfigRepository.isURL;

describe('isURLConfig', () => {
    it('has proper configuration', () => {
        expect(isURLConfig).toBeDefined();
        expect(isURLConfig).toHaveProperty('name', 'isURL');
        expect(isURLConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isURLConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isURLConfig).toHaveProperty('description');
        expect(isURLConfig).toHaveProperty('accepts', [FieldType.String]);
        expect(isURLConfig).toHaveProperty('create');
        expect(isURLConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isURL = isURLConfig.create({});

        [
            ['http://someurl.com', true],
            ['http://someurl.com.uk', true],
            ['https://someurl.cc.ru.ch', true],
            ['ftp://someurl.bom:8080?some=bar&hi=bob', true],
            ['http://xn--fsqu00a.xn--3lr804guic', true],
            ['http://example.com/hello%20world', true],
            ['bob.com', true],
            ['somerandomstring', false],
            [null, false],
            [true, false],
            ['isthis_valid_uri.com', false],
            ['http://sthis valid uri.com', false],
            ['htp://validuri.com', false],
            ['hello://validuri.com', false],
            [{ url: 'http:thisisaurl.com' }, false],
            [12345, false]
        ].forEach(([input, expected]) => {
            expect(isURL(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isURLConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
