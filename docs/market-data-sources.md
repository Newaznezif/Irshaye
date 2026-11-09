# Market data sources — what was verified, what is integrated, what is refused

Measured on 2026-11-04 from this workstation unless a line says otherwise. Every claim below was
checked against the endpoint itself; nothing here is inferred from an organisation having a website
with a "prices" page.

This document exists because the market module's honesty depends on it: a reader must be able to
tell why a commodity has no price, and a future maintainer must not re-derive the answer by
guessing.

---

## 1. Integrated — the module reads these

### FEWS NET Ethiopia staple food prices (Food Data Watch API)

| | |
| --- | --- |
| Endpoint | `https://fdw.fews.net/api/marketpricefacts/` (FEWS NET Food Data Watch; JSON and CSV) |
| Publisher | FEWS NET / USAID |
| Coverage measured | 9 named Ethiopian markets, 7 regions, ~22 weekly survey dates in a 26-week window, 19 commodity/unit groups |
| Newest week measured | 2026-09-30 (≈5 weeks behind the calendar — the publisher's own review-and-release lag) |
| Cadence | Declared per row: `collection_schedule: "Weekly"` |
| Licence | Declared per row: `data_usage_policy: "Public"` |
| Access | No key, no authentication, automated requests answered normally |
| Value kind | `observed` — only rows the publisher marks `Collected`; `Not Available` stays an empty cell |

Request grammar measured on this API (each of these changed the answer, none of them documented
in a way the code could rely on):

- `format=csv` plus exactly **one** comma-joined `fields=` parameter.
- `start_date` / `end_date` are inclusive ISO dates; `period_date__gte`, `period_year` and
  `period_month` are **silently ignored** — they answer 200 and ignore the filter, so they are
  never used.
- `page_size` is capped at 500 for JSON. Any `ordering=` parameter answers **403**, so newest-week
  questions are answered by windowing, not sorting.
- `product=` needs the exact published spelling and spaces encoded as `%20`.
- Wage rows (`price_type: Wage`, unit `day`) are real published figures but are **not** commodity
  prices; the parser counts them and holds them out of every price series.

Limitations we carry: the window is capped at 26 weeks by design (`FEWS_NET_WINDOW_WEEKS`), the
`cpcv2` commodity code is kept but not interpreted, and the newest survey date trails today by
weeks — which is why the source is classified `stale` against its own weekly cadence rather than
presented as current.

### WFP Ethiopia food prices through HDX — integrated but currently refused

| | |
| --- | --- |
| Endpoint | `https://data.humdata.org/dataset/…/resource/…/download/wfp_food_prices_eth.csv` |
| Publisher | WFP rEMS (CC BY-IGO) |
| Cadence | Monthly survey; deepest history of the two (years, multiple regions and markets) |
| Access | **Refused to automation.** See §3 |
| Status in the app | Reported per publisher as `unavailable`, with the CKAN catalogue probe shown next to it so "reachable but refusing" is distinguishable from "offline" |

The connector, its parser and its provenance stay in the tree because the refusal is the
publisher's policy decision, not a code defect: if HDX ever serves the file to an honest client
the module gains the deeper history with no changes. Until then it contributes zero rows and the
UI says so.

---

## 2. Considered and rejected for automated use

| Candidate | Measured result | Why it is not a source here |
| --- | --- | --- |
| Ethiopia Commodity Exchange (ECX) | `403` on the site, no reachable machine-readable quote endpoint | No public API to integrate. Quotations would have to be scraped from a page that refuses automated clients, which this project does not do. |
| Central Statistical Agency / Ethiopian Statistics Service | Hostname did not resolve from here; price bulletins are news/PDF | No endpoint, no machine-readable series, no stable cadence statement. |
| Agricultural Transformation Institute (ATI) | No open data endpoint found; content is reports | A report is not an API. Nothing to normalise. |
| Ministry of Agriculture | WordPress news feed only | Press releases, not observations. No prices, no units, no dates per figure. |
| National Bank of Ethiopia | HTML pages and PDF bulletins | Used for the official exchange rate path only, which is a separate concern from market prices, and parsed as a reference rate — never as a market observation. |
| FAOSTAT | Annual, national-level indices | Wrong grain (annual, national) and wrong quantity (index, not a surveyed price) for a market dashboard. Never mixed into a price series. |
| World Bank Ethiopia Real-Time Prices | HDX-hosted, refuses automation (same front door as WFP). The staple-price CSV is ~41 MB of machine-learning-interpolated values | Even when served, those figures are modelled, not surveyed. Our integrity rules allow them only as `estimated`, and the module's price series are `observed` only. |
| GIAMS / `gelu.fews.net` | Hostname did not resolve | Cannot be integrated against an address that does not answer. |
| HDX DataStore (row paging for the WFP resource) | CKAN reports `datastore_active: false` | The one legitimate way to page a few rows instead of downloading 7.6 MB is not enabled for this resource, so a partial download is not available either. |

Nothing above is "unavailable because we did not look"; each row is the result of an actual request.

---

## 3. The HDX bot protection, stated plainly

`data.humdata.org` puts AWS WAF in front of its file host. Requests for both market files
answered, from four different client configurations, with the same two shapes:

- `202 Accepted` with an empty body and `x-amzn-waf-action: challenge`; or
- `406 Not Acceptable` (observed from inside this app's own HTTP runtime).

Neither carries data. The CKAN metadata API on the same host answers normally, which is what lets
the status screen say *"the publisher is reachable and its dataset was last modified on
`metadata_modified`; the file itself was not served to us"* instead of *"WFP is down"*.

What the app does **not** do: solve the JavaScript challenge, impersonate a browser to slip past
the filter, rotate headers until the rule lets us through, or use a cached copy of the file as
though it had just been retrieved. A `202` is never treated as a successful retrieval — only
HTTP 200 with bytes is, and `lib/data/http.ts` enforces that single rule.

The legitimate alternatives that were tried: the DataStore API (not enabled for this resource),
WFP's own site (`403`), and FAO/WB substitutes (wrong grain or modelled values). What remains is
graceful degradation, which is what the module now does: FEWS NET carries the survey data, WFP is
reported as refused with evidence, and no price is invented in between.

---

## 4. Consequences for the module's claims

- Commodity coverage is whatever the publishers spell. The UI's commodity list is built from
  returned rows, so a target commodity with no data is absent from the filters rather than shown
  with an invented figure.
- The deepest history available in one request is 26 survey weeks; anything longer would need the
  monthly publisher, which is refusing.
- "Regional comparison" means markets that were actually surveyed. A market with no coordinate
  from the publisher has no dot on any map.
- Freshness tiers are derived from each publisher's declared cadence and its own release lag, so a
  weekly publisher's five-week-old week reads `stale` while a monthly publisher's may not.
- Any statistic the platform computes (average, min, max, percentage change, spread) is labelled as
  ours and stays inside one market + commodity + unit + price type.
