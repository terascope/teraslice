import { Config } from '../src/config';

describe('Config', () => {
    describe('when constructed', () => {
        let config: Config;

        beforeAll(() => {
            config = new Config();
        });

        describe('->validate', () => {
            it('should resolve undefined', () => {
                const input = {};
                return expect(config.validate(input)).resolves.toEqual(config);
            });
        });
    });
});
