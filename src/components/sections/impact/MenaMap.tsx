"use client";

import { useLocale } from "next-intl";
import { useRef, useState, useEffect, memo } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { menaCountries } from "./impactData";
import { MapPin, Users, FolderOpen } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/* ISO 3166 numeric codes for MENA + Africa countries we operate in */
const leeeCountryCodes: Record<string, string> = {
  "422": "lb", // Lebanon
  "818": "eg", // Egypt
  "400": "jo", // Jordan
  "368": "iq", // Iraq
  "275": "ps", // Palestine
  "788": "tn", // Tunisia
  "504": "ma", // Morocco
  "434": "ly", // Libya
  "729": "sd", // Sudan
  "404": "ke", // Kenya
};

/* Neighboring countries to show but not highlight */
const neighborCodes = new Set([
  "012", // Algeria
  "682", // Saudi Arabia
  "760", // Syria
  "887", // Yemen
  "512", // Oman
  "478", // Mauritania
  "706", // Somalia
  "792", // Turkey
  "364", // Iran
  "231", // Ethiopia
  "232", // Eritrea
  "262", // Djibouti
  "148", // Chad
  "562", // Niger
  "466", // Mali
  "376", // Israel
  "196", // Cyprus
  "300", // Greece
  "380", // Italy
  "784", // UAE
  "414", // Kuwait
  "048", // Bahrain
  "634", // Qatar
  "800", // Uganda
  "834", // Tanzania
  "716", // Zimbabwe (buffer)
  "566", // Nigeria
  "120", // Cameroon
  "140", // Central African Republic
  "178", // Congo
  "180", // DR Congo
  "204", // Benin
  "854", // Burkina Faso
  "768", // Togo
  "288", // Ghana
  "384", // Côte d'Ivoire
  "694", // Sierra Leone
  "270", // Gambia
  "324", // Guinea
  "624", // Guinea-Bissau
  "686", // Senegal
  "430", // Liberia
  "724", // Spain
  "620", // Portugal
  "250", // France
]);

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const MapChart = memo(function MapChart({
  activeCountry,
  setActiveCountry,
  hoveredCountry,
  setHoveredCountry,
}: {
  activeCountry: string | null;
  setActiveCountry: (id: string) => void;
  hoveredCountry: string | null;
  setHoveredCountry: (id: string | null) => void;
}) {
  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{
        center: [35, 25],
        scale: 450,
      }}
      width={600}
      height={500}
      style={{ width: "100%", height: "auto" }}
    >
      <ZoomableGroup center={[35, 25]} zoom={1} minZoom={1} maxZoom={1}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const numericCode = geo.id;
              const leeeId = leeeCountryCodes[numericCode];
              const isLeee = !!leeeId;
              const isNeighbor = neighborCodes.has(numericCode);
              const isActive = leeeId === activeCountry;
              const isHovered = leeeId === hoveredCountry;

              // Only render MENA region + neighbors
              if (!isLeee && !isNeighbor) return null;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => { if (isLeee) setHoveredCountry(leeeId); }}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => { if (isLeee) setActiveCountry(leeeId); }}
                  style={{
                    default: {
                      fill: isActive
                        ? "#147DBB"
                        : isHovered
                        ? "#60a5fa"
                        : isLeee
                        ? "#93c5fd"
                        : "#e2e8f0",
                      stroke: isActive
                        ? "#0c5a9e"
                        : isLeee
                        ? "#60a5fa"
                        : "#cbd5e1",
                      strokeWidth: isActive ? 1.5 : 0.5,
                      cursor: isLeee ? "pointer" : "default",
                      outline: "none",
                      transition: "all 250ms",
                    },
                    hover: {
                      fill: isLeee ? (isActive ? "#1068a0" : "#60a5fa") : "#e2e8f0",
                      stroke: isLeee ? "#3b82f6" : "#cbd5e1",
                      strokeWidth: isLeee ? 1 : 0.5,
                      cursor: isLeee ? "pointer" : "default",
                      outline: "none",
                    },
                    pressed: {
                      fill: isLeee ? "#147DBB" : "#e2e8f0",
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ZoomableGroup>
    </ComposableMap>
  );
});

export function MenaMap() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);
  const [activeCountry, setActiveCountry] = useState<string>("lb");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const activeData = menaCountries.find((c) => c.id === activeCountry);
  const displayedCountry = hoveredCountry
    ? menaCountries.find((c) => c.id === hoveredCountry)
    : activeData;

  const totalPrograms = menaCountries.reduce((sum, c) => sum + c.programs, 0);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] start-[3%] w-24 h-24 rounded-full bg-brand-blue/[0.04] animate-[float-slow_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[8%] end-[5%] w-16 h-16 rounded-full border-2 border-emerald-400/[0.08] animate-[float-medium_5s_ease-in-out_infinite]" />
      </div>

      <Container>
        {/* Header */}
        <div className={cn("text-center mb-14 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
          <span className="inline-flex items-center gap-3 text-emerald-600 text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-emerald-500" />
            {isAr ? "وصولنا الجغرافي" : "Our Geographic Reach"}
            <span className="w-6 h-[1.5px] bg-emerald-500" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "عبر منطقة الشرق الأوسط وأفريقيا" : "Across MENA & Africa"}
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            {isAr
              ? `${totalPrograms} برنامجاً في ${menaCountries.length} دول — من بيروت إلى نيروبي.`
              : `${totalPrograms} programs across ${menaCountries.length} countries — from Beirut to Nairobi.`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Map */}
          <div className={cn(
            "lg:col-span-3 relative bg-white rounded-2xl border border-surface-tertiary shadow-sm overflow-hidden transition-all duration-700",
            sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )} style={{ transitionDelay: "200ms" }}>
            <MapChart
              activeCountry={activeCountry}
              setActiveCountry={setActiveCountry}
              hoveredCountry={hoveredCountry}
              setHoveredCountry={setHoveredCountry}
            />

            {/* Legend */}
            <div className="absolute bottom-4 start-4 flex items-center gap-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-surface-tertiary/50 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#93c5fd] border border-[#60a5fa]" />
                <span className="text-[10px] text-text-muted font-medium">{isAr ? "تواجد LEEE" : "LEEE Presence"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#147DBB] border border-[#0c5a9e]" />
                <span className="text-[10px] text-text-muted font-medium">{isAr ? "محدد" : "Selected"}</span>
              </div>
            </div>
          </div>

          {/* Country detail + list */}
          <div className={cn(
            "lg:col-span-2 space-y-4 transition-all duration-700",
            sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )} style={{ transitionDelay: "400ms" }}>
            {/* Active/hovered country detail */}
            {displayedCountry && (
              <div className="bg-white rounded-2xl border border-surface-tertiary p-6 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-blue" />
                  </div>
                  <h3 className="font-serif text-xl text-text-primary">
                    {isAr ? displayedCountry.nameAr : displayedCountry.nameEn}
                  </h3>
                </div>

                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  {isAr ? displayedCountry.highlightAr : displayedCountry.highlightEn}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-secondary rounded-xl p-4 text-center">
                    <FolderOpen className="w-5 h-5 text-brand-blue mx-auto mb-2" />
                    <p className="font-serif text-2xl text-text-primary">{displayedCountry.programs}</p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider font-medium">
                      {isAr ? "برامج" : "Programs"}
                    </p>
                  </div>
                  <div className="bg-surface-secondary rounded-xl p-4 text-center">
                    <Users className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                    <p className="font-serif text-2xl text-text-primary">{displayedCountry.beneficiaries}</p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider font-medium">
                      {isAr ? "مستفيد" : "Beneficiaries"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Country list */}
            <div className="bg-white rounded-2xl border border-surface-tertiary overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-tertiary bg-surface-secondary/50">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {isAr ? "جميع الدول" : "All Countries"} ({menaCountries.length})
                </p>
              </div>
              <div className="divide-y divide-surface-tertiary/50 max-h-[280px] overflow-y-auto">
                {menaCountries.map((country) => (
                  <button
                    key={country.id}
                    onClick={() => setActiveCountry(country.id)}
                    onMouseEnter={() => setHoveredCountry(country.id)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-start transition-colors hover:bg-surface-secondary/50",
                      activeCountry === country.id && "bg-brand-blue/5"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-medium",
                      activeCountry === country.id ? "text-brand-blue" : "text-text-primary"
                    )}>
                      {isAr ? country.nameAr : country.nameEn}
                    </span>
                    <span className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{country.programs} {isAr ? "برامج" : "prog."}</span>
                      <span className="text-text-muted/50">|</span>
                      <span>{country.beneficiaries}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
