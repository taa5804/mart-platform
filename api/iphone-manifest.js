module.exports = async (req, res) => {

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      message: "GET 요청만 사용할 수 있습니다."
    });
  }


  /*
   * ==========================================
   * 자동차 QR용 registration key
   * 기존 방식 그대로 유지
   * ==========================================
   */

  const registrationKey = String(
    req.query.reg || ""
  )
    .trim()
    .toLowerCase();


  const validRegistrationKey =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(registrationKey);



  /*
   * ==========================================
   * 입간판 QR용 정보
   * ==========================================
   */

  const qrCode = String(
    req.query.qr || ""
  )
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9_-]/g,
      ""
    );


  const pathDigits = String(
    req.query.path || ""
  )
    .replace(
      /[^0-9]/g,
      ""
    );


  const storePath =
    pathDigits
      ? String(Number(pathDigits))
      : "74";


  /*
   * ==========================================
   * 시작 URL 결정
   *
   * 1. reg 있음 → 자동차
   * 2. qr 있음  → 입간판
   * 3. 둘 다 없음 → 기존 자동차 기본화면
   * ==========================================
   */

  let startUrl =
    "/72-iphone.html";


  if (validRegistrationKey) {

    /*
     * 자동차 QR
     * 기존 로직 그대로
     */

    startUrl =
      "/72-iphone.html?reg=" +
      encodeURIComponent(
        registrationKey
      );

  } else if (qrCode) {

    /*
     * 입간판 QR
     * 전화번호 등록 없이
     * mart-open.html로 QR 정보 전달
     */

    startUrl =
      "/mart-open.html" +
      "?qr=" +
      encodeURIComponent(
        qrCode
      ) +
      "&path=" +
      encodeURIComponent(
        storePath
      ) +
      "&source=signboard";

  }


  /*
   * ==========================================
   * Manifest
   * ==========================================
   */

  const manifest = {

    id: "/woorigage-app",

    name: "우리가게",

    short_name: "우리가게",

    description:
      "마트 행사와 차량이동 알림 앱",

    start_url:
      startUrl,

    scope: "/",

    display:
      "standalone",

    background_color:
      "#ffffff",

    theme_color:
      "#16a34a",

    orientation:
      "portrait",

    lang:
      "ko-KR",

    icons: [

      {
        src:
          "/icon-192.png",

        sizes:
          "192x192",

        type:
          "image/png",

        purpose:
          "any maskable"
      },

      {
        src:
          "/icon-512.png",

        sizes:
          "512x512",

        type:
          "image/png",

        purpose:
          "any maskable"
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


  res.setHeader(
    "Pragma",
    "no-cache"
  );


  res.setHeader(
    "Expires",
    "0"
  );


  return res
    .status(200)
    .json(manifest);

};
