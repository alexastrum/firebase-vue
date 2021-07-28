export function extractPathAndId(pathAndId, defaultPath) {
    const path = /^(.+)\/[^\/]*$/.exec(pathAndId)?.[1] || defaultPath || '';
    const id = pathAndId.replace(/^.+\//, '');
    if (typeof defaultPath === 'string' && defaultPath !== path) {
        throw new Error('Invalid collection path: ' + path);
    }
    return { path, id };
}
