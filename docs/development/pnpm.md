---
title: pnpm
sidebar_label: pnpm
---

## Installing pnpm

pnpm is managed via [Corepack](https://nodejs.org/api/corepack.html), which ships with Node.js >= 16.13.0. Corepack reads the `packageManager` field in the root `package.json` and automatically uses the correct pnpm version — no manual pnpm installation required.

To enable Corepack, run:

```bash
corepack enable
```

After that, `pnpm` will be available and pinned to the version declared in `package.json`. You can verify it is working with:

```bash
pnpm --version
```

> **Note:** If you have pnpm installed via another method (e.g. `npm i -g pnpm`), Corepack may conflict with it. It is recommended to uninstall any globally installed pnpm and rely solely on Corepack.

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
