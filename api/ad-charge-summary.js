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

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

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

    /* 총 충전금 */
    const { data: chargeRows, error: chargeError } = await sb
      .from("ad_charge_history")
      .select("charge_amount");

    if (chargeError) {
      throw chargeError;
    }

    const totalCharge = (chargeRows || []).reduce(
      function(sum, row) {
        return sum + Number(row.charge_amount || 0);
      },
      0
    );


    /* 사용내역 */
    const { data: usageRows, error: usageError } = await sb
      .from("ad_charge_usage")
      .select(
        "id, company_name, site_name, valid_views, unit_price, used_amount, balance_after, used_date, created_at"
      )
      .order("created_at", { ascending: false });

    if (usageError) {
      throw usageError;
    }


    /* 누적 사용금액 */
    const totalUsed = (usageRows || []).reduce(
      function(sum, row) {
        return sum + Number(row.used_amount || 0);
      },
      0
    );


    /* 현재 잔액 */
    const currentBalance =
      totalCharge - totalUsed;


    return res.status(200).json({
      ok: true,

      total_charge:
        totalCharge,

      total_used:
        totalUsed,

      current_balance:
        currentBalance,

      rows:
        usageRows || []
    });

  } catch (error) {

    console.error(
      "ad-charge-summary error:",
      error
    );

    return res.status(500).json({
      ok: false,
      message: "충전금 사용내역 조회에 실패했습니다."
    });
  }
};
