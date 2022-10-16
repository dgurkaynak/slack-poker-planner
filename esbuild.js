#!/usr/bin/env node

require('esbuild').build({
    entryPoints: ['./src/app.ts'],
    bundle: true,
    platform: 'node',
    target: 'node16.18',
    external: ['aws-sdk', 'mock-aws-s3', 'nock', 're2'],
    outfile: './dist/app.js',
  }).catch(() => process.exit(1))