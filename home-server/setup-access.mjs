// Uses the existing Cloudflare login certificate; never prints its API token.
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';

const email=process.argv[2];
if(!email||!/^\S+@\S+\.\S+$/.test(email))throw Error('Usage: node home-server/setup-access.mjs owner@example.com');
const pem=readFileSync(join(homedir(),'.cloudflared','cert.pem'),'utf8');
const certificate=JSON.parse(Buffer.from(pem.replace(/-----[^\n]+-----/g,'').replace(/\s/g,''),'base64').toString('utf8'));
const base=`https://api.cloudflare.com/client/v4/accounts/${certificate.accountID}`;
async function api(path,method='GET',body){
 const response=await fetch(base+path,{method,headers:{Authorization:`Bearer ${certificate.apiToken}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(!data.success)throw Error(`${method} ${path}: ${JSON.stringify(data.errors)}`);
 return data.result;
}
try{
 try{await api('/access/organizations');}catch(error){
  if(!error.message.includes('not_enabled')&&!error.message.includes('does not exist'))throw error;
  await api('/access/organizations','POST',{name:'Dokdo Quiz Management',auth_domain:'sangsangbar-dokdo.cloudflareaccess.com',session_duration:'8h'});
 }
 const providers=await api('/access/identity_providers');
 let otp=providers.find(item=>item.type==='onetimepin');
 if(!otp)otp=await api('/access/identity_providers','POST',{name:'Email login code',type:'onetimepin',config:{}});
 const apps=await api('/access/apps');
 let app=apps.find(item=>item.domain==='dokdo-admin.sangsangbar.com');
 if(!app)app=await api('/access/apps','POST',{name:'Dokdo Quiz Server Management',domain:'dokdo-admin.sangsangbar.com',type:'self_hosted',session_duration:'8h',allowed_idps:[otp.id],auto_redirect_to_identity:true});
 const policies=await api(`/access/apps/${app.id}/policies`);
 const desired={name:'Only quiz owner',decision:'allow',precedence:1,include:[{email:{email}}],exclude:[],require:[]};
 if(policies.length===0)await api(`/access/apps/${app.id}/policies`,'POST',desired);
 else if(policies.length!==1||JSON.stringify(policies[0].include)!==JSON.stringify(desired.include)||policies[0].decision!=='allow')throw Error('Existing access policies differ. Review them in Cloudflare; no policies were overwritten.');
 console.log(`Access configured: https://dokdo-admin.sangsangbar.com/ (allowed: ${email})`);
 console.log(`Authentication domain: ${(await api('/access/organizations')).auth_domain}`);
}catch(error){console.error(error.message);process.exitCode=1;}
