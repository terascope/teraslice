import 'jest-extended';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Compose } from '../src/index.js';

jest.setTimeout(60 * 1000);

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe('compose', () => {
    let compose: Compose;

    beforeAll(() => {
        compose = new Compose(path.join(dirname, 'fixtures', 'example.yaml'));
    });

    it('should be able to call compose.pull()', () => compose.pull(undefined, { quiet: '' }));

    it('should be able to call compose.build()', () => compose.build());

    it('should be able to call compose.version()', async () => {
        const result = await compose.version();
        expect(result).not.toBeNil();
        expect(result).toContain('docker-compose version');
    });

    describe('when the cluster is up', () => {
        beforeAll(() => compose.up({
            timeout: 1,
            'force-recreate': ''
        }));

        afterAll(() => compose.down({
            timeout: 1,
            '--volumes': '',
            '--remove-orphans': ''
        }));

        it('should be able to call rm on the service', () => compose.rm('test'));

        it('should be able to call port', () => compose.port('test', '40230'));

        it('should be able to call pause and unpause the service', async () => {
            await compose.pause('test');
            await compose.unpause('test');
        });

        it('should be able to call start, ps and stop the service', async () => {
            await compose.start('test');

            const result = await compose.ps();
            expect(result).not.toBeNil();
            expect(result).toInclude('test');

            await compose.stop('test', {
                timeout: 1,
            });
        });

        it('should be able to call restart and kill the service', async () => {
            await compose.restart('test', { '--timeout': 1 });
            await compose.kill('test');
        });

        it('should return a rejection when passing in incorrect options', async () => {
            expect.hasAssertions();
            try {
                await compose.start('something wrong');
            } catch (err) {
                expect(err.message).toContain('Command exited: 1');
                expect(err.message).toContain('No such service: something wrong');
                expect(err.stdout).toBeDefined();
            }
        });
    });
});
