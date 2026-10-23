import {fileURLToPath} from 'node:url';
try { process.loadEnvFile(fileURLToPath(new URL('../.env.local', import.meta.url))); } catch (error) { if (error.code !== 'ENOENT') throw error; }

