export type SyncOptions = {
    verify: boolean;
};

export enum DepKey {
    Deps = 'dependencies',
    Dev = 'devDependencies',
    Peer = 'peerDependencies',
    Resolutions = 'resolutions',
}
