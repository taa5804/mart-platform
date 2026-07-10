const webpush=require('web-push');const {sb,validCode}=require('./_lib');
module.exports=async(req,res)=>{if(req.method!=='POST')return res.status(405).end();const {code,kind}=req.body||{};
if(!validCode(code)||!['move','emergency'].includes(kind))return res.status(400).json({error:'요청값이 올바르지 않습니다.'});
try{const rows=await sb(`vehicle_qr?code=eq.${encodeURIComponent(code)}&select=phone,push_subscription&limit=1`);const row=rows&&rows[0];if(!row||!row.phone)return res.status(404).json({error:'등록되지 않은 차량입니다.'});
await sb('call_requests',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({qr_code:code,request_type:kind,created_at:new Date().toISOString()})});
if(row.push_subscription&&process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY){webpush.setVapidDetails(process.env.VAPID_SUBJECT||'mailto:admin@example.com',process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
try{await webpush.sendNotification(row.push_subscription,JSON.stringify({title:kind==='emergency'?'긴급 차량 호출':'차량이동 요청',body:'주차된 차량의 이동 요청이 접수되었습니다.',url:'/'}))}catch(_){}}
res.json({ok:true})}catch(e){res.status(500).json({error:'요청 처리에 실패했습니다.'})}};