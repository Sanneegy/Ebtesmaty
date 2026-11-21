const fs=require('fs');
let p='src/app/layout.tsx',s=fs.readFileSync(p,'utf8');s="import {PresentationAccess} from '@/components/PresentationAccess';\nimport {presentationEnabled} from '@/lib/presentation';\n"+s;s=s.replace('<Footer />','<Footer />\n          {presentationEnabled() && <PresentationAccess />}');fs.writeFileSync(p,s);
p='src/app/auth/login/page.tsx';s=fs.readFileSync(p,'utf8');const start=s.indexOf("        {process.env.NODE_ENV===");const end=s.indexOf('        <div className="mt-6 text-center',start);s=s.slice(0,start)+s.slice(end);fs.writeFileSync(p,s);
p='.env.local';s=fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';s=s.replace(/^ENABLE_DEMO_LOGIN=.*\r?$/gm,'');fs.writeFileSync(p,s+'\nENABLE_DEMO_LOGIN=true\n');
