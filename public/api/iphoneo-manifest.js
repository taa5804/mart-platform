export function GET(request) {
  const url = new URL(request.url);

  const registrationKey = String(
    url.searchParams.get("reg") || ""
  )
    .trim()
    .toLowerCase();

  /*
   * 등록키는 서버에서 만든 UUID만 허용합니다.
   * 잘못된 값이 들어오면 일반 우리가게 시작 주소를 사용합니다.
   */
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

  return new Response(
    JSON.stringify(manifest),
    {
      status: 200,
      headers: {
        "Content-Type":
          "application/manifest+json; charset=utf-8",

        "Cache-Control":
          "no-store, no-cache, must-revalidate, max-age=0",

        "Pragma": "no-cache",
        "Expires": "0"
      }
    }
  );
}
