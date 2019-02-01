'use strict';

const path = require('path');
const compose = require('..');

jest.setTimeout(60 * 1000);

describe('compose', () => {
    let sut;

    beforeAll(() => {
        sut = compose(path.join(__dirname, 'fixtures', 'example.yaml'));
    });

    it('should be able to call compose.pull()', () => sut.pull(null, { quiet: '' }));

    it('should be able to call compose.build()', () => sut.build());

    it('should be able to call compose.version()', async () => {
        const result = await sut.version();
        expect(result).not.toBeNil();
        expect(result).toContain('docker-compose version');
    });

    describe('when the cluster is up', () => {
        beforeAll(() => sut.up({
            timeout: 1,
            'force-recreate': ''
        }));

        afterAll(() => sut.down({
            timeout: 1,
            '--volumes': '',
            '--remove-orphans': ''
        }));

        it('should be able to call rm on the service', () => sut.rm('test'));

        it('should be able to call port', () => sut.port('test', '40230'));

        it('should be able to call pause and unpause the service', async () => {
            await sut.pause('test');
            await sut.unpause('test');
        });

        it('should be able to call start, ps and stop the service', async () => {
            await sut.start('test');

            const result = await sut.ps();
            expect(result).not.toBeNil();
            expect(result).toInclude('test');

            await sut.stop('test', {
                timeout: 1,
            });
        });

        it('should be able to call restart and kill the service', async () => {
            await sut.restart('test', { '--timeout': 1 });
            await sut.kill('test');
        });

        it('should return a rejection when passing in incorrect options', async () => {
            expect.hasAssertions();
            try {
                await sut.start('something wrong');
            } catch (err) {
                expect(err.message).toContain('Command exited: 1');
                expect(err.message).toContain('No such service: something wrong');
                expect(err.stdout).toBeDefined();
            }
        });
    });
});
