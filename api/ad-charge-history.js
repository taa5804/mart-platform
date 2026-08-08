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

    const siteName =
      typeof req.query.site_name === "string"
        ? req.query.site_name.trim()
        : "";

    let query = sb
      .from("ad_charge_history")
      .select(
        "id, company_name, site_name, charge_amount, charge_date, memo, created_at"
      )
      .order("charge_date", { ascending: false })
      .order("id", { ascending: false });

    if (siteName) {
      query = query.eq("site_name", siteName);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        "ad_charge_history select error:",
        error
      );

      return res.status(500).json({
        ok: false,
        message: "충전금 내역 조회에 실패했습니다."
      });
    }

    const rows = Array.isArray(data) ? data : [];

    const totalCharge = rows.reduce(
      function(sum, row) {
        return sum + Number(row.charge_amount || 0);
      },
      0
    );

    return res.status(200).json({
      ok: true,
      total_charge: totalCharge,
      rows: rows
    });

  } catch (error) {

    console.error(
      "ad-charge-history error:",
      error
    );

    return res.status(500).json({
      ok: false,
      message: "서버 오류가 발생했습니다."
    });
  }
};
