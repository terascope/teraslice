import 'jest-extended';
import { StreamAccess } from '../src';

describe('StreamAccess', () => {
    // @ts-ignore FIXME
    const streamAccess = new StreamAccess();

    it('should be an instance of FilterAccess', () => {
        expect(streamAccess).toBeInstanceOf(StreamAccess);
    });

    it('should be able to filter', () => {
        expect(streamAccess.filter([])).toEqual([]);
    });
});
