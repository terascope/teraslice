---
title: Tests
---

**Note:** elasticseach 6 is required for running the tests

#### Test all of the packages

```sh
yarn test
```

#### Test a single package

```sh
cd packages/[package-name];
yarn test
```

#### Test a single file

```sh
cd packages/[package-name];
yarn test --testPathPattern 'example-spec'
```

#### Test a single file expectation

```sh
cd packages/[package-name];
yarn test --testPathPattern 'example-spec' -t 'should output hello world'
```

#### Test a single package in debug mode

```sh
cd packages/[package-name];
yarn test:debug
# or with a different debug scope
env DEBUG='*execution-controller*' yarn test:debug
```

#### Test a single package in watch mode

```sh
cd packages/[package-name];
yarn test:watch
```
