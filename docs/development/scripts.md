---
title: Development Scripts
sidebar_label: Scripts
---

## NPM Scripts

| Name             | Description                                                                                                                             | Example Usage                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **start**        | Start teraslice teraslice instance.                                                                                                     | `yarn start -c ./teraslice-master.yaml`                                                                     |
| **setup**        | Add any missing dependencies, link the packages together, and build any packages. This is useful to run after pulling down any changes. | `yarn setup`                                                                                                |
| **build**        | Build and compile typescript packages                                                                                                   | `yarn build`                                                                                                |
| **build:all**    | Build and compile all projects including UI projects                                                                                    | `yarn build`                                                                                                |
| **build:watch**  | Build and watch for changes on typescript packages.                                                                                     | `yarn build:watch`                                                                                          |
| **build:docter** | The all-in-one fix the build or tests helper  script                                                                                    | `yarn build:docker`                                                                                         |
| **sync**         | Sync all library versions and handle minor formatting fixes                                                                             | `yarn sync`                                                                                                 |
| **docs**         | Sync up and add any missing docs                                                                                                        | `yarn docs`                                                                                                 |
| **benchmark**    | Run any benchmark tests.                                                                                                                | `yarn benchmark`                                                                                            |
| **bump**         | Update a package to specific version and its dependencies.                                                                              | `yarn bump job-components --release major`, run `yarn bump --help` for more info.                           |
| **test**         | Test all of the packages                                                                                                                | `yarn test` or an individual suite `yarn test --suite elasticsearch`, run `yarn test --help` for more info. |
| **lint**         | Run linting on all of the packages                                                                                                      | `yarn lint`                                                                                                 |
| **lint:fix**     | Fix correctable linting errors in the packages (this should be safe to do)                                                              | `yarn lint:fix`                                                                                             |
