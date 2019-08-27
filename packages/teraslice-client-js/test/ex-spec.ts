
import nock from 'nock';
import Ex from '../src/ex';

describe('Teraslice Ex', () => {
    let ex: Ex;
    let scope: nock.Scope;

    beforeEach(() => {
        ex = new Ex({
            baseUrl: 'http://teraslice.example.dev'
        });
        scope = nock('http://teraslice.example.dev/v1');
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('->list', () => {
        describe('when called with nothing', () => {
            const data = [
                {
                    id: 'example'
                },
                {
                    id: 'example-other'
                }
            ];

            beforeEach(() => {
                scope.get('/ex')
                    .query({ status: '*' })
                    .reply(200, data);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await ex.list();
                expect(results).toEqual(data);
            });
        });

        describe('when called with a string', () => {
            const data = [
                {
                    id: 'hello-example'
                },
                {
                    id: 'hello-example-2'
                }
            ];

            beforeEach(() => {
                scope.get('/ex')
                    .query({ status: 'hello' })
                    .reply(200, data);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await ex.list('hello');
                expect(results).toEqual(data);
            });
        });

        describe('when called with an object', () => {
            const data = [
                {
                    id: 'object-example'
                },
                {
                    id: 'object-example-2'
                }
            ];

            beforeEach(() => {
                scope.get('/ex')
                    .query({ anything: true })
                    .reply(200, data);

            });

            it('should resolve json results from Teraslice', async () => {
                const results = await ex.list({ anything: true });
                expect(results).toEqual(data);
            });
        });
    });

    describe('->errors', () => {
        describe('when called with nothing', () => {
            const errors = [
                {
                    slice_id: 'hello',
                    slicer_id: 0,
                    slicer_order: 1,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                },
                {
                    slice_id: 'hello-there',
                    slicer_id: 0,
                    slicer_order: 2,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                }
            ];

            beforeEach(() => {
                scope.get('/ex/errors')
                    .query({ size: 10 })
                    .reply(200, errors);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await ex.errors({ size: 10 });
                expect(results).toEqual(errors);
            });
        });

        describe('when called with an exId', () => {
            const errors = [
                {
                    slice_id: 'hello',
                    slicer_id: 0,
                    slicer_order: 1,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                },
                {
                    slice_id: 'hello-there',
                    slicer_id: 0,
                    slicer_order: 2,
                    request: '{"foo":"bar"}',
                    state: 'error',
                    ex_id: 'howdy',
                    _created: new Date().toISOString(),
                    _updated: new Date().toISOString(),
                    error: 'Error: uh oh'
                }
            ];

            beforeEach(() => {
                scope.get('/ex/foo/errors')
                    .query({ from: 10 })
                    .reply(200, errors);
            });

            it('should resolve json results from Teraslice', async () => {
                const results = await ex.errors('foo', { from: 10, });
                expect(results).toEqual(errors);
            });
        });
    });
});
