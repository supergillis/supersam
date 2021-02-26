import TsconfigPathsPlugin from '@esbuild-plugins/tsconfig-paths';
import { build } from 'esbuild';

build({
  platform: 'node',
  target: 'node12',
  outdir: 'dist',
  bundle: true,
  minify: true,
  entryPoints: ['src/sam-cdk.ts'],
  plugins: [TsconfigPathsPlugin({})],
});
