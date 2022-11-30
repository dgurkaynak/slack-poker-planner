#!/usr/bin/env node

require('esbuild').build({
    entryPoints: ['./src/app.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18.12',
    external: ['aws-sdk', 'mock-aws-s3', 'nock', 're2', 'sqlite3'],
    outfile: './dist/app.js',
  }).catch(() => process.exit(1))