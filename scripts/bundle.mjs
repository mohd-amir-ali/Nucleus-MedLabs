import {build} from 'esbuild';
import {mkdir} from 'node:fs/promises';
await mkdir('vendor', {recursive:true});
await build({entryPoints:['native/pdf_vendor.js'],outfile:'vendor/pdf_vendor.js',bundle:true,format:'iife',target:'es2020',minify:true,charset:'ascii',legalComments:'external'});
if(process.argv.includes('--android')) {
  await mkdir('dist/scripts', {recursive:true});
  await build({entryPoints:['native/bridge.js'],outfile:'dist/scripts/native_bridge.js',bundle:true,format:'iife',target:'es2020',minify:true,charset:'ascii',legalComments:'external'});
}
