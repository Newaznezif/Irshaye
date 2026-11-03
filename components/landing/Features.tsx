import {
  BookOpen,
  CalendarDays,
  ChartLine,
  CloudRain,
  CloudSun,
  Clock,
  Gauge,
  Layers,
  MapPin,
  Mountain,
  Scale,
  Store,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { FeatureSplit } from './FeatureSplit';

/**
 * The four evidence modules. Every claim here is a description of what the
 * application actually renders — source names, cadences and value kinds come
 * from the same registries the pages read, so this section cannot drift from
 * the product.
 */
export function Features() {
  return (
    <div id="intelligence">
      <FeatureSplit
        eyebrow="Climate Intelligence"
        title="Live weather, the week ahead, and the 30-year context — kept apart by kind"
        lede="The climate module reads four publishers for the same grid cell and never blends them into a single confident number. An observation, a model output, and a forecast are different claims, and IRSHAYE shows them with different labels, colours and freshness rules."
        image={{
          src: '/images/climate-sky.jpg',
          alt: 'Heavy rain clouds building over green Ethiopian farmland, with shafts of light across the valley',
        }}
        href="/dashboard/climate"
        ctaLabel="Open Climate Intelligence"
        bullets={[
          {
            icon: CloudSun,
            title: 'Current conditions and a 7-day outlook',
            body: 'Open-Meteo forecasts for your coordinates, refreshed on the source’s own hourly cadence and stamped with the retrieval time.',
          },
          {
            icon: CloudRain,
            title: 'Rainfall against the season calendar',
            body: 'The recent daily record next to kiremt and belg expectations, so a late start is visible rather than merely reported.',
          },
          {
            icon: Gauge,
            title: 'Drought and heat indicators',
            body: 'Derived from NASA POWER agroclimatology for the same cell, with the derived values labelled as derived instead of measured.',
          },
          {
            icon: TriangleAlert,
            title: 'Freshness that tells the truth',
            body: 'ERA5 reanalysis arrives about a week late. The interface says so instead of presenting a lagging number as current.',
          },
        ]}
      />

      <FeatureSplit
        tone="brand"
        flip
        eyebrow="Crop Advisory"
        title="Eleven Ethiopian crop profiles, each figure tied to a named source"
        lede="Teff, maize, wheat, barley, sorghum, coffee, faba bean, chickpea, noug, enset and khat. Temperature, rainfall, altitude and soil-pH ranges are transcribed from PROTA4U species chapters, Ecocrop, FAO and peer-reviewed Ethiopian studies — with the citation attached to the number."
        image={{
          src: '/images/teff-field.jpg',
          alt: 'A ripe stand of ethiopian teff grain with seed heads catching low evening light',
        }}
        href="/dashboard/crops"
        ctaLabel="Open Crop Advisory"
        bullets={[
          {
            icon: CalendarDays,
            title: 'Planting and harvest windows',
            body: 'Season guidance per crop and agroecology. Where a retrievable source gave no calendar, the profile shows a gap rather than inventing one.',
          },
          {
            icon: MapPin,
            title: 'Suitability for your place',
            body: 'The selected location’s altitude and rainfall are compared against the documented range, and the match is graded — not asserted.',
          },
          {
            icon: BookOpen,
            title: 'Sources you can open',
            body: 'Every profile links to its citation. Where PROTA and a field study disagree, both figures appear side by side instead of a quiet average.',
          },
          {
            icon: Scale,
            title: 'Stated limitations',
            body: 'Ranges are literature-based documented preferences, not measurements of your field, and the module says that in its own header.',
          },
        ]}
      />

      <FeatureSplit
        eyebrow="Soil Management"
        title="Conservation practices for erosion-prone Ethiopian farmland"
        lede="Fanya juu trenches, contour bunds, compost and manure handling, crop rotation, residue and cover management, integrated soil and water conservation. Each practice comes from published Ethiopian land-use and highland conservation research, with the conditions it applies under and the sources that describe it."
        image={{
          src: '/images/soil-conservation.jpg',
          alt: 'Stone bunds and terraced slopes holding soil on a cultivated Ethiopian hillside',
        }}
        href="/dashboard/soil"
        ctaLabel="Open Soil Management"
        bullets={[
          {
            icon: Layers,
            title: 'Practice guidance, not a soil test',
            body: 'The module manages risk on documented slopes and rainfall. It never claims to know your soil’s nutrient status, because it has not measured it.',
          },
          {
            icon: Mountain,
            title: 'Slope and erosion context',
            body: 'Rainfall intensity and terrain are used to flag where runoff and soil loss are the binding constraint.',
          },
          {
            icon: Timer,
            title: 'Sequencing that respects the season',
            body: 'Structural works before the long rains, vegetative bunds after — timed against the same calendar the climate module uses.',
          },
        ]}
      />

      <FeatureSplit
        tone="brand"
        flip
        eyebrow="Market Intelligence"
        title="Real Ethiopian market prices, with the survey date attached"
        lede="Prices come from the WFP Ethiopia rEMS survey and the World Bank real-time price series via HDX, read for the selected market centre. Monthly survey cadence means the newest figure is usually weeks old, so the module shows the observation month rather than implying today’s price."
        image={{
          src: '/images/grain-market.jpg',
          alt: 'Jute sacks of maize, teff and other grains stacked at an Ethiopian market, with measuring baskets on top',
        }}
        href="/dashboard/markets"
        ctaLabel="Open Market Intelligence"
        bullets={[
          {
            icon: Store,
            title: 'Market centres from the survey register',
            body: 'Locations are drawn from the published price datasets, so a price is always tied to the market it was collected in.',
          },
          {
            icon: ChartLine,
            title: 'Trend without invention',
            body: 'Series are rendered from returned observations only. A missing month is a gap in the line, never an interpolated point.',
          },
          {
            icon: Clock,
            title: 'Visibility of the lag',
            body: 'Survey prices are monthly, and NBE indicative rates are daily — both freshness windows are shown on the numbers.',
          },
        ]}
      />
    </div>
  );
}
