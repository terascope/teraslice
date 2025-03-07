import 'jest-extended';
import { jest } from '@jest/globals';
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

    it('should be able to call compose.pull()', async () => {
        await expect(compose.pull(undefined, { quiet: '' })).resolves.not.toThrow();
    });

    it('should be able to call compose.build()', async () => {
        await expect(compose.build()).resolves.not.toThrow();
    });

    it('should be able to call compose.version()', async () => {
        const result = await compose.version();
        expect(result).not.toBeNil();
        expect(result).toContain('Docker Compose version');
    });

    describe('when the cluster is up', () => {
        beforeAll(async () => {
            await compose.up({
                timeout: 1,
                'force-recreate': ''
            });
        });

        afterAll(() => compose.down({
            timeout: 1,
            '--volumes': '',
            '--remove-orphans': ''
        }));

        it('should be able to call rm on the service', async () => {
            const result = await compose.rm('test');
            expect(result).toContain('No stopped containers');
        });

        it('should be able to call port on the service', () => {
            expect(() => compose.port('test', '40230')).not.toThrow();
        });

        it('should be able to call pause and unpause on the service', async () => {
            await expect(
                (async () => {
                    await compose.pause('test');
                    await compose.unpause('test');
                })()
            ).resolves.not.toThrow();
        });

        it('should be able to call start, ps and stop on the service', async () => {
            await compose.start('test');

            const result = await compose.ps();
            expect(result).not.toBeNil();
            expect(result).toInclude('test');

            await compose.stop('test', {
                timeout: 1,
            });
        });

        it('should be able to call restart and kill on the service', async () => {
            await expect(
                (async () => {
                    await compose.restart('test', { '--timeout': 1 });
                    await compose.kill('test');
                })()
            ).resolves.not.toThrow();
        });

        it('should return a rejection when passing in incorrect options', async () => {
            expect.hasAssertions();
            try {
                await compose.start('something wrong');
            } catch (err) {
                expect(err.message).toContain('Command exited: 1');
                expect(err.message).toContain('no such service: something wrong');
                expect(err.stdout).toBeDefined();
            }
        });
    });
});
