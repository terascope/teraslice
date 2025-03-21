export type SyncOptions = {
    verify: boolean;
    quiet?: boolean;
    isAsset?: boolean;
};

export enum DepKey {
    Deps = 'dependencies',
    Dev = 'devDependencies',
    Peer = 'peerDependencies',
    Resolutions = 'resolutions',
}
