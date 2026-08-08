const crypto = require("crypto");
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
     OPTIONS
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
      project_code
    } = req.body || {};


    /* ==============================
       현장 코드 확인
    ============================== */

    if (!project_code || !String(project_code).trim()) {
      return res.status(400).json({
        ok: false,
        message: "분양현장 코드가 필요합니다."
      });
    }

    const projectCode =
      String(project_code).trim().toUpperCase();


    /* ==============================
       1회용 쿠폰번호 생성
    ============================== */

    const randomCode =
      crypto.randomBytes(8).toString("hex").toUpperCase();

    const couponCode =
      "CP-" +
      randomCode.slice(0, 4) +
      "-" +
      randomCode.slice(4, 8) +
      "-" +
      randomCode.slice(8, 12) +
      "-" +
      randomCode.slice(12, 16);


    /* ==============================
       유효기간
       발행 후 7일
    ============================== */

    const expiresAt =
      new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();


    /* ==============================
       쿠폰 저장
    ============================== */

    const { data, error } = await sb
      .from("electronic_coupons")
      .insert([
        {
          coupon_code: couponCode,
          project_code: projectCode,
          expires_at: expiresAt,
          status: "issued"
        }
      ])
      .select()
      .single();


    if (error) {

      console.error(
        "electronic_coupons insert error:",
        error
      );

      return res.status(500).json({
        ok: false,
        message: "전자쿠폰 발행에 실패했습니다."
      });
    }


    /* ==============================
       성공
    ============================== */

    return res.status(200).json({
      ok: true,
      message: "전자쿠폰이 발행되었습니다.",
      coupon: {
        id: data.id,
        coupon_code: data.coupon_code,
        project_code: data.project_code,
        issued_at: data.issued_at,
        expires_at: data.expires_at,
        status: data.status
      }
    });


  } catch (error) {

    console.error(
      "create-electronic-coupon error:",
      error
    );

    return res.status(500).json({
      ok: false,
      message: "전자쿠폰 발행 중 서버 오류가 발생했습니다."
    });
  }
};
