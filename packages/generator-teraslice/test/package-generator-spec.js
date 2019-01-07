'use strict';

const GeneratorPackage = require('../generators/package');

describe('generator:package', () => {
    it('should have the generator', () => {
        expect(GeneratorPackage).not.toBeNil();
    });
});
