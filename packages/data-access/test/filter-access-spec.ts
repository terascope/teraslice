import 'jest-extended';
import { FilterAccess } from '../src';

describe('FilterAccess', () => {
    // @ts-ignore FIXME
    const filterAccess = new FilterAccess();

    it('should be an instance of FilterAccess', () => {
        expect(filterAccess).toBeInstanceOf(FilterAccess);
    });

    it('should be able to filter', () => {
        expect(filterAccess.filter([])).toEqual([]);
    });
});
