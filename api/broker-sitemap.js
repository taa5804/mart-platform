"use strict";

/*
  공인중개사 동 단위 사이트맵
  --------------------------------
  - agent_directory 사용
  - 전국 중개사 데이터를 읽음
  - 주소에서 시도 / 시군구 / 읍면동 추출
  - 같은 동은 1개 URL만 생성
  - 최종 URL:
    https://www.wooriapt.app/broker-search/시도/시군구/읍면동
*/

const SUPABASE_URL =
  "https://wpshlmijsscmlasqtapa.supabase.co";

const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY;

const SITE_ORIGIN =
  "https://www.wooriapt.app";

const BATCH_SIZE = 1000;


/* =========================
   기본 함수
========================= */

function clean(value) {
  return String(value || "")
    .trim()
    .slice(0, 300);
}


function pathEncode(value) {
  return encodeURIComponent(
    String(value || "").trim()
  );
}


function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}


/* =========================
   주소 → 동 단위 추출
========================= */

function getLocationFromAddress(row) {

  const jibunAddress =
    clean(row["지번주소"]);

  const roadAddress =
    clean(row["도로명주소"]);

  /*
    동 단위 판별은 지번주소 우선.
    지번주소가 없을 경우 도로명주소 사용.
  */

  const address =
    jibunAddress ||
    roadAddress;

  if (!address) {
    return null;
  }


  const parts =
    address
      .split(/\s+/)
      .filter(Boolean);


  if (parts.length < 3) {
    return null;
  }


  const region =
    clean(parts[0]);


  /*
    서울특별시 강남구 역삼동
    경기도 성남시 분당구 정자동
    세종특별자치시 조치원읍 ...
    등의 형태를 처리
  */

  let city = "";
  let place = "";


  /*
    읍 / 면 / 동 위치 검색
  */

  let placeIndex = -1;

  for (
    let i = 1;
    i < parts.length;
    i++
  ) {

    const value =
      clean(parts[i]);

    if (
      value.endsWith("동") ||
      value.endsWith("읍") ||
      value.endsWith("면")
    ) {
      place = value;
      placeIndex = i;
      break;
    }
  }


  if (!place) {
    return null;
  }


  /*
    읍면동 앞까지를 시군구로 사용

    서울특별시 강남구 역삼동
    → 강남구

    경기도 성남시 분당구 정자동
    → 성남시 분당구
  */

  if (placeIndex > 1) {

    city =
      parts
        .slice(1, placeIndex)
        .join(" ");

  } else {

    city =
      clean(parts[1]);

  }


  if (
    !region ||
    !city ||
    !place
  ) {
    return null;
  }


  return {
    region,
    city,
    place
  };
}


/* =========================
   Supabase 데이터 조회
========================= */

async function getAllBrokerLocations() {

  if (!SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY environment variable is missing."
    );
  }


  const locationSet =
    new Set();


  let offset = 0;


  while (true) {

    const query =
      new URLSearchParams();


    query.set(
      "select",
      "도로명주소,지번주소"
    );


    query.set(
      "limit",
      String(BATCH_SIZE)
    );


    query.set(
      "offset",
      String(offset)
    );


    const response =
      await fetch(
        SUPABASE_URL +
        "/rest/v1/agent_directory?" +
        query.toString(),
        {
          method: "GET",

          headers: {

            apikey:
              SUPABASE_SECRET_KEY,

            Authorization:
              "Bearer " +
              SUPABASE_SECRET_KEY,

            Accept:
              "application/json"
          }
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();


      throw new Error(
        "Broker sitemap DB error: " +
        response.status +
        " " +
        errorText
      );
    }


    const rows =
      await response.json();


    if (!Array.isArray(rows)) {
      throw new Error(
        "Broker sitemap DB response is not an array."
      );
    }


    for (
      const row of rows
    ) {

      const location =
        getLocationFromAddress(row);


      if (!location) {
        continue;
      }


      /*
        같은 동은 하나만 저장
      */

      locationSet.add(
        [
          location.region,
          location.city,
          location.place
        ].join("|")
      );
    }


    /*
      마지막 페이지
    */

    if (
      rows.length < BATCH_SIZE
    ) {
      break;
    }


    offset +=
      BATCH_SIZE;
  }


  return Array.from(
    locationSet
  );
}


/* =========================
   사이트맵 생성
========================= */

module.exports =
async function handler(
  req,
  res
) {

  res.setHeader(
    "Content-Type",
    "application/xml; charset=utf-8"
  );


  res.setHeader(
    "Cache-Control",
    "s-maxage=86400, stale-while-revalidate=604800"
  );


  try {

    const locations =
      await getAllBrokerLocations();


    const lastmod =
      new Date()
        .toISOString()
        .split("T")[0];


    const urls = [];


    /*
      동 단위 URL 생성
    */

    for (
      const locationKey
      of locations
    ) {

      const parts =
        locationKey.split("|");


      if (
        parts.length !== 3
      ) {
        continue;
      }


      const url =
        SITE_ORIGIN +
        "/broker-search/" +
        parts
          .map(pathEncode)
          .join("/");


      urls.push(
        [
          "  <url>",

          "    <loc>" +
            xmlEscape(url) +
          "</loc>",

          "    <lastmod>" +
            lastmod +
          "</lastmod>",

          "    <changefreq>weekly</changefreq>",

          "    <priority>0.8</priority>",

          "  </url>"
        ].join("\n")
      );
    }


    const xml =
      [
        '<?xml version="1.0" encoding="UTF-8"?>',

        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',

        urls.join("\n"),

        "</urlset>"
      ].join("\n");


    return res
      .status(200)
      .send(xml);


  } catch (error) {

    console.error(
      "BROKER SITEMAP ERROR:",
      error
    );


    return res
      .status(500)
      .send(
        "Broker sitemap generation failed."
      );
  }
};
