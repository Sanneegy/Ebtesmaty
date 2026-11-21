const fs=require('fs'),path=require('path'),{spawn,spawnSync}=require('child_process');
process.chdir(path.resolve(__dirname,'..'));
const address='http://localhost:3000';
async function healthy(){try{const r=await fetch(address+'/auth/login',{signal:AbortSignal.timeout(4000)});return r.ok}catch{return false}}
(async()=>{
 if(await healthy()){console.log('Ebtesamty is ready: '+address);return;}
 const database=spawnSync(process.execPath,['scripts/db-start.js'],{stdio:'inherit',windowsHide:true});
 if(database.status!==0)throw Error('Database could not start. No records were changed.');
 if(!fs.existsSync('.next/BUILD_ID'))throw Error('Website build missing. Run npm run build, then start again.');
 fs.mkdirSync('work',{recursive:true});
 const output=fs.openSync('work/website-start.log','a'),errors=fs.openSync('work/website-start-error.log','a');
 const child=spawn(process.execPath,['scripts/presentation.cjs','start'],{cwd:process.cwd(),detached:true,windowsHide:true,stdio:['ignore',output,errors]});
 child.unref();fs.closeSync(output);fs.closeSync(errors);
 for(let attempt=0;attempt<30;attempt++){if(await healthy()){console.log('Ebtesamty is ready: '+address);return}await new Promise(resolve=>setTimeout(resolve,1000));}
 throw Error('Website did not become ready. See work/website-start-error.log.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
