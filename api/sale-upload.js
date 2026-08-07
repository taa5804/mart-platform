const { envReady } = require("./_lib");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "sale-images";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,X-Admin-Key"
  );
}

function safePart(value) {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
    if (!envReady()) {
      return res.status(500).json({
        ok: false,
        message: "Supabase 환경변수가 설정되지 않았습니다."
      });
    }

    const adminKey = process.env.SALE_ADMIN_KEY;
    const requestKey = req.headers["x-admin-key"];

    if (!adminKey || requestKey !== adminKey) {
      return res.status(401).json({
        ok: false,
        message: "관리자 인증에 실패했습니다."
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    const projectCode = safePart(body.project_code);
    const imageKey = safePart(body.image_key);
    const fileName = safePart(body.file_name);
    const mimeType = String(body.mime_type || "").trim();
    const base64 = String(body.base64 || "");

    if (!projectCode) {
      return res.status(400).json({
        ok: false,
        message: "분양현장 코드가 필요합니다."
      });
    }

    if (!imageKey) {
      return res.status(400).json({
        ok: false,
        message: "이미지 구분값이 필요합니다."
      });
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return res.status(400).json({
        ok: false,
        message: "JPG, PNG, WEBP 이미지만 업로드할 수 있습니다."
      });
    }

    const match = base64.match(
      /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/
    );

    if (!match) {
      return res.status(400).json({
        ok: false,
        message: "이미지 데이터 형식이 올바르지 않습니다."
      });
    }

    const buffer = Buffer.from(match[2], "base64");

    if (!buffer.length) {
      return res.status(400).json({
        ok: false,
        message: "빈 이미지입니다."
      });
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({
        ok: false,
        message: "이미지는 10MB 이하만 업로드할 수 있습니다."
      });
    }

    const extension =
      mimeType === "image/png"
        ? "png"
        : mimeType === "image/webp"
        ? "webp"
        : "jpg";

    const finalName =
      fileName || imageKey + "-" + Date.now();

    const objectPath =
      projectCode +
      "/" +
      imageKey +
      "/" +
      finalName +
      "." +
      extension;

    const uploadUrl =
      SUPABASE_URL +
      "/storage/v1/object/" +
      BUCKET +
      "/" +
      objectPath;

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: "Bearer " + SERVICE_KEY,
        "Content-Type": mimeType,
        "x-upsert": "true"
      },
      body: buffer
    });

    const uploadText = await uploadResponse.text();

    if (!uploadResponse.ok) {
      throw new Error(
        uploadText || "Supabase 이미지 업로드에 실패했습니다."
      );
    }

    const publicUrl =
      SUPABASE_URL +
      "/storage/v1/object/public/" +
      BUCKET +
      "/" +
      objectPath;

    return res.status(200).json({
      ok: true,
      message: "이미지가 업로드되었습니다.",
      path: objectPath,
      url: publicUrl
    });
  } catch (error) {
    console.error("sale-upload error:", error);

    return res.status(500).json({
      ok: false,
      message: "이미지 업로드에 실패했습니다.",
      error: error.message
    });
  }
};
