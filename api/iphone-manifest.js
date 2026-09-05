module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      message: "GET 요청만 사용할 수 있습니다."
    });
  }

  const registrationKey = String(
    req.query.reg || ""
  )
    .trim()
    .toLowerCase();

  const validRegistrationKey =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(registrationKey);

  const startUrl = validRegistrationKey
    ? `/mart-open.html?reg=${encodeURIComponent(registrationKey)}`
    : "/mart-open.html";

  const manifest = {
    id: "/woorigage-app",
    name: "우리가게",
    short_name: "우리가게",
    description: "마트 행사와 차량이동 알림 앱",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    orientation: "portrait",
    lang: "ko-KR",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };

  res.setHeader(
    "Content-Type",
    "application/manifest+json; charset=utf-8"
  );

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );

  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  return res.status(200).send(
    JSON.stringify(manifest)
  );
};
