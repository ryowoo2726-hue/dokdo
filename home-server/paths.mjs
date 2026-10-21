import {join,resolve} from 'node:path';
import {homedir} from 'node:os';

export const dataDir=resolve(process.env.DOKDO_DATA_DIR||'C:/scr/dokdo');
// Connection credentials stay in their existing location; only student data moves.
export const tunnelDir=join(process.env.LOCALAPPDATA||homedir(),'MaseokDokdo','tunnel');
