---
title: "Built-in Operations"
---

## script

This is used to allow languages other than javascript to process data. Note that this is not meant to be highly efficient as it creates a child process that runs the specified script in the job.  Communication between teraslice and the script is done stdin and stdout with the data format expected to be JSON. If another language is needed, it might be a better idea to use C++ or rust to add a module that Node can create native bindings so that you can require the code like a regular javascript module.

| Configuration | Description                                                   | Type     | Notes    |
| ------------- | ------------------------------------------------------------- | -------- | -------- |
| `_op`         | Name of operation, it must reflect the exact name of the file | `String` | required |
| `command`     | what command to run                                           | String   | required |
| `args`        | arguments to pass along with the command                      | `Array`  | optional |
| `options`     | Obj containing options to pass into the process env           | `Object` | optional |
| `asset`       | Name of asset containing command to run                       | `String` | optional |

Note: [nodejs 8.x spawn documentation](https://nodejs.org/dist/latest-v8.x/docs/api/child_process.html#child_process_child_process_spawn_command_args_options)

Example configuration:

```json
{
    "_op": "script",
    "command": "someFile.py",
    "args": ["-someFlag1", "-someFlag2"],
    "asset": "someAsset",
    "options": {}
}
```

Example Job: `examples/jobs/script/test_script_job.json`

```json
{
    "name": "ES DataGen test script",
    "lifecycle": "persistent",
    "workers": 1,
    "assets": ["standard"],
    "operations": [
        {
            "_op": "data_generator",
            "size": 100000,
            "stress_test": true
        },
        {
            "_op": "script",
            "command": "test_script.py",
            "asset": "test_script",
            "args": [""],
            "options": {}
        },
        {
            "_op": "noop"
        }
    ]
}
```

**script usage example:**

- Create and upload asset

```bash
cd examples/jobs/script
zip -r test_script.zip test_script
curl -XPOST -H "Content-Type: application/octet-stream" localhost:5678/assets --data-binary @test_script.zip
```

- Submit Job

```bash
curl -XPOST localhost:5678/jobs -d@test_script_job.json
```

## stdout

This is primarily used for develop purposes, it console logs the incoming data, it's meant to inspect in between operations or end of outputs

| Configuration | Description                                                                                                       | Type     | Notes    |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| `limit`       | Specify a number > 0 to limit the number of results printed to the console log.  Default is to print all results. | `Number` | optional |

Example configuration

```json
{
    "_op": "stdout"
}
```

## noop

This processor simply passes the data through, unmodified. It is primarily used for develop purposes.

Example configuration:

```json
{
    "_op": "noop"
}
```

There is no configuration for this processor.

## delay

Wait a specific amount of time, and passes the data through.

| Configuration | Description                                       | Type       | Notes                       |
| ------------- | ------------------------------------------------- | ---------- | --------------------------- |
| `ms`          | Milliseconds to delay before passing data through | `duration` | optional, defaults to `100` |

Example configuration:

```json
{
    "_op": "delay",
    "ms": 1000
}
```

## test-reader

Slice and fetch data specified in a file. Useful for testing processors in [teraslice-test-harness](../packages/teraslice-test-harness/overview.md).

| Configuration            | Description                                                                                    | Type        | Notes    |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ----------- | -------- |
| `passthrough_slice`      | If set to true then the fetcher will return what it is given, expects the value to be an array | `File Path` | optional |
| `fetcher_data_file_path` | File to path to JSON array of data records.                                                    | `File Path` | optional |
| `slicer_data_file_path`  | File to path to JSON array of slice request.                                                   | `File Path` | optional |

Example configuration for reading for a file:

```json
{
    "_op": "test-reader",
    "fetcher_data_file_path": "/path/to/fetcher-data-file.json"
}
```

`/path/to/fetcher-data-file.json`

```json
[
    {
        "foo": "bar"
    },
    {
        "foo": "baz"
    },
]
```

Example test for `pass_through_slice`:

```js
const { WorkerTestHarness, newTestJobConfig } = require('teraslice-test-harness');

describe('Pass Through Test', () => {
    const job = newTestJobConfig({
        operations: [
            {
                _op: 'test-reader',
                passthrough_slice: true
            },
            { _op: 'noop' }
        ],
    });

    const harness = new WorkerTestHarness(job, {});

    beforeAll(() => harness.initialize());
    afterAll(() => harness.shutdown());

    it('should be able to run a slice', async () => {
        const input = [
            { foo: 'bar' },
            { foo: 'baz' }
        ];

        const output = await harness.runSlice(input);
        expect(output).toEqual(input);
    });
});
```
