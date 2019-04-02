# <%= name %> 

> <%= description %>

This asset bundle requires a running Teraslice cluster, you can find the documentation [here](https://github.com/terascope/teraslice/blob/master/README.md).  
More information on using the cli to deploy and create assets can be found [here](https://terascope.github.io/teraslice/docs/packages/teraslice-cli/overview#assets-commands-to-manage-assets-before-using-the-assets-command-add-clusters-via-the-aliases-command).

## Getting Started
 This asset was created with an example batch processor.  Use the teraslice-cli to add more processors.  
```
teraslice-cli assets init --processor
```
One the asset is ready deploy it with:

```
teraslice-cli assets <cluster-alias> deploy --build
```

## Operations

 * put your operation details here

## Tests
 * Tests need to be named test_name-spec.js
 * Use the example tests in the test dir as a framework for adding more tests
 * Run the tests with `yarn test` in the root directory of this asset
 * More details on the test-harness can be found [here](https://terascope.github.io/teraslice/docs/packages/teraslice-test-harness/overview)
