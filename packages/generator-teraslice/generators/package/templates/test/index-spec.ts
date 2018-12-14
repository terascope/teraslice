import 'jest-extended';
import { Example } from '../src';

describe('index', () => {
    it('should export Example', () => {
        expect(Example).not.toBeNil();
    });
});
