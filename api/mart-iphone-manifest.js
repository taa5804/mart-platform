module.exports = async (
  req,
  res
) => {
  if (
    req.method !== "GET"
  ) {
    return res
      .status(405)
      .json({
        ok:false,

        message:
          "GET 요청만 사용할 수 있습니다."
      });
  }


  const qrCode =
    String(
      req.query.qr || ""
    )
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9_-]/g,
        ""
      );


  /*
   * 입간판 QR 형식
   * 예: GJ-BK-SQ001-M01-001
   */

  const validSignQr =
    /^[A-Z]{2}-[A-Z]{2}-SQ[0-9]{3}-M[0-9]{2}-[0-9]{3}$/
      .test(qrCode);


  /*
   * 설치된 입간판 아이폰 앱
   * 첫 실행 주소
   */

  const startUrl =
    validSignQr
      ? "/mart-install-iphone.html" +
        "?qr=" +
        encodeURIComponent(
          qrCode
        )
      : "/mart-open.html";


  const manifest = {
    id:
      "/mart-sign-app-v1",

    name:
      "우리가게",

    short_name:
      "우리가게",

    description:
      "마트 행사와 할인 알림",

    start_url:
      startUrl,

    scope:
      "/",

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

    icons:[
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
    .send(
      JSON.stringify(
        manifest
      )
    );
};
