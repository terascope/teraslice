export function formatPath(basepath?: string, path?: string) {
    return `${trimSlashes(basepath)}/${trimSlashes(path)}`;
}

export function trimSlashes(str?: string) {
    let path = str;
    if (!path) return '';
    path = path.replace(/^\//, '');
    path = path.replace(/\/$/, '');
    return path;
}
