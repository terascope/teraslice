'use strict';

const { formatURL } = require('../../../lib/utils');

describe('URL Format', () => {
    describe('when given a hostname and port', () => {
        it('should return a url', () => {
            expect(formatURL('hello.com', 8080)).toEqual('http://hello.com:8080');
        });
    });

    describe('when given a url and a port', () => {
        it('should return a url', () => {
            expect(formatURL('https://example.com', 8080)).toEqual('https://example.com:8080/');
        });
    });
});
