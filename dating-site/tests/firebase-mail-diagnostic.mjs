import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
const {apiKey,projectId}=JSON.parse(await readFile('dating-site/render/firebase.public.json','utf8'));
if(projectId!=='murdilimax'||!apiKey)throw new Error('Unexpected project');
const email='dshtriters+mm-mailtest-site-20261125@gmail.com';
const password=randomBytes(24).toString('hex')+'Aa1!';
const endpoint='https://identitytoolkit.googleapis.com/v1/';
async function call(action,body,label){
 const r=await fetch(endpoint+'accounts:'+action+'?key='+encodeURIComponent(apiKey),{method:'POST',headers:{'Content-Type':'application/json','Referer':'https://murdilimax.com/','Origin':'https://murdilimax.com','X-Firebase-Locale':'ru'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const j=await r.json();
 const reason=String(j.error?.message||'').split(' : ')[0].replace(/[^A-Z0-9_ .-]/g,'').slice(0,100);
 console.log(label+': HTTP '+r.status+(reason?' '+reason:''));
 return {ok:r.ok,j};
}
let token;
try{
 const signup=await call('signUp',{email,password,returnSecureToken:true},'temporary_auth_signup');
 if(!signup.ok)throw new Error('Temporary account could not be created');
 token=signup.j.idToken;
 await call('sendOobCode',{requestType:'VERIFY_EMAIL',idToken:token,continueUrl:'https://murdilimax.com/login?next=%2F'},'verification_site_settings');
 await call('sendOobCode',{requestType:'PASSWORD_RESET',email,continueUrl:'https://murdilimax.com/login?next=%2F'},'password_reset_site_settings');
}finally{
 if(token){const deleted=await call('delete',{idToken:token},'temporary_account_cleanup');if(!deleted.ok)throw new Error('Temporary test account cleanup failed');}
}
