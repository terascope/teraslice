import Options from '../../src/helpers/yargs-options';

describe('options', () => {
    let options: any;

    beforeEach(() => {
        options = new Options();
    });

    afterEach(() => {
        options = null;
    });

    test('should return a defined object', () => {
        expect(options).toBeDefined();
    });

    describe('-> buildOption', () => {
        test('should build an option', () => {
            options.options = {
                config: () => ({
                    alias: 'conf',
                    describe: 'Config file',
                    default: 'test.json'
                }),
            };
            expect(options.buildOption('config').alias).toBe('conf');
        });
    });

    describe('-> buildPositional', () => {
        test('should build a positional string', () => {
            options.positionals = {
                config: () => ({
                    alias: 'conf',
                    describe: 'Config file',
                    default: 'test.json'
                }),
            };
            expect(options.buildPositional('config').alias).toBe('conf');
        });
    });

    describe('-> buildCoerce', () => {
        test('should build a coerce function', () => {
            options.coerce = {
                testc: (newValue: string) => newValue.toUpperCase(),
            };
            expect(options.buildCoerce('testc')).toBeDefined();
        });
    });
});
