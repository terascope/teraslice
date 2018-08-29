'use strict';

const path = require('path');
const compose = require('..');

jest.setTimeout(60 * 1000);

describe('compose', () => {
    let sut;

    beforeAll(() => {
        sut = compose(path.join(__dirname, 'fixtures', 'example.yaml'));
    });

    it('should be able to call compose.pull()', (done) => {
        sut.pull()
            .then(() => { done(); })
            .catch(fail);
    });

    it('should be able to call compose.build()', (done) => {
        sut.build()
            .then(() => { done(); })
            .catch(fail);
    });

    it('should be able to call compose.version()', (done) => {
        sut.version()
            .then((result) => {
                expect(result).not.toEqual(null);
                expect(result).toContain('docker-compose version');
                done();
            })
            .catch(fail);
    });

    describe('when the cluster is up', () => {
        beforeAll((done) => {
            sut.up({
                timeout: 1,
                'force-recreate': ''
            }).then(() => { done(); }).catch(fail);
        });

        afterAll((done) => {
            sut.down({
                timeout: 1,
                '--volumes': '',
                '--remove-orphans': ''
            }).then(() => { done(); }).catch(fail);
        });

        it('should be able to call start and stop the service', (done) => {
            sut.start('test')
                .then(() => sut.stop('test', {
                    timeout: 1,
                }))
                .then(() => { done(); })
                .catch(fail);
        });

        it('should be able to call start and kill the service', (done) => {
            sut.start('test')
                .then(() => sut.kill('test'))
                .then(() => { done(); })
                .catch(fail);
        });

        it('should be able to call restart the service', (done) => {
            sut.restart('test', { '--timeout': 1 })
                .then(() => { done(); })
                .catch(fail);
        });

        it('should be able to call rm on the service', (done) => {
            sut.rm('test')
                .then(() => { done(); })
                .catch(fail);
        });

        it('should be able to call port', (done) => {
            sut.port('test', '40230')
                .then(() => { done(); })
                .catch(fail);
        });

        it('should be able to call pause and unpause the service', (done) => {
            sut.pause('test')
                .then(() => sut.unpause('test'))
                .then(() => { done(); })
                .catch(fail);
        });


        it('should be able to be list running services', (done) => {
            sut.start()
                .then(() => sut.ps())
                .then((result) => {
                    expect(result).not.toEqual(null);
                    expect(result).toContain('test');
                    done();
                }).catch(fail);
        });

        it('should return a rejection when passing in incorrect options', (done) => {
            sut.start('something wrong')
                .then(fail)
                .catch((err) => {
                    expect(err.message).toContain('Command exited: 1');
                    expect(err.message).toContain('No such service: something wrong');
                    expect(err.stdout).toBeDefined();
                    done();
                });
        });
    });
});
