import 'jest-extended';
import yargs from 'yargs';
import init from '../../../src/cmds/assets/init';

jest.setTimeout(10000);

describe('assets deploy', () => {
    let yargsCmd: yargs.Argv<Record<string, any>>;
    beforeEach(() => {
        yargsCmd = yargs.command(
            // @ts-expect-error
            init.command,
            init.describe,
            init.builder,
            () => true
        );
    });

    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsResult = yargsCmd.parseSync(
                'init', {}
            );

            expect(yargsResult._.includes('init')).toBeTrue();
            expect(yargsResult.baseDir).toBeDefined();
        });

        it('should parse registry option', () => {
            const yargsResult = yargsCmd.parseSync(
                'init --registry'
            );

            expect(yargsResult.registry).toBeTrue();
        });

        it('should parse processor option', () => {
            const yargsResult = yargsCmd.parseSync(
                'init --processor'
            );

            expect(yargsResult.processor).toBeTrue();
        });
    });
});
