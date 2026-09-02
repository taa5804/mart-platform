import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function json(
  data: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

function normalizeStatus(
  value: unknown,
) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase();
}


/* =========================================
   매장 ID 자동 생성

   M000001
   M000002
   M000003
   ...
========================================= */

async function createMartCode(
  supabase: any,
) {

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "mart_members",
      )
      .select(
        "mart_code",
      )
      .not(
        "mart_code",
        "is",
        null,
      );

  if (error) {
    throw new Error(
      "매장 ID 생성 정보를 확인하지 못했습니다.",
    );
  }

  let maxNumber = 0;

  for (
    const row of data || []
  ) {

    const code =
      String(
        row.mart_code || "",
      )
        .trim()
        .toUpperCase();

    const match =
      /^M(\d+)$/.exec(
        code,
      );

    if (!match) {
      continue;
    }

    const number =
      Number(
        match[1],
      );

    if (
      Number.isFinite(number) &&
      number > maxNumber
    ) {
      maxNumber =
        number;
    }
  }

  /*
    혹시 동시에 여러 승인이 들어올 경우를 대비해
    이미 사용 중인 번호인지 다시 확인한다.
  */

  let nextNumber =
    maxNumber + 1;

  for (
    let attempt = 0;
    attempt < 1000;
    attempt += 1
  ) {

    const martCode =
      "M" +
      String(
        nextNumber,
      ).padStart(
        6,
        "0",
      );

    const {
      data: existing,
      error:
        existingError,
    } =
      await supabase
        .from(
          "mart_members",
        )
        .select(
          "id",
        )
        .eq(
          "mart_code",
          martCode,
        )
        .maybeSingle();

    if (existingError) {
      throw new Error(
        "매장 ID 중복 여부를 확인하지 못했습니다.",
      );
    }

    if (!existing) {
      return martCode;
    }

    nextNumber += 1;
  }

  throw new Error(
    "새 매장 ID를 생성하지 못했습니다.",
  );
}


Deno.serve(
  async (req) => {

    if (
      req.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            corsHeaders,
        },
      );
    }

    if (
      req.method !==
      "POST"
    ) {
      return json(
        {
          ok: false,
          message:
            "POST 요청만 사용할 수 있습니다.",
        },
        405,
      );
    }

    try {

      const supabaseUrl =
        Deno.env.get(
          "SUPABASE_URL",
        );

      const serviceRoleKey =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY",
        );

      if (
        !supabaseUrl ||
        !serviceRoleKey
      ) {
        return json(
          {
            ok: false,
            message:
              "Supabase 서버 설정값이 없습니다.",
          },
          500,
        );
      }

      const supabase =
        createClient(
          supabaseUrl,
          serviceRoleKey,
          {
            auth: {
              persistSession:
                false,
              autoRefreshToken:
                false,
            },
          },
        );

      const body =
        await req.json();

      const action =
        String(
          body?.action || "",
        ).trim();

      const sessionToken =
        String(
          body?.session_token ||
          "",
        ).trim();

      if (
        !sessionToken
      ) {
        return json(
          {
            ok: false,
            message:
              "본사 관리자 로그인이 필요합니다.",
          },
          401,
        );
      }


      /*
        본사 관리자 세션 확인
      */

      const adminResponse =
        await fetch(
          `${supabaseUrl}/functions/v1/hq-admin-account`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  action:
                    "validate_session",

                  session_token:
                    sessionToken,
                },
              ),
          },
        );

      const adminText =
        await adminResponse.text();

      let adminResult:
        Record<
          string,
          unknown
        > = {};

      try {
        adminResult =
          adminText
            ? JSON.parse(
                adminText,
              )
            : {};
      } catch {
        adminResult = {};
      }

      if (
        !adminResponse.ok ||
        adminResult?.ok ===
          false
      ) {
        return json(
          {
            ok: false,
            message:
              "본사 관리자 인증이 만료되었습니다.",
          },
          401,
        );
      }


      /*
        가맹점 목록
      */

      if (
        action ===
        "list_stores"
      ) {

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "mart_members",
            )
            .select(
              `
              id,
              mart_code,
              mart_name,
              approval_status
              `,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            );

        if (error) {
          console.error(
            "가맹점 목록 오류:",
            error,
          );

          return json(
            {
              ok: false,
              message:
                "가맹점 목록을 불러오지 못했습니다.",
              error:
                error.message,
            },
            500,
          );
        }

        const stores =
          (
            data || []
          ).map(
            (
              row: any,
            ) => {

              const status =
                normalizeStatus(
                  row.approval_status,
                );

              const pending =
                !status ||
                status ===
                  "pending" ||
                status ===
                  "waiting" ||
                status ===
                  "승인대기";

              return {
                store_id:
                  row.mart_code ||
                  String(
                    row.id,
                  ),

                store_name:
                  row.mart_name ||
                  "",

                account_status:
                  pending
                    ? "pending"
                    : "active",
              };
            },
          );

        return json(
          {
            ok: true,
            stores,
          },
        );
      }


      /*
        가맹점 승인

        1. 승인대기 매장 확인
        2. mart_code 없으면 자동 생성
        3. mart_code DB 저장
        4. 승인 처리
        5. 서비스 활성화
        6. 해당 매장 문의방 자동 생성
      */

      if (
        action ===
        "activate_store"
      ) {

        const storeId =
          String(
            body?.store_id ||
            "",
          ).trim();

        if (
          !storeId
        ) {
          return json(
            {
              ok: false,
              message:
                "마트번호가 없습니다.",
            },
            400,
          );
        }


        /*
          mart_code로 먼저 검색
        */

        let {
          data: store,
          error:
            storeError,
        } =
          await supabase
            .from(
              "mart_members",
            )
            .select(
              `
              id,
              mart_code,
              mart_name,
              approval_status
              `,
            )
            .eq(
              "mart_code",
              storeId,
            )
            .maybeSingle();


        /*
          아직 mart_code가 없는
          승인대기 자료라면
          내부 id로 다시 확인
        */

        if (
          !store &&
          /^\d+$/.test(
            storeId,
          )
        ) {

          const result =
            await supabase
              .from(
                "mart_members",
              )
              .select(
                `
                id,
                mart_code,
                mart_name,
                approval_status
                `,
              )
              .eq(
                "id",
                Number(
                  storeId,
                ),
              )
              .maybeSingle();

          store =
            result.data;

          storeError =
            result.error;
        }

        if (
          storeError
        ) {
          console.error(
            "가맹점 조회 오류:",
            storeError,
          );

          return json(
            {
              ok: false,
              message:
                "가맹점 정보를 확인하지 못했습니다.",
              error:
                storeError.message,
            },
            500,
          );
        }

        if (
          !store
        ) {
          return json(
            {
              ok: false,
              message:
                "해당 가맹점을 찾을 수 없습니다.",
            },
            404,
          );
        }


        /*
          매장 ID 확인

          기존 mart_code가 있으면 그대로 사용

          mart_code가 없으면
          M000001 형식으로 자동 생성
        */

        let martCode =
          String(
            store.mart_code ||
            "",
          ).trim();

        let martCodeCreated =
          false;

        if (
          !martCode
        ) {

          martCode =
            await createMartCode(
              supabase,
            );

          const {
            error:
              martCodeError,
          } =
            await supabase
              .from(
                "mart_members",
              )
              .update(
                {
                  mart_code:
                    martCode,
                },
              )
              .eq(
                "id",
                store.id,
              );

          if (
            martCodeError
          ) {
            console.error(
              "매장 ID 저장 오류:",
              martCodeError,
            );

            return json(
              {
                ok: false,
                message:
                  "매장 ID 저장 중 오류가 발생했습니다.",
                error:
                  martCodeError.message,
              },
              500,
            );
          }

          martCodeCreated =
            true;
        }


        /*
          승인 처리
        */

        const now =
          new Date()
            .toISOString();

        const {
          error:
            approvalError,
        } =
          await supabase
            .from(
              "mart_members",
            )
            .update(
              {
                approval_status:
                  "approved",

                service_status:
                  "active",
              },
            )
            .eq(
              "id",
              store.id,
            );

        if (
          approvalError
        ) {
          console.error(
            "가맹점 승인 오류:",
            approvalError,
          );


          /*
            이번 승인 과정에서
            새로 생성한 mart_code라면
            승인 실패 시 원상복구
          */

          if (
            martCodeCreated
          ) {
            await supabase
              .from(
                "mart_members",
              )
              .update(
                {
                  mart_code:
                    null,
                },
              )
              .eq(
                "id",
                store.id,
              );
          }

          return json(
            {
              ok: false,
              message:
                "가맹점 승인 처리 중 오류가 발생했습니다.",
              error:
                approvalError.message,
            },
            500,
          );
        }


        /*
          승인과 동시에
          해당 마트 문의방 자동 생성

          이미 방이 있으면
          새로 만들지 않고
          기존 방을 활성화
        */

        const {
          data: room,
          error:
            roomError,
        } =
          await supabase
            .from(
              "store_inquiry_rooms",
            )
            .upsert(
              {
                store_id:
                  martCode,

                is_active:
                  true,

                updated_at:
                  now,
              },
              {
                onConflict:
                  "store_id",
              },
            )
            .select(
              "id, store_id",
            )
            .single();

        if (
          roomError
        ) {
          console.error(
            "문의방 생성 오류:",
            roomError,
          );


          /*
            문의방 생성 실패 시
            승인 상태 원상복구
          */

          const restoreData:
            Record<
              string,
              unknown
            > = {
              approval_status:
                store.approval_status,
              service_status:
                "inactive",
            };

          /*
            이번 승인에서
            새로 만든 매장 ID라면
            ID도 원상복구
          */

          if (
            martCodeCreated
          ) {
            restoreData.mart_code =
              null;
          }

          await supabase
            .from(
              "mart_members",
            )
            .update(
              restoreData,
            )
            .eq(
              "id",
              store.id,
            );

          return json(
            {
              ok: false,
              message:
                "마트 문의방 생성 중 오류가 발생했습니다.",
              error:
                roomError.message,
            },
            500,
          );
        }


        /*
          승인 완료
        */

        return json(
          {
            ok: true,

            message:
              "가맹점 승인, 매장 ID 발급 및 마트 문의방 생성이 완료되었습니다.",

            store_id:
              martCode,

            mart_code:
              martCode,

            room_id:
              room.id,
          },
        );
      }


      return json(
        {
          ok: false,
          message:
            "지원하지 않는 요청입니다.",
        },
        400,
      );

    } catch (
      error
    ) {

      console.error(
        error,
      );

      return json(
        {
          ok: false,

          message:
            error instanceof
              Error
              ? error.message
              : "서버 오류가 발생했습니다.",
        },
        500,
      );
    }
  },
);
