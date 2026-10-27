import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BASE, PLATING_FIGMA, navGroups } from "./catalog";
import PlatingFoundationMap from "./PlatingFoundationMap";
import PlatingBloomStrip from "./PlatingBloomStrip";
import PlatingHeroTitle from "./PlatingHeroTitle";
import "./plating-home.css";

const bloomRows = [
  [
    "round-four",
    "capsule-five",
    "diamond-six",
    "round-eight",
    "serrated-five",
    "capsule-seven",
    "diamond-four",
    "round-six",
    ...Array.from({ length: 10 }, (_, i) => `form-${i + 10}`),
  ],
  ["serrated-eight", ...Array.from({ length: 17 }, (_, i) => `form-${i + 20}`)],
];

export default function PlatingHome() {
  return (
    <div className="pl-home">
      <section className="pl-home-hero">
        <PlatingHeroTitle />
        <p>Taste Buddy의 디자인 시스템, 플레이팅.</p>
        <a className="pl-home-start" href={`${BASE}/getting-started`}>
          시작하기 <ArrowRight size={17} aria-hidden="true" />
        </a>
        <PlatingBloomStrip rows={bloomRows} />
      </section>
      <nav className="pl-home-resources" aria-label="주요 문서">
        {navGroups.filter((group) => group.id !== "getting-started").map(({ label, entry }) => (
          <a href={`${BASE}/${entry}`} key={entry}>
            <PlatingHeroTitle as="span" lines={[label]} />
            <ArrowUpRight size={20} aria-hidden="true" />
          </a>
        ))}
      </nav>
      <PlatingFoundationMap />
      <footer className="pl-home-footer">
        <span>© 2026 Taste Buddy</span>
        <a href={PLATING_FIGMA} target="_blank" rel="noreferrer">
          Figma <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
