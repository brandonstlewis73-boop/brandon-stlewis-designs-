const base = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
async function rpc(name:string,args:unknown={}) { const r=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(args)});const data=await r.json().catch(()=>null);return {ok:r.ok,data}; }
function response(status:number,data:unknown){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
Deno.serve(async req=>{
 try{
 const action=new URL(req.url).searchParams.get('action');
 const token=req.headers.get('x-bsd-session')||'';
 const ip=req.headers.get('x-bsd-client')||req.headers.get('x-forwarded-for')||'unknown';
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));const client_hash=Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(req.method==='GET'&&action==='owner'){const r=await rpc('bsd_review_owner',{session_token:token});return response(r.ok&&r.data===true?200:401,{owner:r.ok&&r.data===true});}
 if(req.method==='GET'){const r=await rpc('bsd_reviews_list');return response(r.ok?200:503,r.ok?{reviews:r.data}:{error:'Reviews could not be loaded.'});}
 const raw=await req.text();if(raw.length>10000)return response(413,{error:'Request too large.'});const body=raw?JSON.parse(raw):{};
 if(req.method==='POST'&&action==='login'){if(typeof body.password!=='string'||body.password.length>200||typeof body.email!=='string')return response(400,{error:'Enter your owner email and password.'});const r=await rpc('bsd_review_login',{owner_email:body.email,owner_password:body.password,client_hash});return response(r.ok&&r.data?200:401,r.ok&&r.data?{ok:true,token:r.data}:{error:'Sign-in failed. Check your details or try again in 15 minutes.'});}
 if(req.method==='POST'&&action==='logout'){await rpc('bsd_review_logout',{session_token:token});return response(200,{ok:true});}
 if(req.method==='DELETE'){const owner=await rpc('bsd_review_owner',{session_token:token});if(!owner.ok||!owner.data)return response(401,{error:'Please sign in as owner.'});if(!/^[0-9a-f-]{36}$/i.test(body.id||''))return response(400,{error:'Invalid review.'});const r=await rpc('bsd_review_delete',{review_id:body.id,session_token:token});return response(r.ok?200:500,r.ok?{ok:true}:{error:'Could not delete review.'});}
 if(req.method!=='POST')return response(405,{error:'Method not allowed.'});
 if(body.website_url)return response(400,{error:'Submission blocked.'});
 const r=await rpc('bsd_review_submit',{reviewer_name:body.reviewer_name,business_name:body.business_name,reviewer_email:body.reviewer_email,stars:Number.parseInt(body.rating,10),review_text:body.review,client_hash});
 return response(r.ok?201:r.data?.code==='P0001'?429:400,r.ok?{ok:true}:{error:r.data?.code==='P0001'?'Please wait before submitting another review.':'Enter your name, business, email, a rating from 1 to 5, and a review of 10–1800 characters.'});
 }catch{return response(500,{error:'Request failed. Please try again.'});}
});
