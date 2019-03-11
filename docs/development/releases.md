---
title: Releases
---

A Teraslice "release" is not just the [teraslice package](./pacakges/teraslice/overview.md) but all packages together. This important to note since the packages can change and be released often, but a release undergoes QA. Each release should be attached to [Github Milestone](https://github.com/terascope/teraslice/milestones) and all issues "fixed" since the previous release should be linked to that Milestone.

When a release is created, it should be marked as a "prerelease" until QA has verified all the issues attached to the milestone are "fixed". If a release fails QA, another release will need to be made with a patch, or a hot-fix will need to be applied to that release. A "hot-fix" can be made by creating a branch from tag, making the fix, and creating a release from that branch. Any regressions caused in a "release" should be filed in an issue and attached to the Milestone.

**NOTE:** Travis-CI handles most of the automation around deploying, publishing and building packages, releases and documentation.

### Daily Releases ###

Pontentially unstable releases will be made daily via Travis-CI to create a nightly release in docker hub. The tag will be formatted like `daily-%Y.%m.%d-[commit-hash]` for example, `terascope/teraslice:daily-2018.08.02-3495d5c3`.

The docker image is automated via travis-ci and is built with the following script:

```sh
./scripts/docker-release.sh "daily"
```
