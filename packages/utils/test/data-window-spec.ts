import 'jest-extended';
import {
    DataWindow
} from '../src';

describe('DataWindow', () => {
    describe('when constructed', () => {
        it('should return an array like entity', () => {
            const window = new DataWindow();
            expect(window).toBeArray();
        });
    });
});
