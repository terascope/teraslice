---
title: Updating Node Versions
sidebar_label: Node
---

## Adding a new node version

Updating node is a multi-step process that requires changes across multiple Terascope repositories.

### 1. Updating node in teraslice

Add the new node version to all the spots needed inside each file in `.github/workflows` in teraslice.

- publish-master.yml
- publish-tag.yml
- publish-dev.yml
- test.yml

Once the node version has been added to the arrays of all the workflow .yml files, pushing the branch and making a new PR should trigger CI to run new tests with the added node version. Once all tests are passing, then a new node version has been successfully introduced to teraslice.

### 2. Updating node in assets

Update the [workflows](https://github.com/terascope/workflows) repo to include the new node version:

Update node matrices in workflows/.github/workflows/asset-build-and-publish.yml and workflows/.github/workflows/asset-test.yml

After it's merged, Copy hash from the merge of workflows and append to `uses` in .github/workflows/build-and-publish-asset.yml and .github/workflows/test-asset.yml of each of these assets:

- [file-assets](https://github.com/terascope/file-assets)
- [standard-assets](https://github.com/terascope/standard-assets)
- [kafka-assets](https://github.com/terascope/kafka-assets)
- [elasticsearch-assets](https://github.com/terascope/elasticsearch-assets)
- [chaos-assets](https://github.com/terascope/chaos-assets)

Example `test-asset.yml`:

```yaml
jobs:
  call-asset-test-workflow:
    uses: terascope/workflows/.github/workflows/asset-test.yml@ieqo2423biu22 <- Replace everything after `@` w/ new merge hash
    secrets: inherit
```

**_IMPORTANT NOTE:_** elasticsearch-assets has it's own `test-asset.yml` so it's important to manually add the node version to the matrices of that file.

Create all new releases for the assets before moving on to the next step.

## Changing the default node version

Although multiple node versions are supported, there is always a "default" version.
To set a new default version make changes to the following:

### 1. In workflows repo

- .github/workflows/asset-build-and-publish.yml - assets-upload job `node-version` variable
- .github/workflows/asset-test.yml - test-macos job `node-version` variable
- .github/workflows/refresh-docker-cache.yml and .github/workflows/cache-docker-images.yml - `node-version` variable

### 2. In teraslice repo

- Update all .github/workflows that use the workflows repo with the new commit hash from step 1
- Dockerfile and Dockerfile.dev - `NODE_VERSION` variable
- .github/workflows/publish-master.yml, .github/workflows/publish-dev.yml and .github/workflows/publish-tag.yml - `node-version` variable
- .github/workflows/test.yml - set `NODE_VERSION_MAIN` and `NODE_VERSION_EXT_STORAGE` variables (used by verify-build, lint-and-sync , and e2e-external-storage-tests jobs)
- packages/scripts/src/helpers/config.ts - `__DEFAULT_NODE_VERSION` variable
- packages/teraslice-cli/src/helpers/asset-src.ts - `bundleTarget` default in the constructor
- e2e/helm/values.yaml - `teraslice.image.tag` property
