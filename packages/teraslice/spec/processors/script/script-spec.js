'use strict';

const processor = require('../../../lib/processors/script');
const harness = require('@terascope/teraslice-op-test-harness')(processor);

const processorName = 'script processor';

describe(processorName, () => {
    const assetPath = 'spec/processors/script/test_scripts';

    const context = {
        apis: {
            registerAPI() {},
            assets: {
                getPath() {
                    return Promise.resolve(assetPath).then('');
                },
            }
        }
    };

    // Run the high level tests provided by the harness
    harness.runProcessorSpecs(processor, processorName);


    it('returns an object (Promise)', () => {
        const opConfig = {};
        const jobConfig = {};
        const myProcessor = processor.newProcessor(opConfig, jobConfig, assetPath);

        expect(typeof myProcessor).toEqual('object');
    });

    it('script runs when specified via path without asset bundle', (done) => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: `${assetPath}/test_script.py`
        };
        harness.runAsync(data, opConfig, context)
            .then((checkData) => {
                expect(checkData).toEqual(data);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('data out is empty when input is empty', (done) => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(data, opConfig, context)
            .then((checkData) => {
                expect(checkData).toEqual(data);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('optional config items (args and options) do not cause an error', (done) => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            asset: 'test_script'
        };
        harness.runAsync(data, opConfig, context)
            .then((checkData) => {
                expect(checkData).toEqual(data);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });


    it('data out is the same as data in (simple)', (done) => {
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(harness.data.simple, opConfig, context)
            .then((checkData) => {
                expect(checkData).toEqual(harness.data.simple);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('data out is the same as data in (arrayLike)', (done) => {
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(harness.data.arrayLike, opConfig, context)
            .then((checkData) => {
                expect(checkData).toEqual(harness.data.arrayLike);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('data out is the same as data in (esLike)', (done) => {
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(harness.data.esLike, opConfig, context)
            .then((checkData) => {
                expect(checkData).toEqual(harness.data.esLike);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('spawn options passed to spawn call', (done) => {
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(harness.data.simple, opConfig, context)
            .then((checkData) => {
                expect(checkData).toEqual(harness.data.simple);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('data out size is one less than data in (simple)', (done) => {
        const opConfig = {
            _op: 'script',
            command: 'test_script_delete_record.py',
            args: [],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(harness.data.simple, opConfig, context)
            .then((checkData) => {
                expect(checkData.length).toEqual(harness.data.simple.length - 1);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('arguments get passed to script', (done) => {
        const opConfig = {
            _op: 'script',
            command: 'test_script_delete_record.py',
            args: ['2'],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(harness.data.simple, opConfig, context)
            .then((checkData) => {
                expect(checkData.length).toEqual(harness.data.simple.length - 2);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('named args get passed to script', (done) => {
        const opConfig = {
            _op: 'script',
            command: 'test_script_delete_record_options.py',
            args: ['--delete=3'],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(harness.data.simple, opConfig, context)
            .then((checkData) => {
                expect(checkData.length).toEqual(harness.data.simple.length - 3);
            }).catch((error) => {
                fail(error);
            }).finally(() => {
                done();
            });
    });

    it('handles error when script does not exist', (done) => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script_x.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(data, opConfig, context)
            .then((checkData) => {
                expect(checkData).toEqual('');
            }).catch((error) => {
                expect(error.code).toEqual('ENOENT');
                expect(error.errno).toEqual('ENOENT');
                expect(error.syscall).toEqual(`spawn ${assetPath}/test_script_x.py`);
            }).finally(() => {
                done();
            });
    });


    it('handles error when script has an error', (done) => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script_with_error.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(data, opConfig, context)
            .then((checkData) => {
                fail(checkData);
            }).catch((error) => {
                const errorLines = error.split('\n');
                expect(errorLines[0].trim()).toEqual('Traceback (most recent call last):');
                expect(errorLines[1].trim()).toEqual(`File "${assetPath}/test_script_with_error.py", line 5, in <module>`);
                expect(errorLines[2].trim()).toEqual('json_data = json.loads(json_string)');
                expect(errorLines[3].trim()).toEqual('NameError: name \'json\' is not defined');
            }).finally(() => {
                done();
            });
    });

    it('handles error when script does not have exec permissions', (done) => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script_with_no_exec.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        harness.runAsync(data, opConfig, context)
            .then((checkData) => {
                fail(checkData);
            }).catch((error) => {
                expect(error.code).toEqual('ENOENT');
                expect(error.errno).toEqual('ENOENT');
                expect(error.syscall).toEqual(`spawn ${assetPath}/test_script_with_no_exec.py`);
            }).finally(() => {
                done();
            });
    });
});
