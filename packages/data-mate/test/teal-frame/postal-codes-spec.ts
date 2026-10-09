import 'jest-extended';
import validator from 'validator';
import { POSTAL_PATTERNS } from '../../src/function-configs/string/postal-code-utils.js';

/**
 * `postal-code-utils.ts` copies validator's `isPostalCode` table, which validator does not export.
 * This fails if a validator upgrade adds or removes a locale; a CHANGED pattern is caught by the
 * emission gate, which compares every locale with the UDF over `POSTAL_BATTERY`.
*/
describe('the copied postal-code table', () => {
    it('has exactly validator\'s locales', () => {
        expect(Object.keys(POSTAL_PATTERNS).sort())
            .toEqual([...validator.isPostalCodeLocales].sort());
    });
});
