# README

The `patches` directory is used to store patches made using [patch-package](https://github.com/ds300/patch-package/blob/master/README.md).

## How to make a patch

### Making patches

First make changes to the files of a particular package in your node_modules folder, then run

```bash
pnpm patch package-name
```

### Nested packages

If you are trying to patch a package at, e.g. node_modules/package/node_modules/another-package you can just put a / between the package names:

```bash
npx patch-package package/another-package
```

### Updating patches

Use exactly the same process as for making patches in the first place, i.e. make more changes, run patch-package, commit the changes to the patch file.

## Current Patches

None
