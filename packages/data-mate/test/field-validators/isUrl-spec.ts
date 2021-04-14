import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

const isUrlConfig = functionConfigRepository.isUrl;

describe('isUUIDConfig', () => {
    it('has proper configuration', () => {
        expect(isUrlConfig).toBeDefined();
        expect(isUrlConfig).toHaveProperty('name', 'isUrl');
        expect(isUrlConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isUrlConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isUrlConfig).toHaveProperty('description');
        expect(isUrlConfig).toHaveProperty('accepts', []);
        expect(isUrlConfig).toHaveProperty('create');
        expect(isUrlConfig.create).toBeFunction();
    });

    it('can validate values', () => {
        const isUrl = isUrlConfig.create({});

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
            expect(isUrl(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isUrlConfig);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
