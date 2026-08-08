const { sb } = require("./_lib");

module.exports = async function handler(req, res) {

  /* ==============================
     CORS
  ============================== */

  const origin = req.headers.origin || "";

  const allowedOrigins = [
    "https://wooriapt.ai.kr",
    "https://wooriapt.imweb.me"
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  /* ==============================
     OPTIONS 요청
  ============================== */

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }


  /* ==============================
     POST만 허용
  ============================== */

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "POST 요청만 가능합니다."
    });
  }


  try {

    const {
      company_name,
      site_name,
      charge_amount,
      charge_date,
      memo
    } = req.body || {};


    /* ==============================
       입력값 확인
    ============================== */

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({
        ok: false,
        message: "분양사명을 입력해 주세요."
      });
    }


    if (!site_name || !site_name.trim()) {
      return res.status(400).json({
        ok: false,
        message: "분양현장명을 입력해 주세요."
      });
    }


    const amount = Number(charge_amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        ok: false,
        message: "올바른 충전금액을 입력해 주세요."
      });
    }


    if (!charge_date) {
      return res.status(400).json({
        ok: false,
        message: "충전일자를 입력해 주세요."
      });
    }


    /* ==============================
       Supabase 저장
    ============================== */

    const { data, error } = await sb
      .from("ad_charge_history")
      .insert([
        {
          company_name: company_name.trim(),
          site_name: site_name.trim(),
          charge_amount: amount,
          charge_date: charge_date,
          memo: memo ? memo.trim() : null
        }
      ])
      .select()
      .single();


    if (error) {
      console.error(
        "ad_charge_history insert error:",
        error
      );

      return res.status(500).json({
        ok: false,
        message: "충전금 저장에 실패했습니다."
      });
    }


    /* ==============================
       성공
    ============================== */

    return res.status(200).json({
      ok: true,
      message: "충전금이 정상 등록되었습니다.",
      data: data
    });


  } catch (error) {

    console.error(
      "save-ad-charge error:",
      error
    );

    return res.status(500).json({
      ok: false,
      message: "서버 오류가 발생했습니다."
    });
  }
};
