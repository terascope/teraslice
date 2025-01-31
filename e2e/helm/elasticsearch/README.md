The es binaries in this directory are patched charts from https://artifacthub.io/packages/helm/elastic/elasticsearch (specifically charts versions 7.9.3 and 6.8.9)

Since these charts are no longer maintained, they have incompatible kubernetes api resources that needed to be updated.

The es charts for 6.8.9 and 7.9.3 have a lot files in them and I didn't want to push up 140+ files to the teraslice repo.

In the future we can potentially place these charts in the es assets repo and submit them to artifact hub to get rid of these binaries.
