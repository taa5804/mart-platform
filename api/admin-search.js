const {sb,validCode,maskPhone,envReady}=require('./_lib');
module.exports=async(req,res)=>{if(req.headers['x-admin-password']!==(process.env.ADMIN_PASSWORD||''))return res.status(401).json({error:'인증 실패'});
const code=String(req.query.code||'');if(!validCode(code))return res.status(404).json({error:'발급목록에 없는 QR번호입니다.'});
if(!envReady())return res.json({code,valid:true,registered:false,maskedPhone:null,setupRequired:true});
try{const rows=await sb(`vehicle_qr?code=eq.${encodeURIComponent(code)}&select=code,phone,active&limit=1`);const row=rows&&rows[0];res.json({code,valid:true,registered:!!(row&&row.phone),maskedPhone:maskPhone(row&&row.phone),active:row?row.active:false})}
catch(e){res.status(500).json({error:'검색 실패'})}};