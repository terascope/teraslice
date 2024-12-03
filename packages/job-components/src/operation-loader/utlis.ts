export function parseName(identifier: string) {
    let name = identifier;
    let assetHash: string | undefined;
    let tag: string | undefined;

    if (identifier.includes('@')) {
        const results = identifier.split('@', 2);
        name = results[0];

        if (results[1].includes(':')) {
            [assetHash, tag] = results[1].split(':', 2);
        } else {
            assetHash = results[1];
        }
    } else {
        [name, tag] = identifier.split(':', 2);
    }

    return {
        name,
        assetHash,
        tag
    };
}
