import 'jest-extended';
import index from '../src';

describe('TeraserverAdapterPlugin', () => {
    it('should export a valid plugin adapter', () => {
        expect(index._manager).toBeNil();
        expect(index._initialized).toBeFalse();
        expect(index.config).toBeFunction();
        expect(index.init).toBeFunction();
        expect(index.routes).toBeFunction();
    });
});
