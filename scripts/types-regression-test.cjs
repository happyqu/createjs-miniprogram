const {execFileSync} = require('node:child_process');
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  '--noEmit','--strict','--module','nodenext','--moduleResolution','nodenext',
  '--target','es2020','scripts/types-regression-test.mts','scripts/types-commonjs-test.cts'], {stdio:'inherit'});
console.log('TypeScript package entry and addon checks passed');
