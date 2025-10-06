---
title: Releases
---

A Teraslice "release" is not just the [teraslice package](../packages/teraslice/overview.md) alone but a set of version locked packages that work together with teraslice. This is important to note since the packages can change and be released often, but a release undergoes QA. Each release should be attached to a [Github Milestone](https://github.com/terascope/teraslice/milestones) and all issues "fixed" since the previous release should be linked to that Milestone.

When a release is created, it should be marked as a "pre-release" until QA has verified all the issues attached to the milestone are "fixed". If a release fails QA, another release will need to be made with a patch, or a hot-fix will need to be applied to that release. A "hot-fix" can be made by creating a branch from tag, making the fix, and creating a release from that branch. Any regressions caused in a "release" should be filed in an issue and attached to the Milestone.

**NOTE:** Travis-CI handles most of the automation around deploying, publishing and building packages, releases and documentation.

### Daily Releases ###

Potentially unstable releases will be made daily via Travis-CI to create a nightly release in docker hub. The tag will be formatted like `daily-%Y.%m.%d-[commit-hash]` for example, `terascope/teraslice:daily-2018.08.02-3495d5c3`.

The docker image is automated via travis-ci and is built with the following script:

```sh
yarn ts-scripts publish --tags dev docker
```

### Release Candidates / Pre-releases ###

First RC (release candidate) should be used for proving a release before merging the PR. To create the initial RC release, first create a pull-request, then bump the package(s) using `--premajor` (`v0.1.0=>v1.0.0-rc.0`), `--preminor` (`v0.1.0=>v0.2.0-rc.0`), `--prepatch` (`v0.1.0=>v0.1.1-rc.0`). If you creating a RC release of Teraslice, make sure to bump `teraslice`. Once that is pushed, Travis-CI will automatically publish the docker image and/or NPM packages. **IMPORTANT:** Make sure to commit using the suggested `git commit` command after running `yarn bump`

For changes to your RC, make sure to use `yarn bump --prerelease [...packages]`, since that will only bump the pre-release version number, so `v0.2.0-rc.0=>v0.2.0.rc.1`. Once the RC version has been verified, make sure to bump the package again using same release increment used to initially bump, for example, if you used `--preminor` for the initial bump, then use `--minor` to bump it.
