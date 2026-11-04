# Demo flow

The walkthrough below is the implemented application. Nothing in it needs a key: climate, market, and reference content come from open publishers at request time.

## The one flow that matters

```text
Location → Crop → Climate context → Agricultural information → Evidence-based recommendation
```

1. **Open `/dashboard`.** The workbench holds a place and a crop, persisted in this browser only. Default is Addis Ababa / teff; a returning farmer sees what they last chose.
2. **Choose a place.** `LocationPicker` searches the WFP market-centre list, so a selection is a real published point with real coordinates, not a pin we guessed.
3. **Choose a crop.** `CropPicker` lists the curated profiles (`lib/crops/catalog.ts`) — teff, maize, wheat, barley, sorghum, coffee, faba bean, chickpea, noug, enset, khat.
4. **Read the season context.** The overview fetches the 7-day forecast for that point and shows current temperature, forecast rain over seven days, the next day with ≥ 1 mm, and current humidity — each labelled `observed` or `forecast`, with the publisher and retrieval time underneath.
5. **Open Crop Advisory.** The saved profile's documented rainfall and temperature ranges are compared with live data and rendered as `within` / `watch` / `outside` per factor, plus an overall verdict of `supported` / `mixed` / `weak` / `insufficient-data`.
6. **Ask the advisor.** `/dashboard/advisor` assembles evidence for that place and crop, shows it, and only then asks Gemini. The answer comes with the evidence ids it used, an uncertainty statement, and limitations.

## Honest states to show on purpose

A demo is more convincing when it shows what happens when a source does not answer:

- **Altitude** on the advisory page is always `unknown`: the platform cannot measure a field's altitude from open data, so elevation stays the farmer's judgement.
- **Crop windows** that no document covers render as an explicit gap ("no citable month calendar was found … rather than guessing one"). Teff and several crops show this.
- **No `GEMINI_API_KEY`** → the advisor page says this deployment has none and produces no answer. It does not print a substitute.
- **A publisher that fails** → the Data Sources page marks it and the dependent panel shows an unavailable state.
- **Settings** reports live probe results for every integration, including "not configured" for Supabase.

## Supporting pages

- `/dashboard/climate` — forecast, ERA5 archive, NASA POWER daily series and 30-year normals side by side, with the value kind of each.
- `/dashboard/soil` — heavy-rain days and totals from 90 days of measured rainfall as an erosion-pressure signal, next to cited Fanya Juu and contour practice guidance, under a standing "this is not a soil diagnosis" banner.
- `/dashboard/markets` — WFP grain prices for the markets the publisher covers, with the publisher's own observation dates and the note that no price is ever estimated here.
- `/dashboard/sources` — licence, cadence, publication lag, and last probe result per publisher.

## Future channels

A Telegram, SMS, or USSD adapter would call `lib/advisor`, `lib/crops`, and the connectors directly — the same modules steps 4–6 use. That channel work is deferred, and none of it exists in this codebase. Reaching a farmer by feature phone remains the point of the product; it is not part of the MVP build.
