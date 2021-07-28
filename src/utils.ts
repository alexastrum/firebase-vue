export function extractPathAndId(pathAndId: string, defaultPath?: string) {
  const path = /^(.+)\/[^\/]*$/.exec(pathAndId)?.[1] || defaultPath || '';
  const id = pathAndId.replace(/^.+\//, '');
  if (typeof defaultPath === 'string' && defaultPath !== path) {
    throw new Error('Invalid collection path: ' + path);
  }
  return { path, id };
}
