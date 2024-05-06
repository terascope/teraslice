---
title: Updating Node Versions
sidebar_label: Node
---

## Adding a new node verison

Updating node is a multi-step process that starts with updating the CI yaml files within the `base-docker-image` repo.

https://github.com/terascope/base-docker-image

There are two files that must be modified in order to create new base images that have the new appropriate node versions for teraslice to use. They can be located here:

https://github.com/terascope/base-docker-image/tree/master/.github/workflows

- build.yml
- release.yml

Add the node version in the array list of each file and push up a new branch. Once merged and a new release is made, CI should create new base docker images with the new node version that was added. They will show up on docker-hub here:

https://hub.docker.com/r/terascope/node-base/tags

Once finished, add the new node version to all the spots needed inside each file in `.github/workflows`.
