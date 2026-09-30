import yargs from 'yargs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tap from '../../../src/cmds/tjm/tap.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(dirname, '../../fixtures');
const configDir = path.join(fixturesDir, 'config_dir');

describe('tjm tap', () => {
    describe('-> parse', () => {
        function parse(args: string) {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                tap.command,
                tap.describe,
                tap.builder,
                () => true
            );
            return yargsCmd.parseSync(args, {});
        }

        it('should parse properly with a job file', () => {
            const yargsResult = parse('tap cliJobFile.json');

            expect(yargsResult.jobFile).toEqual(['cliJobFile.json']);
            expect(yargsResult.size).toBeUndefined();
        });

        it('should parse the size option', () => {
            const yargsResult = parse('tap cliJobFile.json --size 5');

            expect(yargsResult.size).toEqual('5');
        });
    });

    describe('-> handler', () => {
        it('should throw if more than one job file is provided', async () => {
            const jobFile = ['cliJobFile.json', 'cliJobFile.json'];
            const argv = {
                _: ['tjm', 'tap'],
                'config-dir': configDir,
                configDir,
                'src-dir': fixturesDir,
                srcDir: fixturesDir,
                'job-file': jobFile,
                jobFile,
                status: [],
                $0: 'teraslice-cli'
            };

            await expect(tap.handler(argv))
                .rejects.toThrow('Tap command only accepts one job at a time.');
        });
    });
});
