const {
  sb,
  validCode
} = require("./_lib");


function validRegistrationKey(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(
      String(value || "").trim()
    );
}


module.exports = async (req, res) => {

  /*
   * ==========================================
   * iPhone 등록정보 조회
   * 기존 iphone-registration.js 기능 통합
   * ==========================================
   */
  if (req.method === "GET") {

    try {

      const registrationKey =
        String(
          req.query.reg || ""
        )
          .trim()
          .toLowerCase();

      if (
        !validRegistrationKey(
          registrationKey
        )
      ) {
        return res.status(400).json({
          ok: false,
          message:
            "등록키가 올바르지 않습니다."
        });
      }


      const rows =
        await sb(
          "pending_app_registrations" +
          "?registration_key=eq." +
          encodeURIComponent(
            registrationKey
          ) +
          "&select=registration_key,qr_code,phone,store_code,store_url,created_at" +
          "&limit=1",
          {
            method: "GET"
          }
        );


      if (
        !Array.isArray(rows) ||
        rows.length === 0
      ) {
        return res.status(404).json({
          ok: false,
          message:
            "등록정보를 찾을 수 없습니다."
        });
      }


      const row =
        rows[0];


      return res.status(200).json({
        ok: true,

        registration_key:
          row.registration_key,

        qr_code:
          row.qr_code,

        phone:
          row.phone,

        store_code:
          row.store_code || "",

        store_url:
          row.store_url || ""
      });


    } catch (error) {

      console.error(
        "registration lookup error:",
        error
      );


      return res.status(500).json({
        ok: false,
        message:
          "아이폰 등록정보 확인에 실패했습니다."
      });
    }
  }


  /*
   * ==========================================
   * 기존 자동차 QR 등록
   * 기존 register.js 기능 그대로 유지
   * ==========================================
   */
  if (req.method === "POST") {

    const {
      code,
      phone,
      subscription
    } = req.body || {};


    if (
      !validCode(code) ||
      !/^01[016789]\d{7,8}$/
        .test(phone || "")
    ) {
      return res.status(400).json({
        error:
          "입력값이 올바르지 않습니다."
      });
    }


    try {

      await sb(
        "vehicle_qr?on_conflict=code",
        {
          method: "POST",

          headers: {
            Prefer:
              "resolution=merge-duplicates,return=minimal"
          },

          body:
            JSON.stringify({
              code,
              phone,
              push_subscription:
                subscription || null,
              active: true,
              registered_at:
                new Date()
                  .toISOString()
            })
        }
      );


      return res.json({
        ok: true
      });


    } catch (error) {

      console.error(
        "vehicle register error:",
        error
      );


      return res.status(500).json({
        error:
          "등록 처리에 실패했습니다."
      });
    }
  }


  return res.status(405).json({
    ok: false,
    message:
      "GET 또는 POST 요청만 사용할 수 있습니다."
  });
};
