#!/usr/bin/env bash
# Creates the S3 user.

ROLE=setup
source /scripts/common.sh

S3_USER=${S3_USER:-test}
S3_ACCESS_KEY=${S3_ACCESS_KEY:?}
S3_SECRET_KEY=${S3_SECRET_KEY:?}
RGW_PORT=${RGW_PORT:-8000}
# The compose service name, not a container_name
export S3_ENDPOINT=${S3_ENDPOINT:-http://rgw:${RGW_PORT}}
export S3_ACCESS_KEY S3_SECRET_KEY

wait_for_conf
wait_for_mon

log "waiting for the RGW endpoint at ${S3_ENDPOINT} ..."
tries=90
until curl -fsS -o /dev/null "${S3_ENDPOINT}"; do
  tries=$((tries - 1))
  [ "$tries" -le 0 ] && die "RGW never became reachable"
  sleep 2
done

if radosgw-admin user info --uid="$S3_USER" >/dev/null 2>&1; then
  log "S3 user '${S3_USER}' already exists"
else
  log "creating S3 user '${S3_USER}'"
  radosgw-admin user create \
    --uid="$S3_USER" \
    --display-name="Local test user" \
    --access-key="$S3_ACCESS_KEY" \
    --secret-key="$S3_SECRET_KEY" >/dev/null
fi

wait_for_health 60

cat >&2 <<EOF

  ------------------------------------------------------------------
  Ceph is up. S3 endpoint ready.

    Endpoint (from host)  http://localhost:${RGW_PORT}
    Endpoint (in-network) http://rgw:${RGW_PORT}
    Region                us-east-1
    Access key            ${S3_ACCESS_KEY}
    Secret key            ${S3_SECRET_KEY}

  Use path-style addressing; virtual-host style needs DNS wildcards.
  ------------------------------------------------------------------

EOF

ceph -s >&2
