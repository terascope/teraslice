# Ceph test service

A single-node Ceph cluster (1 mon, 1 mgr, 1 OSD, 1 RGW) providing an
S3-compatible endpoint for tests. The OSD is a BlueStore store on a sparse file,
so there are no loop devices, no `--privileged`, and nothing touching the host's
disks.

## Under `ts-scripts test`

The `opensearch` suite runs on Ceph. Any other package opts in by setting
`TEST_CEPH='true'` in its `test` script, the same way packages opt into
OpenSearch — at 1.3GB, only the packages that need it should pay for it.

`ensureCeph()` (`src/helpers/test-runner/services.ts`) generates the `.env` file
in this directory from `src/helpers/config.ts`, runs `up -d`, waits for the
`setup` one-shot to exit 0, and runs `down -v` on teardown. Tests read
`CEPH_HOST`, `CEPH_ACCESS_KEY`, and `CEPH_SECRET_KEY` from the environment.

**No bucket is pre-created.** The stack gives you an S3 user; every test makes
whatever buckets it needs and cleans them up.

Every `CEPH_*` key in `config.ts` is overridable by an env var of the same name.

## Standalone

```sh
cp .env.example .env
docker compose up -d          # ~27s cold on a warm image, ~12s if volumes survive
docker compose run --rm toolbox   # a shell with ceph / radosgw-admin / rados
docker compose down -v        # -v matters; see below
```

Use **path-style** S3 addressing — virtual-host style needs wildcard DNS.

## How addressing works

Nothing here pins an IP or a subnet. `mon.sh` reads the monitor's own address
off its interface at runtime, writes it into `ceph.conf` and the monmap, and
every other daemon finds the monitor through that shared `ceph.conf`. Docker is
therefore free to allocate whatever range is available, and this stack can never
collide with an existing network.

That is also why bootstrapping lives inside `mon.sh` rather than in a container
of its own: a separate bootstrap container cannot know what address the monitor
will get, so it would have to be told one in advance — which is what forced the
pinned subnet in the first place.

If docker hands out a different address on a later `up`, `mon.sh` notices that
the stored monmap disagrees, rewrites it in place (preserving the fsid and map
epoch) and carries on. Verified by squatting on the old subnet and bringing the
cluster back up: same fsid, `HEALTH_OK`, stored objects intact.

The one case this does not cover is the docker daemon reassigning addresses
underneath containers that keep running — the monitor recovers, but an OSD that
was never restarted will still be pointed at the old address. Restart the stack.

## Things that will bite you

**`down` without `-v` keeps the cluster.** The named volumes hold the fsid,
keyrings, monmap, and OSD stores, and every script is idempotent, so a plain
`down`/`up` deliberately reuses the existing cluster. That is what makes
restarts fast (~12s vs ~27s), and it also means config that only applies at
creation time — `osd_pool_default_size`, and so `OSD_COUNT` — will not change
until you `down -v`.

**Changing `OSD_COUNT` requires `down -v`.** `osd.sh` skips provisioning when it
finds a `ready` marker, so going 3→1 on existing volumes leaves osd.1 and osd.2
in the osdmap with no daemons behind them — degraded forever. Raising the count
also means adding matching `osd1`, `osd2`... service blocks; compose can't
template them, so the count is structural in the YAML. Each OSD provisions
itself, so such a block is a copy of `osd0` with a different `OSD_ID`.

**No `container_name:` keys.** Container names are globally unique in Docker, so
hardcoding them would stop two stacks coexisting even under different project
names. Containers are `<project>-<service>-1`, and in-network addressing uses
the compose service name (`rgw`, `mon`).

**Shell env does not reach the containers.** Compose's precedence is
`environment:` > shell env (for `${VAR}` interpolation only) > `env_file`. The
scripts inside the containers read their values from `env_file`, so exporting
`RGW_PORT` changes what compose publishes but *not* what `rgw.sh` binds to.
Change the `.env` file, not your shell.

**Readiness is `setup` exiting, not the containers starting.** `up -d` already
blocks on the `depends_on` chain, so it returns with the cluster healthy and RGW
serving; the only thing still outstanding is `setup`, which creates the S3 user.
`up --wait` doesn't cover it — `setup` has no healthcheck and nothing depends on
it, so `--wait` only requires that it started — and `docker compose wait setup`
errors with "no containers for project" once that container has exited. Use
`docker compose ps -a setup` instead, which keeps listing it after it exits.

## Not yet

TLS on the RGW endpoint. `rgw.sh` starts a plain beast frontend; beast supports
`ssl_port=`/`ssl_certificate=`, but it needs a cert minted for the hostname
clients actually connect on. MinIO still covers the encrypted e2e target until
then.
