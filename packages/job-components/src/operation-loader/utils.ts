export interface ParseNameResponse {
    name: string;
    assetIdentifier?: string;
    tag?: string;
}

export function parseName(identifier: string): ParseNameResponse {
    let name = identifier;
    let assetIdentifier: string | undefined;
    let tag: string | undefined;

    if (identifier.includes('@')) {
        const results = identifier.split('@', 2);
        name = results[0];

        if (results[1].includes(':')) {
            const identifiers = results[1].split(':');

            if (identifiers.length === 3) {
                tag = identifiers.pop();
                assetIdentifier = identifiers.join(':');
            } else if (identifiers.length === 2) {
                const [firstID, secondID] = identifiers;

                if (isAssetHash(firstID)) {
                    assetIdentifier = firstID;
                    tag = secondID;
                } else {
                    // its a pre-hash name and version, which should be combined
                    assetIdentifier = `${firstID}:${secondID}`;
                }
            } else {
                throw new Error(`Invalid name for "${identifier}", it has to many ":" characters`);
            }
        } else {
            assetIdentifier = results[1];
        }
    } else {
        [name, tag] = identifier.split(':', 2);
    }

    return {
        name,
        assetIdentifier,
        tag
    };
}

function isAssetHash(id: string) {
    return id.length === 40;
}
