import Url from '../../src/helpers/url';

describe('Url', () => {
    let url: any;
    beforeEach(() => {
        url = new Url();
    });

    afterEach(() => {
        url = null;
    });

    describe('url', () => {
        test('should return a defined object', () => {
            expect(url).toBeDefined();
        });

        describe('-> check', () => {
            test('should return true for valid url with http', () => {
                expect(url.check('http://test1.net')).toBe(true);
            });
            test('should return true for valid url with https', () => {
                expect(url.check('https://test1.net')).toBe(true);
            });
            test('should return false for valid url without http', () => {
                expect(url.check('test1.net')).toBe(false);
            });
        });

        describe('-> build', () => {
            test('should return url with http and default port of 5678', () => {
                expect(url.build('test1.net')).toBe('http://test1.net:5678');
            });
            test('should return url with http and not change port', () => {
                expect(url.build('test1.net:80')).toBe('http://test1.net:80');
            });
            test('should throw an error when given an empty url', () => {
                function urlBuild() {
                    url.build('');
                }
                expect(urlBuild).toThrow('Empty url');
            });
        });
    });
});
