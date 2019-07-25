import { CommandModule } from 'yargs';
import { ScopeFn, TestOptions } from '../helpers/test-runner/interfaces';
import { getTestScope } from '../helpers/test-runner';

const cmd: CommandModule = {
    command: 'test [scopes..]',
    describe: 'Run monorepo tests',
    builder(yargs) {
        return yargs
            .option('debug', {
                description: 'This will run all of the tests in-band and output any debug info',
                type: 'boolean',
                default: false,
            })
            .option('bail', {
                description: 'This will cause the tests to stop at the first failed test.',
                type: 'boolean',
                default: false,
            })
            .positional('scopes', {
                description: 'Runs the test for one or more package or test suite, if none specified it will run all of the tests',
                type: 'string',
            });
    },
    handler(argv) {
        const scope: ScopeFn = getTestScope(argv.scopes);
        const options: TestOptions = {
            debug: Boolean(argv.debug),
            bail: Boolean(argv.bail),
        };
        return scope(options);
    },
};

export = cmd;
