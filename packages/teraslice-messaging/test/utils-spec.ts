import 'jest-extended'; // require for type definitions
import { formatURL } from '../src/index.js';

describe('Utils', () => {
    describe('->formatUrl', () => {
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
});
