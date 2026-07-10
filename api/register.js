const {sb,validCode}=require('./_lib');
module.exports=async(req,res)=>{if(req.method!=='POST')return res.status(405).end();const {code,phone,subscription}=req.body||{};
if(!validCode(code)||!/^01[016789]\d{7,8}$/.test(phone||''))return res.status(400).json({error:'입력값이 올바르지 않습니다.'});
try{await sb('vehicle_qr?on_conflict=code',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({code,phone,push_subscription:subscription||null,active:true,registered_at:new Date().toISOString()})});res.json({ok:true})}
catch(e){res.status(500).json({error:'등록 처리에 실패했습니다.'})}};