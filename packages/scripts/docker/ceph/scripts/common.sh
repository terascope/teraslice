#!/usr/bin/env bash
# Shared helpers for the Ceph role scripts. Sourced, not executed.

set -euo pipefail

CEPH_CONF=/etc/ceph/ceph.conf

log() { echo "[$(date -u '+%H:%M:%S')] [${ROLE:-ceph}] $*" >&2; }

die() { log "FATAL: $*"; exit 1; }

# This container's own IPv4 address on the docker network, read at runtime.
# Nothing in this stack pins an address or a subnet -- see the note at the top
# of mon.sh for why that matters.
own_addr() {
  local addr
  addr=$(hostname -i | tr ' ' '\n' | grep -v ':' | head -1)
  [ -n "$addr" ] || die "could not determine this container's IPv4 address"
  echo "$addr"
}

# Block until the monitor has written the shared ceph.conf.
wait_for_conf() {
  local tries=${1:-120}
  while [ ! -s "$CEPH_CONF" ]; do
    tries=$((tries - 1))
    [ "$tries" -le 0 ] && die "timed out waiting for $CEPH_CONF"
    sleep 1
  done
}

# Block until the monitor forms a quorum and answers.
wait_for_mon() {
  local tries=${1:-120}
  log "waiting for monitor quorum ..."
  until ceph --connect-timeout 5 quorum_status >/dev/null 2>&1; do
    tries=$((tries - 1))
    [ "$tries" -le 0 ] && die "timed out waiting for monitor quorum"
    sleep 2
  done
  log "monitor quorum reached"
}

# Block until at least $1 OSDs report "up".
wait_for_osds() {
  local want=$1 tries=${2:-180} up=0
  log "waiting for $want OSD(s) to come up ..."
  while :; do
    up=$(ceph osd stat -f json 2>/dev/null \
      | python3 -c 'import sys,json; print(json.load(sys.stdin)["num_up_osds"])' 2>/dev/null || echo 0)
    [ "$up" -ge "$want" ] && break
    tries=$((tries - 1))
    [ "$tries" -le 0 ] && die "timed out waiting for OSDs (only $up/$want up)"
    sleep 2
  done
  log "$up OSD(s) up"
}

# Block until the cluster reports HEALTH_OK (HEALTH_WARN is tolerated after a
# grace period -- a fresh cluster warns while PGs are still peering).
wait_for_health() {
  local tries=${1:-120} status=""
  log "waiting for cluster health ..."
  while :; do
    status=$(ceph health 2>/dev/null | awk '{print $1}' || true)
    [ "$status" = "HEALTH_OK" ] && break
    tries=$((tries - 1))
    if [ "$tries" -le 0 ]; then
      log "cluster is $status, continuing anyway:"
      ceph -s >&2 || true
      return 0
    fi
    sleep 2
  done
  log "cluster is HEALTH_OK"
}

fix_perms() {
  chown -R ceph:ceph "$@" 2>/dev/null || true
}
