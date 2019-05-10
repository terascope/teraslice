export function formatPath(...paths: (string | undefined)[]) {
    return paths.map(trimSlashes).join('/');
}

export function trimSlashes(str?: string) {
    let path = str;
    if (!path) return '';
    path = path.replace(/^\//, '');
    path = path.replace(/\/$/, '');
    return path;
}
