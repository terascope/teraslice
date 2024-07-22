---
title: Updating Node Versions
sidebar_label: Node
---

## Adding a new node verison

Updating node is a multi-step process that requires changes across multiple Terascope repositories.

### 1. Updating Node in the Base Docker Image Repository

Start by modifying the CI YAML files in the base-docker-image repository.

https://github.com/terascope/base-docker-image

### Note on how tags and node versions work in the base image

The workflow for the base image tags is closely linked to the Node.js version used in the image. Here's a simple breakdown of how it works:

**Major Version Tag:** The base image will either grab the latest available version of a specific major Node.js release from the node alpine image(e.g., Node 18) or it will be pinned to the latest node version that is compatible with the base image. This image is tagged with the major version number (e.g., 18). So in some cases this version will be pinned and not completely up to date with a node release. This tag is always overwritten on release.

**Major-Minor Version Tag:** Next, it will retag and include both the major and minor version numbers (e.g., 18.14). This tag is updated to reflect the latest minor release within the specified major version. This tag will get overwritten in the case of a node-base change or if a new patch is relased for this minor version of node.

**Major-Minor-Patch Version Tag:** Finally, the image will be re-tagged again with the complete version number, including the major, minor, and patch versions (e.g., 18.14.2). This tag points to a specific version of the Node.js release. This image only gets overwritten on a change to the node-base image that isn't node version related.

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
