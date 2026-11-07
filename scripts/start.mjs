import {cpSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
// Next standalone output needs its public and generated static files alongside it.
mkdirSync('.next/standalone/.next',{recursive:true});
cpSync('public','.next/standalone/public',{recursive:true});
cpSync('.next/static','.next/standalone/.next/static',{recursive:true});
process.env.HOSTNAME=process.env.APP_HOST||'0.0.0.0';
await import(pathToFileURL(resolve('.next/standalone/server.js')).href);
