import 'jest-extended';
import eslintConfig from '../index.js';

describe('ESLint Config Index', () => {
    it('should export an array of rules', () => {
        expect(eslintConfig).toBeArray();
        expect(eslintConfig.length).toBeGreaterThan(3);
    });
});
