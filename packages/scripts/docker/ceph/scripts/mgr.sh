#!/usr/bin/env bash
ROLE=mgr
source /scripts/common.sh

MGR_ID=${MGR_ID:-x}
MGR_DATA=/var/lib/ceph/mgr/ceph-${MGR_ID}

wait_for_conf
wait_for_mon

mkdir -p "$MGR_DATA"
if [ ! -s "${MGR_DATA}/keyring" ]; then
  log "creating keyring for mgr.${MGR_ID}"
  ceph auth get-or-create "mgr.${MGR_ID}" \
    mon 'allow profile mgr' osd 'allow *' mds 'allow *' \
    -o "${MGR_DATA}/keyring"
fi
fix_perms "$MGR_DATA"

log "starting ceph-mgr id=${MGR_ID}"
exec ceph-mgr -f -i "$MGR_ID" --setuser ceph --setgroup ceph
