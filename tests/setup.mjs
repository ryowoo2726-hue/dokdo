import {fileURLToPath} from 'node:url';

// Tests and their child servers use fictional students, never the local roster.
process.env.DOKDO_ROSTER_FILE=fileURLToPath(new URL('./fixtures/students.csv',import.meta.url));
