---
title: Development Scripts
sidebar_label: Scripts
---

## NPM Scripts

| Name             | Description                                                                                                                             | Example Usage                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **start**        | Start teraslice teraslice instance.                                                                                                     | `pnpm start -c ./teraslice-master.yaml`                                                                     |
| **setup**        | Add any missing dependencies, link the packages together, and build any packages. This is useful to run after pulling down any changes. | `pnpm run setup`                                                                                                |
| **build**        | Build and compile typescript packages                                                                                                   | `pnpm build`                                                                                                |
| **build:watch**  | Build and watch for changes on typescript packages.                                                                                     | `pnpm build:watch`                                                                                          |
| **build:docter** | The all-in-one fix the build or tests helper  script                                                                                    | `pnpm build:docker`                                                                                         |
| **sync**         | Sync all library versions and handle minor formatting fixes                                                                             | `pnpm sync`                                                                                                 |
| **docs**         | Sync up and add any missing docs                                                                                                        | `pnpm docs`                                                                                                 |
| **bump**         | Update a package to specific version and its dependencies.                                                                              | `pnpm bump job-components --release major`, run `pnpm bump --help` for more info.                           |
| **test**         | Test all of the packages                                                                                                                | `pnpm test` or an individual suite `pnpm test --suite elasticsearch`, run `pnpm test --help` for more info. |
| **lint**         | Run linting on all of the packages                                                                                                      | `pnpm lint`                                                                                                 |
| **lint:fix**     | Fix correctable linting errors in the packages (this should be safe to do)                                                              | `pnpm lint:fix`                                                                                             |
