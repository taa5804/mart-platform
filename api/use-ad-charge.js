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

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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
      valid_views,
      unit_price
    } = req.body || {};

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({
        ok: false,
        message: "분양사명이 필요합니다."
      });
    }

    if (!site_name || !site_name.trim()) {
      return res.status(400).json({
        ok: false,
        message: "분양현장명이 필요합니다."
      });
    }

    const views = Number(valid_views || 1);
    const price = Number(unit_price || 0);

    if (!Number.isInteger(views) || views <= 0) {
      return res.status(400).json({
        ok: false,
        message: "유효조회 수가 올바르지 않습니다."
      });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        ok: false,
        message: "건당 차감액이 올바르지 않습니다."
      });
    }

    const usedAmount = views * price;

    /* 총 충전금 조회 */
    const { data: chargeRows, error: chargeError } = await sb
      .from("ad_charge_history")
      .select("charge_amount")
      .eq("company_name", company_name.trim())
      .eq("site_name", site_name.trim());

    if (chargeError) {
      console.error(chargeError);

      return res.status(500).json({
        ok: false,
        message: "충전금 조회에 실패했습니다."
      });
    }

    const totalCharge = (chargeRows || []).reduce(
      (sum, row) => sum + Number(row.charge_amount || 0),
      0
    );

    /* 누적 사용금액 조회 */
    const { data: usageRows, error: usageError } = await sb
      .from("ad_charge_usage")
      .select("used_amount")
      .eq("company_name", company_name.trim())
      .eq("site_name", site_name.trim());

    if (usageError) {
      console.error(usageError);

      return res.status(500).json({
        ok: false,
        message: "사용금액 조회에 실패했습니다."
      });
    }

    const totalUsed = (usageRows || []).reduce(
      (sum, row) => sum + Number(row.used_amount || 0),
      0
    );

    const currentBalance = totalCharge - totalUsed;

    if (currentBalance < usedAmount) {
      return res.status(400).json({
        ok: false,
        message: "충전금 잔액이 부족합니다.",
        current_balance: currentBalance
      });
    }

    const balanceAfter = currentBalance - usedAmount;

    /* 사용내역 저장 */
    const { data, error } = await sb
      .from("ad_charge_usage")
      .insert([
        {
          company_name: company_name.trim(),
          site_name: site_name.trim(),
          valid_views: views,
          unit_price: price,
          used_amount: usedAmount,
          balance_after: balanceAfter
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(error);

      return res.status(500).json({
        ok: false,
        message: "충전금 차감 저장에 실패했습니다."
      });
    }

    return res.status(200).json({
      ok: true,
      used_amount: usedAmount,
      balance_after: balanceAfter,
      data
    });

  } catch (error) {
    console.error("use-ad-charge error:", error);

    return res.status(500).json({
      ok: false,
      message: "서버 오류가 발생했습니다."
    });
  }
};
