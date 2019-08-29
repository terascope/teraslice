'use strict';

const Index = require('..');

describe('ESLint Config Index', () => {
    it('should export an object of rules', () => {
        expect(Index).toHaveProperty('rules');
        expect(Index.rules).toBeObject();
    });

    it('should export an array of configs to extends', () => {
        expect(Index).toHaveProperty('extends');
        expect(Index.extends).toBeArray();
    });
});
