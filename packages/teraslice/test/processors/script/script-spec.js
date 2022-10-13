import path from 'path';
import opHarness from '@terascope/teraslice-op-test-harness';
import processor from '../../../lib/processors/script';

const harness = opHarness(processor);

const processorName = 'script processor';

// eslint-disable-next-line
xdescribe(processorName, () => {
    const assetPath = path.relative(process.cwd(), path.join(__dirname, './test_scripts'));

    const context = {
        apis: {
            assets: {
                getPath() {
                    return Promise.resolve(assetPath);
                }
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

    it('script runs when specified via path without asset bundle', async () => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: `${assetPath}/test_script.py`
        };

        const checkData = await harness.runAsync(data, opConfig, context);
        expect(checkData).toEqual(data);
    });

    it('data out is empty when input is empty', async () => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };

        const checkData = await harness.runAsync(data, opConfig, context);
        expect(checkData).toEqual(data);
    });

    it('optional config items (args and options) do not cause an error', async () => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            asset: 'test_script'
        };

        const checkData = await harness.runAsync(data, opConfig, context);
        expect(checkData).toEqual(data);
    });

    it('data out is the same as data in (simple)', async () => {
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        const checkData = await harness.runAsync(harness.data.simple, opConfig, context);
        expect(checkData).toEqual(harness.data.simple);
    });

    it('data out is the same as data in (arrayLike)', async () => {
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };

        const checkData = await harness.runAsync(harness.data.arrayLike, opConfig, context);
        expect(checkData).toEqual(harness.data.arrayLike);
    });

    it('data out is the same as data in (esLike)', async () => {
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };

        const checkData = await harness.runAsync(harness.data.esLike, opConfig, context);
        expect(checkData).toEqual(harness.data.esLike);
    });

    it('spawn options passed to spawn call', async () => {
        const opConfig = {
            _op: 'script',
            command: 'test_script.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };

        const checkData = await harness.runAsync(harness.data.simple, opConfig, context);
        expect(checkData).toEqual(harness.data.simple);
    });

    it('data out size is one less than data in (simple)', async () => {
        const opConfig = {
            _op: 'script',
            command: 'test_script_delete_record.py',
            args: [],
            options: {},
            asset: 'test_script'
        };

        const checkData = await harness.runAsync(harness.data.simple, opConfig, context);
        expect(checkData.length).toEqual(harness.data.simple.length - 1);
    });

    it('arguments get passed to script', async () => {
        const opConfig = {
            _op: 'script',
            command: 'test_script_delete_record.py',
            args: ['2'],
            options: {},
            asset: 'test_script'
        };

        const checkData = await harness.runAsync(harness.data.simple, opConfig, context);
        expect(checkData.length).toEqual(harness.data.simple.length - 2);
    });

    it('named args get passed to script', async () => {
        const opConfig = {
            _op: 'script',
            command: 'test_script_delete_record_options.py',
            args: ['--delete=3'],
            options: {},
            asset: 'test_script'
        };
        const checkData = await harness.runAsync(harness.data.simple, opConfig, context);
        expect(checkData.length).toEqual(harness.data.simple.length - 3);
    });

    it('handles error when script does not exist', async () => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script_x.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        try {
            const checkData = await harness.runAsync(data, opConfig, context);
            expect(checkData).toEqual('');
        } catch (error) {
            expect(error.code).toEqual('ENOENT');
            expect(error.errno).toEqual('ENOENT');
            expect(error.syscall).toEqual(`spawn ${assetPath}/test_script_x.py`);
        }
    });

    it('handles error when script has an error', async () => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script_with_error.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        try {
            await expect(harness.runAsync(data, opConfig, context)).toReject();
        } catch (error) {
            const errorLines = error.toString().split('\n');
            expect(errorLines[0].trim()).toEqual('Traceback (most recent call last):');
            expect(errorLines[1].trim()).toEqual(
                `File "${assetPath}/test_script_with_error.py", line 5, in <module>`
            );
            expect(errorLines[2].trim()).toEqual('json_data = json.loads(json_string)');
            expect(errorLines[3].trim()).toEqual("NameError: name 'json' is not defined");
        }
    });

    it('handles error when script does not have exec permissions', async () => {
        const data = [];
        const opConfig = {
            _op: 'script',
            command: 'test_script_with_no_exec.py',
            args: [''],
            options: {},
            asset: 'test_script'
        };
        try {
            await expect(harness.runAsync(data, opConfig, context)).toReject();
        } catch (error) {
            expect(error.code).toEqual('ENOENT');
            expect(error.errno).toEqual('ENOENT');
            expect(error.syscall).toEqual(`spawn ${assetPath}/test_script_with_no_exec.py`);
        }
    });
});
