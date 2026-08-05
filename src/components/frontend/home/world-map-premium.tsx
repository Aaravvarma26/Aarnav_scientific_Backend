// Original, hand-built SVG visualization for the homepage hero — not derived
// from any licensed or stock imagery. White background, subtle blue
// gradients, a faint hexagonal "molecular" pattern, corporate-blue
// (#0A66C2) highlighted countries, a glowing India HQ marker, and animated
// export route lines. Vector-based (SVG), so it scales cleanly to any
// resolution/aspect ratio a hero section needs — including 4K displays —
// without the quality loss a fixed-resolution raster image would have.

type CountryPoint = { name: string; lat: number; lon: number };

const BRAND_BLUE = "#0A66C2";

// Approximate country centroids (lat, lon) — a schematic network map, not
// intended as precise cartography. Reused/verified against the same 33
// export markets used on the Export page.
const COUNTRY_COORDS: Record<string, [number, number]> = {
  "India": [19.07, 72.87], // Mumbai HQ used as the hub position
  "United Arab Emirates": [23.4241, 53.8478],
  "Saudi Arabia": [23.8859, 45.0792],
  "Oman": [21.4735, 55.9754],
  "Bahrain": [26.0667, 50.5577],
  "Jordan": [30.5852, 36.2384],
  "Iran": [32.4279, 53.688],
  "Egypt": [26.8206, 30.8025],
  "Kenya": [-0.0236, 37.9062],
  "Uganda": [1.3733, 32.2903],
  "Sudan": [12.8628, 30.2176],
  "Ethiopia": [9.145, 40.4897],
  "Rwanda": [-1.9403, 29.8739],
  "Burundi": [-3.3731, 29.9189],
  "Malawi": [-13.2543, 34.3015],
  "Zambia": [-13.1339, 27.8493],
  "Mauritius": [-20.3484, 57.5522],
  "South Africa": [-30.5595, 22.9375],
  "Nigeria": [9.082, 8.6753],
  "United States": [37.0902, -95.7129],
  "United Kingdom": [55.3781, -3.436],
  "Germany": [51.1657, 10.4515],
  "Bangladesh": [23.685, 90.3563],
  "Nepal": [28.3949, 84.124],
  "Sri Lanka": [7.8731, 80.7718],
  "Thailand": [15.87, 100.9925],
  "Singapore": [1.3521, 103.8198],
  "Malaysia": [4.2105, 101.9758],
  "Indonesia": [-0.7893, 113.9213],
  "Vietnam": [14.0583, 108.2772],
  "Myanmar": [21.9162, 95.956],
  "Cambodia": [12.5657, 104.991],
  "Brazil": [-14.235, -51.9253],
};

const WIDTH = 1600;
const HEIGHT = 900;
const HUB = "India";

function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * WIDTH;
  const y = ((90 - lat) / 180) * HEIGHT * 0.86 + HEIGHT * 0.07; // slight vertical compression + centering
  return { x, y };
}

function arcPath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - Math.min(120, Math.abs(x2 - x1) * 0.2);
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth rounded "pebble" blob generator — used for the flat-vector
// continent silhouettes. Sized generously around each region's real marker
// cluster so every marker lands cleanly on its landmass.
function blobPath(cx: number, cy: number, rx: number, ry: number, seed: number, vertexCount = 10, jitter = 0.12) {
  const rand = mulberry32(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i / vertexCount) * Math.PI * 2;
    const r = 1 + (rand() * 2 - 1) * jitter;
    pts.push([cx + Math.cos(angle) * rx * r, cy + Math.sin(angle) * ry * r]);
  }
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${mid(pts[pts.length - 1], pts[0])[0]} ${mid(pts[pts.length - 1], pts[0])[1]} `;
  for (let i = 0; i < pts.length; i++) {
    const next = pts[(i + 1) % pts.length];
    const m = mid(pts[i], next);
    d += `Q ${pts[i][0]} ${pts[i][1]} ${m[0]} ${m[1]} `;
  }
  return d + "Z";
}

// Region blobs sized around this map's projection (recomputed for the
// wider 1600×900 canvas / compressed vertical projection used here).
const REGION_BLOBS = [
  { cx: 374, cy: 258, rx: 120, ry: 100, seed: 1 }, // North America (USA)
  { cx: 570, cy: 496, rx: 104, ry: 140, seed: 2 }, // South America (Brazil)
  { cx: 816, cy: 190, rx: 108, ry: 78, seed: 3 }, // Europe (UK, Germany)
  { cx: 947, cy: 430, rx: 190, ry: 210, seed: 4, vertexCount: 14 }, // Africa + Middle East
  { cx: 1163, cy: 350, rx: 108, ry: 108, seed: 5 }, // South Asia (India hub, Bangladesh, Nepal, Sri Lanka)
  { cx: 1255, cy: 385, rx: 92, ry: 100, seed: 6 }, // Southeast Asia mainland
  { cx: 1306, cy: 450, rx: 68, ry: 62, seed: 7 }, // Indonesia
  { cx: 1440, cy: 610, rx: 72, ry: 52, seed: 8 }, // Decorative — Australia (no data plotted)
];

function buildHexPattern() {
  // A single hexagon "tile" path centered at (0,0) for a molecular-style
  // background pattern, tiled via <pattern>.
  const r = 26;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  });
  return `M ${pts.join(" L ")} Z`;
}

function buildMesh() {
  const rand = mulberry32(7);
  const points = Array.from({ length: 40 }, () => ({
    x: rand() * WIDTH,
    y: 60 + rand() * (HEIGHT - 120),
  }));
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const nearest = points
      .map((p, j) => ({ j, d: Math.hypot(p.x - points[i].x, p.y - points[i].y) }))
      .filter((d) => d.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { j, d } of nearest) {
      if (d < 200) lines.push({ x1: points[i].x, y1: points[i].y, x2: points[j].x, y2: points[j].y });
    }
  }
  return { points, lines };
}

export function WorldMapPremium({ countries }: { countries?: string[] }) {
  const names = (countries && countries.length > 0 ? countries : Object.keys(COUNTRY_COORDS)).filter(
    (n) => COUNTRY_COORDS[n]
  );
  const points: (CountryPoint & { x: number; y: number })[] = names.map((name) => {
    const [lat, lon] = COUNTRY_COORDS[name];
    const { x, y } = project(lat, lon);
    return { name, lat, lon, x, y };
  });

  const hub = points.find((p) => p.name === HUB);
  const others = points.filter((p) => p.name !== HUB);
  const { points: meshPoints, lines: meshLines } = buildMesh();
  const hexTile = buildHexPattern();

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-premium">
      {/* Subtle blue gradient wash */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 100% at 15% 10%, #eaf3fc 0%, #ffffff 55%)" }}
      />

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="relative h-auto w-full"
        role="img"
        aria-label="World map highlighting the 33 countries Aarnav Scientific exports to, with India as headquarters"
      >
        <defs>
          <pattern id="hexPattern" width="52" height="45" patternUnits="userSpaceOnUse" patternTransform="translate(0,0)">
            <path d={hexTile} transform="translate(26,22.5)" fill="none" stroke={BRAND_BLUE} strokeOpacity="0.06" strokeWidth="1.5" />
          </pattern>
          <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0A66C2" floodOpacity="0.10" />
          </filter>
          <radialGradient id="hubGlowPremium" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BRAND_BLUE} stopOpacity="0.45" />
            <stop offset="100%" stopColor={BRAND_BLUE} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="landFillPremium" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5f9fd" />
            <stop offset="100%" stopColor="#e3edf7" />
          </linearGradient>
        </defs>

        {/* Faint hexagonal molecular pattern, full-bleed background */}
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#hexPattern)" />

        {/* Very faint decorative connective mesh (texture only) */}
        <g stroke={BRAND_BLUE} strokeOpacity="0.05" strokeWidth="1">
          {meshLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        <g fill={BRAND_BLUE} fillOpacity="0.08">
          {meshPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" />
          ))}
        </g>

        {/* Continent silhouettes — flat vector, soft shadow, no borders/labels */}
        <g filter="url(#softShadow)">
          {REGION_BLOBS.map((r, i) => (
            <path
              key={i}
              d={blobPath(r.cx, r.cy, r.rx, r.ry, r.seed, r.vertexCount || 10)}
              fill="url(#landFillPremium)"
            />
          ))}
        </g>

        {/* Animated export routes from India HQ to every served country */}
        {hub && (
          <g fill="none" strokeWidth="1.75">
            {others.map((p) => (
              <path
                key={p.name}
                className="route-animated"
                d={arcPath(hub.x, hub.y, p.x, p.y)}
                stroke={BRAND_BLUE}
                strokeOpacity="0.55"
                strokeLinecap="round"
              />
            ))}
          </g>
        )}

        {/* Glowing markers over every served country */}
        {others.map((p) => (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r="10" fill={BRAND_BLUE} fillOpacity="0.14" />
            <circle cx={p.x} cy={p.y} r="4.5" fill={BRAND_BLUE} />
            <circle cx={p.x} cy={p.y} r="4.5" fill="#ffffff" fillOpacity="0.35" />
          </g>
        ))}

        {/* India — headquarters, larger glowing marker */}
        {hub && (
          <g>
            <circle cx={hub.x} cy={hub.y} r="42" fill="url(#hubGlowPremium)" />
            <circle cx={hub.x} cy={hub.y} r="11" fill={BRAND_BLUE} />
            <circle cx={hub.x} cy={hub.y} r="16" fill="none" stroke={BRAND_BLUE} strokeOpacity="0.45" strokeWidth="2" />
            <circle cx={hub.x} cy={hub.y} r="22" fill="none" stroke={BRAND_BLUE} strokeOpacity="0.22" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
}
