const { sb } = require("./_lib");

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,X-Admin-Key"
  );
}

module.exports = async function (req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "POST 요청만 가능합니다."
    });
  }

  try {
    const adminKey = process.env.SALE_ADMIN_KEY;
    const requestKey = req.headers["x-admin-key"];

    if (!adminKey) {
      return res.status(500).json({
        ok: false,
        message: "SALE_ADMIN_KEY 환경변수가 없습니다."
      });
    }

    if (!requestKey || requestKey !== adminKey) {
      return res.status(401).json({
        ok: false,
        message: "관리자 인증에 실패했습니다."
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const projectCode = String(
      body.project_code || ""
    ).trim();

    const projectName = String(
      body.project_name || ""
    ).trim();

    if (!projectCode) {
      return res.status(400).json({
        ok: false,
        message: "분양현장 코드가 필요합니다."
      });
    }

    if (!/^[A-Z0-9_-]{3,40}$/.test(projectCode)) {
      return res.status(400).json({
        ok: false,
        message: "분양현장 코드 형식이 올바르지 않습니다."
      });
    }

    if (!projectName) {
      return res.status(400).json({
        ok: false,
        message: "단지명을 입력해 주세요."
      });
    }

    const saveData = {
      project_code: projectCode,
      project_name: projectName,
      sale_status: body.sale_status || "분양 예정",
      area: body.area || "",
      move_in_date: body.move_in_date || "",
      contact_phone: body.contact_phone || "",
      modelhouse_address: body.modelhouse_address || "",
      catalog_data: body.catalog_data || {},
      is_active: body.is_active !== false,
      updated_at: new Date().toISOString()
    };

    const result = await sb(
      "sale_projects?on_conflict=project_code",
      {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation"
        },
        body: JSON.stringify(saveData)
      }
    );

    return res.status(200).json({
      ok: true,
      message: "분양정보가 저장되었습니다.",
      project: Array.isArray(result) ? result[0] : result
    });
  } catch (error) {
    console.error("sale-save error:", error);

    return res.status(500).json({
      ok: false,
      message: "분양정보 저장에 실패했습니다.",
      error: error.message
    });
  }
};
