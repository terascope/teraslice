import 'jest-extended';
import {
    functionConfigRepository, functionAdapter, FunctionDefinitionType, ProcessMode
} from '../../src';

const isEmailConfig = functionConfigRepository.isEmail;

describe('isEmailConfig', () => {
    it('has proper configuration', () => {
        expect(isEmailConfig).toBeDefined();
        expect(isEmailConfig).toHaveProperty('name', 'isEmail');
        expect(isEmailConfig).toHaveProperty('type', FunctionDefinitionType.FIELD_VALIDATION);
        expect(isEmailConfig).toHaveProperty('process_mode', ProcessMode.INDIVIDUAL_VALUES);
        expect(isEmailConfig).toHaveProperty('description');
        expect(isEmailConfig).toHaveProperty('accepts', []);
        expect(isEmailConfig).toHaveProperty('create');
        expect(isEmailConfig.create).toBeFunction();
    });

    it('can validate email addresses', () => {
        const isString = isEmailConfig.create({});

        [
            ['string@gmail.com', true],
            ['non.us.email@thing.com.uk', true],
            ['Abc@def@example.com', true],
            ['cal+henderson@iamcalx.com', true],
            ['customer/department=shipping@example.com', true],
            ['user@blah.com/junk.junk?a=<tag value="junk"', false],
            ['Abc\@def  @  example.com', false],
            ['bad email address', false],
            [undefined, false],
            [12345, false],
            [true, false]
        ].forEach(([input, expected]) => {
            expect(isString(input)).toEqual(expected);
        });
    });

    describe('when paired with fieldFunctionAdapter', () => {
        it('should return a function to execute', () => {
            const api = functionAdapter(isEmailConfig);
    
            expect(api).toBeDefined();
            expect(api).toHaveProperty('rows');
            expect(api).toHaveProperty('column');
            expect(api.column).toBeFunction();
            expect(api.rows).toBeFunction();
        });
    });
});
