/**
 * Shared pillar accent colors, keyed by pillar slug.
 * Used by program cards (`ProgramCard`) and podcast related-project cards.
 */
export interface PillarAccent {
  bg: string;
  text: string;
  tagBg: string;
  iconColor: string;
  btnBg: string;
  btnHover: string;
}

export const pillarColors: Record<string, PillarAccent> = {
  "humanitarian-aid": {
    bg: "rgba(237, 110, 40, 0.85)", // #ED6E28
    text: "text-orange-600",
    tagBg: "rgba(237, 110, 40, 0.85)",
    iconColor: "text-orange-400",
    btnBg: "bg-orange-500",
    btnHover: "hover:bg-orange-600",
  },
  incubators: {
    bg: "rgba(20, 125, 187, 0.85)", // #147DBB
    text: "text-sky-600",
    tagBg: "rgba(20, 125, 187, 0.85)",
    iconColor: "text-sky-400",
    btnBg: "bg-sky-600",
    btnHover: "hover:bg-sky-700",
  },
  academy: {
    bg: "rgba(63, 172, 73, 0.85)", // #3FAC49
    text: "text-emerald-600",
    tagBg: "rgba(63, 172, 73, 0.85)",
    iconColor: "text-emerald-400",
    btnBg: "bg-emerald-500",
    btnHover: "hover:bg-emerald-600",
  },
  "business-clinic": {
    bg: "rgba(27, 55, 101, 0.85)", // #1B3765
    text: "text-indigo-600",
    tagBg: "rgba(27, 55, 101, 0.85)",
    iconColor: "text-indigo-400",
    btnBg: "bg-indigo-600",
    btnHover: "hover:bg-indigo-700",
  },
  "digital-media-hub": {
    bg: "rgba(222, 24, 129, 0.85)", // #DE1881
    text: "text-pink-600",
    tagBg: "rgba(222, 24, 129, 0.85)",
    iconColor: "text-pink-400",
    btnBg: "bg-pink-500",
    btnHover: "hover:bg-pink-600",
  },
};

export const defaultPillarAccent: PillarAccent = {
  bg: "rgba(20, 125, 187, 0.8)",
  text: "text-brand-blue",
  tagBg: "rgba(20, 125, 187, 0.8)",
  iconColor: "text-brand-blue/50",
  btnBg: "bg-brand-blue",
  btnHover: "hover:bg-brand-blue-dark",
};
