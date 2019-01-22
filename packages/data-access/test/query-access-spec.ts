import 'jest-extended';
import { QueryAccess } from '../src';

describe('QueryAccess', () => {
    // @ts-ignore FIXME
    const queryAccess = new QueryAccess();

    it('should be an instance of QueryAccess', () => {
        expect(queryAccess).toBeInstanceOf(QueryAccess);
    });
});
