import 'jest-extended';
import { FilterAccess } from '../src';

describe('FilterAccess', () => {
    const filterAccess = new FilterAccess();

    it('should be an instance of FilterAccess', () => {
        expect(filterAccess).toBeInstanceOf(FilterAccess);
    });
});
