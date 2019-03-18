import 'jest-extended';
import * as index from '../src';

describe('index', () => {
    it('should export StreamAccess', () => {
        expect(index.StreamAccess).not.toBeNil();
    });

    it('should export SearchAccess', () => {
        expect(index.SearchAccess).not.toBeNil();
    });

    it('should export ACLManager', () => {
        expect(index.ACLManager).not.toBeNil();
    });

    it('should export Roles', () => {
        expect(index.Roles).not.toBeNil();
    });

    it('should export Spaces', () => {
        expect(index.Spaces).not.toBeNil();
    });

    it('should export Users', () => {
        expect(index.Users).not.toBeNil();
    });

    it('should export Views', () => {
        expect(index.Views).not.toBeNil();
    });
});
