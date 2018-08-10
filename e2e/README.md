# teraslice-integration-tests

Teraslice integration test suite

## Dependencies

* Docker (not sure about minimal version but tested with 17.06.1-ce-rc1)
* Docker Compose (not sure about minimal version but tested with 1.14.0)

# General Notes

Unless specified, all commands are assumed to be run from this e2e tests
directory - utils like `docker-compose` look for files in current dir.

You can run `yarn test` from the directory to run the tests.

There are currently two supported "modes": developer mode & QA/CI mode. The
default dev. To override, `export MODE=qa` in your environment.

## Dev Mode

When in dev mode, the teraslice project root and any npm-linked dependencies
will be bind-mounted into the test image to avoid rebuilds between edits. The
recommended workflow is:

1. From the teraslice project root, `yarn bootstrap` and it will link the teraslice packages together

1. From the teraslice project root, `yarn test:e2e` will run
   the test suite against latest stable versions.

1. Repeat as needed.

# Trouble-Shooting

The environment is managed by `docker-compose`. See the `ps` & `log`
sub-commands to diagnose potential issues in the containers. Here is a recipe to
prettify the teraslice logs:
```
docker-compose logs --no-color teraslice-worker | awk -F' [|] ' '{print $2}' | bunyan -o short
```

## Notes

- Teraslice will attempt to listen on port 45678, make sure to stop an local instance to prevent port collisions

- The port for docker's elasticsearch instance listens on 49200, so you can check it at localhost:49200