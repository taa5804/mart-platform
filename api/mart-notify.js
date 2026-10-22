const https = require("https");

const CLAWOPS_ACCOUNT_ID = process.env.CLAWOPS_ACCOUNT_ID || "ACUfJGlcU6IkNZxuxn";
const CLAWOPS_API_KEY = process.env.CLAWOPS_API_KEY || "sk_vuT1vZJtqWMHdjROjqAi1x7XpGGpjSY2";
const CLAWOPS_FROM_NUMBER = process.env.CLAWOPS_FROM_NUMBER || "070-5276-7712";
const CLAWOPS_CALL_FLOW_ID = process.env.CLAWOPS_CALL_FLOW_ID || "cmtl15663000t01s6yddn205j";

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

async function sendLms(phone, subject, content) {
  try {
    const res = await fetch("https://www.wooriapt.app/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: normalizePhone(phone),
        content: content,
        type: "LMS",
        subject: subject
      })
    });
    return res.ok ? await res.json() : null;
  } catch (e) {
    console.error("LMS send error:", e);
    return null;
  }
}

async function triggerClawOpsCall(phone, martName) {
  try {
    const to = normalizePhone(phone);
    if (!to) return null;
    const res = await fetch(
      `https://api.claw-ops.com/v1/accounts/${CLAWOPS_ACCOUNT_ID}/calls`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLAWOPS_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          From: CLAWOPS_FROM_NUMBER,
          To: to,
          CallFlowId: CLAWOPS_CALL_FLOW_ID
        })
      }
    );
    if (res.ok) return await res.json();
    console.warn("ClawOps call status:", res.status, await res.text());
    return null;
  } catch (e) {
    console.warn("ClawOps call error:", e);
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "POST only" });

  try {
    const body = req.body || {};
    const { action, mart_name, owner_name, phone, mart_code } = body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone) {
      return res.status(400).json({ ok: false, message: "전화번호가 필요합니다." });
    }

    if (action === "APPROVED") {
      // 본사 입금확인 및 최종 사용승인 시 발송
      const content = [
        `[우리아파트 마트플랫폼] 매장 개통 완료 안내`,
        ``,
        `사장님, [${mart_name || "가맹점"}]의 입금이 확인되어 관리자 방이 정식 개통되었습니다!`,
        ``,
        `▶ 마트 고유번호: ${mart_code || "발급완료"}`,
        `▶ 대표자: ${owner_name || "대표님"}`,
        `▶ 로그인 ID: ${cleanPhone}`,
        ``,
        `지금 바로 아래 링크를 눌러 특가상품 등록, 디지털 전단지 운영을 시작하세요:`,
        `https://mart-platform.vercel.app/admin.html`,
        ``,
        `문의: 우리아파트 본사 062-952-4150`
      ].join("\n");

      const lmsResult = await sendLms(cleanPhone, "[우리아파트] 매장 개통 완료", content);

      // 클로옵스 음성 전화도 함께 발송
      let callResult = null;
      try {
        callResult = await triggerClawOpsCall(cleanPhone, mart_name);
      } catch (callErr) {
        console.warn("ClawOps call warning:", callErr);
      }

      return res.status(200).json({
        ok: true,
        message: "개통 완료 문자와 클로옵스 음성 알림이 발송되었습니다.",
        lms: lmsResult,
        call: callResult
      });
    }

    if (action === "DEPOSIT_GUIDE") {
      // 가입신청 및 계약완료 직후 입금안내 문자 발송
      const content = [
        `[우리아파트 마트플랫폼] 가맹계약 접수 안내`,
        ``,
        `사장님, [${mart_name || "가맹점"}]의 가맹계약 서명이 정상 체결되었습니다.`,
        ``,
        `아래 본사 계좌로 입금해 주시면 입금 확인 즉시 전용 매장 방이 오픈됩니다:`,
        `▶ 입금계좌: 농협 301-0123-4567-81`,
        `▶ 예금주: (주)에너젠51`,
        `▶ 입금자명: ${mart_name || owner_name || "매장명"}`,
        ``,
        `입금 확인 후 관리자 방 개통 링크와 마트코드가 문자로 자동 전송됩니다.`,
        `문의: 본사 062-952-4150`
      ].join("\n");

      const lmsResult = await sendLms(cleanPhone, "[우리아파트] 가맹계약 접수 및 계좌안내", content);

      return res.status(200).json({
        ok: true,
        message: "가맹계약 접수 및 입금안내 문자가 발송되었습니다.",
        lms: lmsResult
      });
    }

    return res.status(400).json({ ok: false, message: "지원하지 않는 작업입니다." });
  } catch (error) {
    console.error("mart-notify error:", error);
    return res.status(500).json({ ok: false, message: error.message || "알림 처리에 실패했습니다." });
  }
};
