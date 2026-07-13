.const admin = require("firebase-admin");
const { sb, validCode } = require("./_lib");

function getFirebaseApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "";

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !privateKey
  ) {
    throw new Error("Firebase 서버 환경변수가 설정되지 않았습니다.");
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 가능합니다."
    });
  }

  const { code, kind } = req.body || {};

  if (!validCode(code) || !["move", "emergency"].includes(kind)) {
    return res.status(400).json({
      error: "요청값이 올바르지 않습니다."
    });
  }

  try {
    const rows = await sb(
      `qr_codes?qr_code=eq.${encodeURIComponent(
        code
      )}&select=qr_code,owner_phone,push_token,is_registered&limit=1`
    );

    const row = rows && rows[0];

    if (!row || !row.owner_phone || !row.is_registered) {
      return res.status(404).json({
        error: "등록되지 않은 차량입니다."
      });
    }

    if (!row.push_token) {
      return res.status(400).json({
        error: "차주의 푸시 알림이 등록되지 않았습니다."
      });
    }

    await sb("vehicle_call_log", {
      method: "POST",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        qr_code: code,
        call_type: kind,
        created_at: new Date().toISOString()
      })
    });

    getFirebaseApp();

    const title =
      kind === "emergency"
        ? "긴급 차량 호출"
        : "차량이동 요청";

    const body =
      kind === "emergency"
        ? "차량과 관련된 긴급 연락 요청이 접수되었습니다."
        : "주차된 차량의 이동 요청이 접수되었습니다.";

    const messageId = await admin.messaging().send({
      token: row.push_token,
      notification: {
        title,
        body
      },
      data: {
        qr_code: String(code),
        request_type: String(kind),
        url: "/72.html?code=" + encodeURIComponent(code)
      },
      webpush: {
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: true
        },
        fcmOptions: {
          link: "/72.html?code=" + encodeURIComponent(code)
        }
      }
    });

    return res.status(200).json({
      ok: true,
      messageId
    });
  } catch (error) {
    console.error("푸시 발송 오류:", error);

    return res.status(500).json({
      error: "푸시 알림 전송에 실패했습니다.",
      detail: error.message
    });
  }
};
