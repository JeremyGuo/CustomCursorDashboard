import path from 'node:path';
import fs from 'node:fs/promises';
import fg from 'fast-glob';
import { build } from 'esbuild';

const projectRoot = path.resolve(__dirname, '..');

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function run() {
  const entryGlobs = await fg('services/*/frontend/main.tsx', {
    cwd: projectRoot,
    absolute: true,
  });
  if (!entryGlobs.length) {
    console.warn('未找到任何服务前端入口 (services/*/frontend/main.tsx)');
    return;
  }
  for (const entry of entryGlobs) {
    const serviceDir = path.dirname(path.dirname(entry));
    const serviceName = path.basename(serviceDir);
    const outDir = path.join(serviceDir, 'dist');
    await ensureDir(outDir);
    console.log(`[build-services] 正在构建 ${serviceName}`);
    await build({
      entryPoints: [entry],
      outfile: path.join(outDir, 'main.js'),
      bundle: true,
      minify: false,
      sourcemap: true,
      format: 'esm',
      target: ['es2022'],
      jsx: 'automatic',
      platform: 'browser',
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
      },
    });
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
