"use strict";

/*
  공인중개사 전용 동 단위 사이트맵
  --------------------------------
  - 기존 apt-page.js 수정 없음
  - 기존 마트 API 수정 없음
  - agent_directory에서 전국 동 단위 조회
  - 시도 / 시군구 / 읍면동 기준
  - 1000개씩 끝까지 조회
  - 중복 동 제거
  - 최종 URL:
    https://www.wooriapt.app/broker-search/시도/시군구/읍면동
*/

const SUPABASE_URL =
  "https://wpshlmjjsscmlasqtapa.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_3QLYewR-TXBd1mNfte6OJg_kre42L7K";

const SITE_ORIGIN =
  "https://www.wooriapt.app";

const BATCH_SIZE = 1000;


/* =========================================
   공통 함수
========================================= */

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


/* =========================================
   중개사 동 단위 전체 조회
========================================= */

async function getAllBrokerLocations() {
  const locationSet =
    new Set();

  let offset = 0;


  while (true) {
    const query =
      new URLSearchParams();


    query.set(
      "select",
      "시도,시군구,읍면동"
    );


    query.set(
      "order",
      "시도.asc,시군구.asc,읍면동.asc"
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
              SUPABASE_KEY,

            Authorization:
              "Bearer " +
              SUPABASE_KEY,

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
      const region =
        clean(
          row["시도"]
        );


      const city =
        clean(
          row["시군구"]
        );


      const place =
        clean(
          row["읍면동"]
        );


      if (
        !region ||
        !city ||
        !place
      ) {
        continue;
      }


      locationSet.add(
        [
          region,
          city,
          place
        ].join("|")
      );
    }


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


/* =========================================
   사이트맵 API
========================================= */

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
      중개사 안내 페이지
    */

    urls.push(
      [
        "  <url>",

        "    <loc>" +
          xmlEscape(
            SITE_ORIGIN +
            "/broker-guide.html"
          ) +
        "</loc>",

        "    <lastmod>" +
          lastmod +
        "</lastmod>",

        "    <changefreq>weekly</changefreq>",

        "    <priority>0.9</priority>",

        "  </url>"
      ].join("\n")
    );


    /*
      전국 동 단위 중개사 검색 페이지
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
