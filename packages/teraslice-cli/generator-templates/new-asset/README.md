# <%= name %> 

> <%= description %>

## General Asset Instructions
Assets allow for customization of teraslice jobs by modifying or manipulating the data read from a source before writing it back to somewhere else.

Typically an asset is composed of one or more processors found in the` asset_name/asset` directory.  Each processor is made up of the processor code and a schema.  In this asset the schema and processor are split into seperate files named accordingly.  Go to the `<%= name %>/asset/example` directory to see an example.

Every asset has the same general setup and directory structure.  For an asset to be used it must be zipped and deployed to a teraslice cluster and referenced by a [teraslice job](https://terascope.github.io/teraslice/docs/configuration/ops).  The teraslice-cli can handle most of this process with a few commands.

## Processor and Schema
This asset was created with an example batch processor and schema.  Both of these files are found in the `<%= name %>/asset` directory.  The processor.js is where the data processing code is written and the schema.js is used to allow customization between the processor.js and the job utilizing the asset.  The `test/example-spec.js` has an example of how this works.  

The `opConfig` object in the example-spec.js has a `type` property that is referenced in the example batch processor.  The simple code example uses `this.opConfig.type` to add that value to each document passed through the processer.  The opConfig properties and defined in the schema.js and set in the job.

The schema.js also allows for filters and checks so that only valid values are passed from the job configuration file to the processor.

There are three types of processors, batch, map, and filter, that can be created the by the teraslice-cli.  The batch processor expects an array of data as the input while the map and filter processors handle one item at a time.  To view a map or filter processor use the `teraslice-cli assets init --processor` command and select that type when prompted.

## Asset Tests
Tests are great for ensuring the processor does what it is inteded to do.  The test files are in the <%= name %>/test directory.  Using the teraslice-cli to add a processor will automatically create an associated test file in thee test directory.

Run the tests with `yarn test` in the <%= name %> directory.  The test framework uses [jest](https://jestjs.io/docs/en/getting-started) to execute the tests and the [teraslice-test-harness](https://terascope.github.io/teraslice/docs/packages/teraslice-test-harness/overview) to simulate teraslice. Look at the examples in the test directory to see how it fits together. 

The test output shows what tests pass or fail and a test coverage table with details on how well the asset code is covered by the tests. 

## Useful Teraslice-cli commands
Creat an asset

```
teraslice-cli assets init
```

Add another processor

```
teraslice-cli assets init --processor
```

Deploy an asset to a cluster

```
teraslice-cli assets <cluster-alias> deploy --build
```

Create a test job

```
teraslice-cli tjm init
```

## Further Documentation
* [Teraslice](https://github.com/terascope/teraslice/blob/master/README.md).  
* [Teraslice-cli](https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview#assets-commands-to-manage-assets-before-using-the-assets-command-add-clusters-via-the-aliases-command).
