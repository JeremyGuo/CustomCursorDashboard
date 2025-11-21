import path from 'node:path';

const rootDir = path.resolve(__dirname, '..', '..');

export const resolveFromRoot = (...segments: string[]) => path.join(rootDir, ...segments);

export const DATA_DIR = resolveFromRoot('data');
export const SERVICES_DIR = resolveFromRoot('services');
export const DIST_DIR = resolveFromRoot('dist');
