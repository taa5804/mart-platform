"use strict";

module.exports = async function handler(req, res) {
  /* =========================================
     CORS
     아파트 / 공인중개사 / 마트 공통 사용
  ========================================= */

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  /* =========================================
     GET 요청만 허용
  ========================================= */

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "METHOD_NOT_ALLOWED"
    });
  }

  /* =========================================
     주소 확인
  ========================================= */

  const address = String(req.query.address || "").trim();

  if (!address) {
    return res.status(400).json({
      ok: false,
      error: "ADDRESS_REQUIRED"
    });
  }

  /* =========================================
     카카오 REST API KEY
  ========================================= */

  const kakaoKey = process.env.KAKAO_REST_API_KEY;

  if (!kakaoKey) {
    return res.status(500).json({
      ok: false,
      error: "KAKAO_REST_API_KEY_NOT_SET"
    });
  }

  try {
    /* =========================================
       카카오 주소 → 좌표 변환
    ========================================= */

    const url =
      "https://dapi.kakao.com/v2/local/search/address.json?query=" +
      encodeURIComponent(address);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `KakaoAK ${kakaoKey}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: "KAKAO_API_ERROR",
        detail: data
      });
    }

    /* =========================================
       검색 결과 없음
    ========================================= */

    if (!data.documents || data.documents.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "ADDRESS_NOT_FOUND",
        address
      });
    }

    /* =========================================
       첫 번째 검색 결과 사용
    ========================================= */

    const result = data.documents[0];

    return res.status(200).json({
      ok: true,
      address,
      x: Number(result.x),
      y: Number(result.y),
      longitude: Number(result.x),
      latitude: Number(result.y)
    });

  } catch (error) {
    console.error("Kakao geocode error:", error);

    return res.status(500).json({
      ok: false,
      error: "GEOCODE_FAILED"
    });
  }
};
