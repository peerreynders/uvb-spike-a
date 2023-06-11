import { defineConfig } from 'vite';
import { transform} from 'esbuild';

import type { NormalizedOutputOptions, RenderedChunk } from 'rollup';
import type { PluginOption } from 'vite';

function minifyEs() {
  return {
    name: 'minifyEs',
    renderChunk: {
      order: 'post',
      async handler(code: string, chunk: RenderedChunk, outputOptions: NormalizedOutputOptions) {
        if (outputOptions.format === 'es' && chunk.fileName.endsWith('.mjs')) {
          return await transform(code, { minify: true });
        }
        return code;
      },
    }
  };
}

export default defineConfig({
	root: './',
	plugins: [minifyEs() as PluginOption],
	build: {
		lib: {
			entry: {
				'uvub': 'src/index.js',
				'assert': 'assert/src/index.js',
				'report': 'report/src/index.js'
			},
      formats:['es'],
			fileName(_format, entryName) {
				switch(entryName) {
					case 'uvub':
						return 'uvub.mjs'
					case 'assert':
						return 'assert.mjs'
					case 'report':
						return 'report.mjs'
				}
				throw new Error('Unknown entryName');
			}
		},
		rollupOptions: {
			external: ['diff','dequal'],
		}
	}
});
