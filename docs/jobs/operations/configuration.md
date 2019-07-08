---
title: Operation Configuration
sidebar_label: Configuration
---

### Readers and Processors

| Configuration         | Description                                                                                                                                                                                                                                                                                                                                                                  | Type     | Notes    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| `_op`                 | Name of operation, it must reflect the exact name of the file                                                                                                                                                                                                                                                                                                                | `String` | required |
| `_encoding`           | Used for specifying the data encoding type when using `DataEntity.fromBuffer`. Defaults to `json`.                                                                                                                                                                                                                                                                           | `String` | optional |
| `_dead_letter_action` | This action will specify what to do when failing to parse or transform a record. ​​​​​The following builtin actions are supported, "throw", "log", or "none". If none of the actions are specified it will try and use a registered [Dead Letter Queue](../dead-letter-queue.md) API under that name. The API must be already be created by a operation before it can used.​ | `String` | required |

### APIs

| Configuration | Description                                                                                                                                                                                                          | Type     | Notes    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| `_name`       | The _name property is required, and it is required to be unqiue but can be suffixed with a identifier by using the format "example:0", anything after the ":" is stripped out when searching for the file or folder. | `String` | required |

## Built-in Processors

### script
This is used to allow other languages other than javascript to process data. Note that this is not meant to be highly efficient as it creates a child process that runs the specified script in the job.  Communication between teraslice and the script is done stdin and stdout with the data format expected to be JSON. If another language is needed, it might be a better idea to use C++ or rust to add a module that Node can create native bindings so that you can require the code like a regular javascript module.

Example configuration
```js
{
    "_op": "script",
    "command": "someFile.py",
    "args": ["-someFlag1", "-someFlag2"],
    "asset": "someAsset",
    "options": {}
}
```

Example Job: `examples/jobs/script/test_script_job.json`
```js
{
    "name": "ES DataGen test script",
    "lifecycle": "persistent",
    "workers": 1,
    "assets": ["elasticsearch"],
    "operations": [
        {
            "_op": "elasticsearch_data_generator",
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

| Configuration | Description                                                   | Type     | Notes    |
| ------------- | ------------------------------------------------------------- | -------- | -------- |
| `_op`         | Name of operation, it must reflect the exact name of the file | `String` | required |
| `command`     | what command to run                                           | String   | required |
| `args`        | arguments to pass along with the command                      | `Array`  | optional |
| `options`     | Obj containing options to pass into the process env           | `Object` | optional |
| `asset`       | Name of asset containing command to run                       | `String` | optional |

Note: [ nodejs 8.x spawn documentation ](https://nodejs.org/dist/latest-v8.x/docs/api/child_process.html#child_process_child_process_spawn_command_args_options)

**script usage example:**

Create and upload asset
```bash
cd examples/jobs/script
zip -r test_script.zip test_script
curl -XPOST -H "Content-Type: application/octet-stream" localhost:5678/assets --data-binary @test_script.zip
```
Submit Job
```bash
curl -XPOST localhost:5678/jobs -d@test_script_job.json
```

### stdout
This is primarily used for develop purposes, it console logs the incoming data, it's meant to inspect in between operations or end of outputs

Example configuration
```js
{
    "_op": "stdout"
}
```

| Configuration | Description                                                                                                       | Type     | Notes    |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | -------- | -------- |
| `limit`       | Specify a number > 0 to limit the number of results printed to the console log.  Default is to print all results. | `Number` | optional |

### noop

This processor simply passes the data through, unmodified. It is primarily used for develop purposes.

Example configuration
```js
{
    "_op": "noop"
}
```

There is no configuration for this processor.

### delay

Wait a specific amount of time, and passes the data through.

Example configuration
```js
{
    "_op": "delay",
    "ms": 1000
}
```

| Configuration | Description                                       | Type     | Notes                       |
| ------------- | ------------------------------------------------- | -------- | --------------------------- |
| `ms`          | Milliseconds to delay before passing data through | `Number` | optional, defaults to `100` |
