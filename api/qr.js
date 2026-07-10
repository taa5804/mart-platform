const {sb,validCode,envReady}=require('./_lib');
module.exports=async(req,res)=>{const code=String(req.query.code||'');if(!validCode(code))return res.status(404).json({valid:false});
if(!envReady())return res.status(200).json({valid:true,registered:false,setupRequired:true});
try{const rows=await sb(`vehicle_qr?code=eq.${encodeURIComponent(code)}&select=code,phone&limit=1`);res.json({valid:true,registered:!!(rows&&rows[0]&&rows[0].phone)})}catch(e){res.status(500).json({error:'DB 조회 오류'})}};