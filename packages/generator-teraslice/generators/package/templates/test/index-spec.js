'use strict';

const { Example } = require('../lib');

describe('index', () => {
    it('should export Example', () => {
        expect(Example).not.toBeNil();
    });
});
