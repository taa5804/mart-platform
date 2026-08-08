const { sb } = require("./_lib");

module.exports = async function handler(req, res) {

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
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      message: "GET 요청만 가능합니다."
    });
  }

  try {

    const couponCode =
      String(req.query.coupon_code || "")
        .trim()
        .toUpperCase();

    if (!couponCode) {
      return res.status(400).json({
        ok: false,
        message: "쿠폰번호가 필요합니다."
      });
    }

    const { data, error } = await sb
      .from("electronic_coupons")
      .select("*")
      .eq("coupon_code", couponCode)
      .maybeSingle();

    if (error) {
      console.error(
        "electronic_coupons select error:",
        error
      );

      return res.status(500).json({
        ok: false,
        message: "전자쿠폰 조회에 실패했습니다."
      });
    }

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "존재하지 않는 전자쿠폰입니다."
      });
    }

    let status = data.status;

    if (
      status === "issued" &&
      data.expires_at &&
      new Date(data.expires_at).getTime() < Date.now()
    ) {
      status = "expired";
    }

    return res.status(200).json({
      ok: true,
      coupon: {
        id: data.id,
        coupon_code: data.coupon_code,
        project_code: data.project_code,
        issued_at: data.issued_at,
        expires_at: data.expires_at,
        status: status,
        used_at: data.used_at
      }
    });

  } catch (error) {

    console.error(
      "get-electronic-coupon error:",
      error
    );

    return res.status(500).json({
      ok: false,
      message: "전자쿠폰 조회 중 서버 오류가 발생했습니다."
    });
  }
};
