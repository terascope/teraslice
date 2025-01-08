---
title: Updating Yarn
sidebar_label: Yarn
---

## Updating yarn

To update the Yarn version, follow these steps:

1. Run the following command to set the desired Yarn version, replacing `x.x.x` with the target version:

    ```bash
    yarn set version x.x.x
    ```

2. Execute the commands below to ensure the installation is successful:

    ```bash
    yarn && yarn setup
    ```

3. Verify that the top-level `package.json` file includes the `packageManager` field with the updated version.

4. Update the `packageManager` field in the `package.json` file located at `teraslice/packages/teraslice-cli/test/fixtures/testAssetWithBuild` to match the updated Yarn version. After making the change, run the following command in the same directory to update the yarn.lock file:

    ```bash
    yarn install
    ```

    **_Note:_** The `teraslice-cli` tests may fail in CI if the `yarn.lock` file is modified during CI runs due to Yarn's hardened mode.

5. Update the `packageManager` field in the `package.json` file located in the `teraslice/website` directory to reflect the updated Yarn version.

