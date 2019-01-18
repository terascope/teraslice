import 'jest-extended';
import { QueryAccess } from '../src';

describe('QueryAccess', () => {
    const queryAccess = new QueryAccess();

    it('should be an instance of QueryAccess', () => {
        expect(queryAccess).toBeInstanceOf(QueryAccess);
    });
});
