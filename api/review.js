const config = require('../review-config.json');
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 10000) throw new Error('Request too large'); }
  return raw ? JSON.parse(raw) : {};
}
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const end=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
  if(!['GET','POST','DELETE'].includes(req.method))return end(405,{error:'Method not allowed.'});
  if(!config.endpoint)return end(503,{error:'Reviews are being set up.'});
  const action=new URL(req.url,'https://bsd.local').searchParams.get('action');
  if(req.method!=='GET'){
    const origin=req.headers.origin;
    const allowed=['https://www.brandonstlewisdesign.shop','https://brandonstlewisdesign.shop','http://localhost:4173','http://127.0.0.1:4173'];
    if(origin&&!allowed.includes(origin)&&!(!process.env.VERCEL&&/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)))return end(403,{error:'Request not allowed.'});
  }
  try {
    const token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('bsd_review_session='))?.slice('bsd_review_session='.length)||'';
    const body=req.method==='GET'?undefined:JSON.stringify(await readJson(req));
    const response=await fetch(config.endpoint+(action?'?action='+encodeURIComponent(action):''),{method:req.method,headers:{'Content-Type':'application/json','x-bsd-session':token,'x-bsd-client':String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim()},body});
    const data=await response.json().catch(()=>({error:'Reviews are temporarily unavailable.'}));
    if(response.ok&&action==='login'&&data.token){
      res.setHeader('Set-Cookie',`bsd_review_session=${data.token}; Path=/api/review; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`);
      delete data.token;
    }
    if(action==='logout')res.setHeader('Set-Cookie','bsd_review_session=; Path=/api/review; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    end(response.status,data);
  } catch {end(503,{error:'Reviews are temporarily unavailable. Please try again.'});}
};
