---
title: Releases
---

A Teraslice "release" is not just the [teraslice package](../packages/teraslice/overview.md) alone but a set of version locked packages that work together with teraslice. This is important to note since the packages can change and be released often, but a release undergoes QA. Each release should be attached to a [Github Milestone](https://github.com/terascope/teraslice/milestones) and all issues "fixed" since the previous release should be linked to that Milestone.

When a release is created, it should be marked as a "pre-release" until QA has verified all the issues attached to the milestone are "fixed". If a release fails QA, another release will need to be made with a patch, or a hot-fix will need to be applied to that release. A "hot-fix" can be made by creating a branch from tag, making the fix, and creating a release from that branch. Any regressions caused in a "release" should be filed in an issue and attached to the Milestone.

**NOTE:** Github Actions handles most of the automation around deploying, publishing and building packages, releases and documentation.

## Release Candidates / Pre-releases

An RC (release candidate) should be used for proving a release before merging the PR. To create the initial RC release, first create a pull-request, then bump the package(s) using `--premajor` (`v0.1.0=>v1.0.0-rc.0`), `--preminor` (`v0.1.0=>v0.2.0-rc.0`), `--prepatch` (`v0.1.0=>v0.1.1-rc.0`). If you are creating an RC release of Teraslice, make sure to bump `teraslice`. Once that is pushed, Github actions will automatically publish the docker image and/or NPM packages. **IMPORTANT:** Make sure to commit using the suggested `git commit` command after running `yarn bump`

For changes to your RC, make sure to use `yarn bump --prerelease [...packages]`, since that will only bump the pre-release version number, so `v0.2.0-rc.0=>v0.2.0.rc.1`. Once the RC version has been verified, make sure to bump the package again using the same release increment used to initially bump, for example, if you used `--preminor` for the initial bump, then use `--minor` to bump it.

### Major Teraslice Pre-releases

For major Teraslice release milestones that will contain breaking changes we create a development branch named `release/teraslice-v*`. This branch will start off using the `-dev.*` pre-release tag. The version should be bumped to `v*.0.0-dev.0` with the first PR merged into the branch by running `yarn bump --premajor --prerelease-id dev teraslice ...packages`. When PRs with a new prerelease version are merged into a `release/teraslice-v*` branch it will trigger the `publish-dev.yml` github actions workflow. This will do the following:

- create an npm package for each teraslice package that has been bumped, tagged as `prerelease`
- create a docker image for each node version currently supported, tagged as `v*.0.0.-dev.*-nodev*.*.*`
- create a github release titled `v*.0.0.-dev.*` with an identical git tag
- create a slack announcement with links to the github release, npm, and docker container registry. Automated release notes should be reviewed and edited if necessary.

To bump the `dev` prerelease version run `yarn bump --prerelease --prerelease-id dev teraslice ...packages`.
Once all milestone goals have been reached the version can be bumped to an `-rc.0` tag by running `yarn bump --premajor teraslice ...packages`. Once QA has passed on the release candidate the version can be bumped to `v*.0.0` by running `yarn bump --major teraslice ...packages`. Then a PR against the master branch can be created to merge in all milestone changes.

#### Keeping the release branch up to date with master

Whenever a release branch is open and merges are made to the master branch, the release branch should be immediately rebased to master to keep merge conflicts to a minimum. A developer with the proper github privileges to push directly to `release/teraslice-v*` will need to do the following:

- `git switch master`
- `git pull origin master`
- `git switch release/teraslice-v*`
- `git pull origin release/teraslice-v*`
- `git rebase master`
- `git push --force-with-lease`

The `--force-with-lease` flag prevents any commits pushed to the origin `release/teraslice-v*` branch since you pulled from being overwritten by the force push. If you are out of sync with origin the command will fail.

Once the branch has been rebased inform other developers working on `release/teraslice-v*` that they need to do the following:

- `git switch release/teraslice-v*`
- `git fetch origin release/teraslice-v*`
- `git reset --hard origin/release/teraslice-v*`

If they have an active feature branch:

- `git switch <your-feature-branch>`
- `git rebase release/teraslice-v*`
- `git push <your-feature-branch> --force-with-lease`
