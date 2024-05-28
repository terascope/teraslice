---
title: Updating Node Versions
sidebar_label: Node
---

## Adding a new node verison

Updating node is a multi-step process that requires changes across multiple Terascope repositories.

### 1. Updating Node in the Base Docker Image Repository

Start by modifying the CI YAML files in the base-docker-image repository.

https://github.com/terascope/base-docker-image


#### Modify CI YAML Files

There are two files that need to be updated to create new base images with the appropriate Node versions for Teraslice. These files are:

- build.yml
- release.yml

Add the new Node version to the matrix list in both files.

https://github.com/terascope/base-docker-image/tree/master/.github/workflows

#### Push and Merge Changes

Push your changes to a new branch.
Once the changes are merged and a new release is made, the CI will create new base Docker images with the updated Node version.

#### Verify New Docker Images

The new Docker images will be available on Docker Hub here:

https://hub.docker.com/r/terascope/node-base/tags

### 2. Updating node in assets

Before we can update teraslice we must update the assets. This is because teraslice e2e tests will break if we don't already have asset releases with the new node version.

To start, update `teraslice-cli` to have the ability to build assets with the specified node version.

Update the `bundleTarget` in teraslice/packages/teraslice-cli/src/helpers/asset-src.ts and the `bundle-target` `choices` array in teraslice/packages/teraslice-cli/src/helpers/yargs-options.ts

Afterwards bump `teraslice-cli` and make a new npm release.

Next we need to update the workflows repo to include the new node version:

https://github.com/terascope/workflows

Update node matrices in workflows/.github/workflows/asset-build-and-publish.yml and workflows/.github/workflows/asset-test.yml

After it's merged, Copy hash from the merge of workflows and append to `uses` in .github/workflows/build-and-publish-asset.yml and .github/workflows/test-asset.yml of each of these assets:

- https://github.com/terascope/file-assets
- https://github.com/terascope/standard-assets
- https://github.com/terascope/kafka-assets
- https://github.com/terascope/elasticsearch-assets

Example `test-asset.yml`:

```yaml
jobs:
  call-asset-test-workflow:
    uses: terascope/workflows/.github/workflows/asset-test.yml@ieqo2423biu22 <- Replace everything after `@` w/ new merge hash
    secrets: inherit
```

**_IMPORTANT NOTE:_** elasticsearch-assets has it's own `test-asset.yml` so it's important to manually add the node version to the matrices of that file.

Create all new releases for the assets before moving on to the next step.

### 3. Updating node in teraslice

Add the new node version to all the spots needed inside each file in `.github/workflows` in teraslice.

- publish-master.yml
- publish-tag.yml
- test.yml

Once the node version has been added to the arrays of all the workflow .yml files, pushing the branch and making a new PR should trigger CI to run new tests with the added node version. Once all tests are passing, then a new node version has been succesfully introduced to teraslice.
