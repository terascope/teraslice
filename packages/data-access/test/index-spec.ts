import 'jest-extended';
import * as index from '../src';

describe('index', () => {
    it('should export FilterAccess', () => {
        expect(index.FilterAccess).not.toBeNil();
    });

    it('should export QueryAccess', () => {
        expect(index.QueryAccess).not.toBeNil();
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
