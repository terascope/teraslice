import 'jest-extended';
import { evaluate } from '../src/index.js';

describe('evaluate', () => {
    describe('when the key of variable', () => {
        it('should evaluate to the correct result', () => {
            expect(evaluate('foo_var', {
                variables: {
                    foo_var: 'foo',
                    bar_var: 'bar'
                }
            })).toBe('foo');
        });
    });

    describe('when the key of variable with whitespace', () => {
        it('should evaluate to the correct result', () => {
            expect(evaluate('    bar_var ', {
                variables: {
                    foo_var: 'foo',
                    bar_var: 'bar'
                }
            })).toBe('bar');
        });
    });

    describe('when the key of variable does not exist', () => {
        it('should throw an error', () => {
            expect(() => {
                evaluate('unknown', {
                    variables: {
                        foo_var: 'foo',
                        bar_var: 'bar'
                    }
                });
            }).toThrow('Missing variable "unknown" in expression');
        });
    });
});
