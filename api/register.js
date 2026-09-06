const crypto =
  require("crypto");

const {
  sb,
  validCode
} = require("./_lib");


function validRegistrationKey(
  value
){

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .test(
      String(
        value || ""
      ).trim()
    );
}


function normalizePhone(
  value
){

  return String(
    value || ""
  ).replace(
    /[^0-9]/g,
    ""
  );
}


module.exports =
  async function (
    req,
    res
  ){

    /*
     * 설치된 아이폰 앱에서
     * 등록정보 복원
     */

    if(
      req.method === "GET"
    ){

      try{

        const registrationKey =
          String(
            req.query.reg || ""
          )
            .trim()
            .toLowerCase();

        if(
          !validRegistrationKey(
            registrationKey
          )
        ){

          return res
            .status(400)
            .json({
              ok:
                false,

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
            "&select=" +
            [
              "registration_key",
              "qr_code",
              "phone",
              "store_id",
              "created_at"
            ].join(",") +
            "&limit=1",
            {
              method:
                "GET"
            }
          );

        if(
          !Array.isArray(
            rows
          ) ||
          rows.length === 0
        ){

          return res
            .status(404)
            .json({
              ok:
                false,

              message:
                "등록정보를 찾을 수 없습니다."
            });
        }

        const row =
          rows[0];

        return res
          .status(200)
          .json({
            ok:
              true,

            registration_key:
              row.registration_key,

            qr_code:
              row.qr_code,

            phone:
              row.phone,

            store_id:
              row.store_id || null
          });

      }catch(error){

        console.error(
          "registration lookup error:",
          error
        );

        return res
          .status(500)
          .json({
            ok:
              false,

            message:
              "아이폰 등록정보 확인에 실패했습니다."
          });
      }
    }


    /*
     * 아이폰 앱 설치 준비
     *
     * 이 단계에서는 자동차를 등록하지 않음
     */

    if(
      req.method === "POST"
    ){

      const body =
        req.body || {};

      const qrCode =
        String(
          body.code ||
          body.qr_code ||
          ""
        )
          .trim()
          .toUpperCase();

      const phone =
        normalizePhone(
          body.phone ||
          body.owner_phone
        );

      if(
        !validCode(
          qrCode
        ) ||
        !/^01[016789][0-9]{7,8}$/
          .test(
            phone
          )
      ){

        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "입력값이 올바르지 않습니다."
          });
      }

      if(
        body.iphone_install !== true
      ){

        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "아이폰 설치 준비 요청이 아닙니다."
          });
      }

      try{

        /*
         * QR에 배정된 마트번호 확인
         */

        const vehicleRows =
          await sb(
            "vehicle_qr" +
            "?qr_code=eq." +
            encodeURIComponent(
              qrCode
            ) +
            "&select=" +
            [
              "qr_code",
              "store_id",
              "is_active"
            ].join(",") +
            "&limit=1",
            {
              method:
                "GET"
            }
          );

        if(
          !Array.isArray(
            vehicleRows
          ) ||
          vehicleRows.length === 0
        ){

          return res
            .status(404)
            .json({
              ok:
                false,

              message:
                "등록되지 않은 자동차 QR입니다."
            });
        }

        const vehicle =
          vehicleRows[0];

        if(
          vehicle.is_active === false
        ){

          return res
            .status(400)
            .json({
              ok:
                false,

              message:
                "사용이 중지된 자동차 QR입니다."
            });
        }

        const registrationKey =
          crypto
            .randomUUID()
            .toLowerCase();

        /*
         * 아이폰 설치 후 복원할
         * 최소 정보만 저장
         */

        await sb(
          "pending_app_registrations",
          {
            method:
              "POST",

            headers:{
              Prefer:
                "return=minimal"
            },

            body:
              JSON.stringify({
                registration_key:
                  registrationKey,

                qr_code:
                  qrCode,

                phone:
                  phone,

                store_id:
                  vehicle.store_id ||
                  null,

                created_at:
                  new Date()
                    .toISOString()
              })
          }
        );

        return res
          .status(200)
          .json({
            ok:
              true,

            registration_key:
              registrationKey,

            store_id:
              vehicle.store_id ||
              null
          });

      }catch(error){

        console.error(
          "iPhone preparation error:",
          error
        );

        return res
          .status(500)
          .json({
            ok:
              false,

            message:
              "아이폰 설치 준비에 실패했습니다."
          });
      }
    }


    return res
      .status(405)
      .json({
        ok:
          false,

        message:
          "GET 또는 POST 요청만 사용할 수 있습니다."
      });
  };
