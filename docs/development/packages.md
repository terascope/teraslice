---
title: Teraslice Packages
sidebar_label: Packages
---

## Adding a package

- **Step 1:** Use [generator-teraslice](../packages/generator-teraslice/overview.md) to generate a package.
- **Step 2:** Update the docs `pnpm docs` in root repo.
- **Step 3:** Add the new package documentation to `./website/sidebars.json`
- **Step 4:** If the package should *NOT* be included in the teraslice docker image add the package to the `./.dockerignore` file.
- **Step 5:** If the package uses typescript, add the package to the `./tsconfig.json`. Make sure to order by putting it after of its dependencies.
- **Step 6:** Create a new github issue [label](https://github.com/terascope/teraslice/labels) for the new package. Use the convention `pkg/$(basename "./packages/new-pkg-name")`, for example `@terascope-utils` is `pkg/utils` and `ts-transforms` is `pkg/ts-transforms`.
- **Step 7:** Make sure to commit the changes
