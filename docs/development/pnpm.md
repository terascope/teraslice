---
title: Updating pnpm
sidebar_label: pnpm
---

## Updating pnpm

To update the pnpm version, follow these steps:

1. Update the `packageManager` field in the root `package.json` to the desired version:

    ```json
    "packageManager": "pnpm@x.x.x"
    ```

2. Execute the commands below to ensure the installation is successful:

    ```bash
    pnpm install && pnpm run setup
    ```

3. Verify that the top-level `package.json` file includes the `packageManager` field with the updated version.

4. Update the `packageManager` field in the `package.json` file located at `teraslice/packages/teraslice-cli/test/fixtures/testAssetWithBuild` to match the updated pnpm version. After making the change, run the following command in the same directory to update the lock file:

    ```bash
    pnpm install
    ```

5. Update the `packageManager` field in the `package.json` file located in the `teraslice/website` directory to reflect the updated pnpm version.
