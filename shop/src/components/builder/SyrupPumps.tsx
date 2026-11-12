import { syrupPulses } from './syrup-pulses';
import React, { useEffect, useId, useRef, useState } from "react";
import snapshot from "../../data/starbucks-us.json";

type Props = {
  base: string;
  doses: Record<string, number>;
  surface: number;
  clip: string;
  replay: number;
  onActivityChange: (playing: boolean) => void;
};
type Pulse = { amount: number; flavor: string };

export default function SyrupPumps({ base, doses, surface, clip, replay, onActivityChange }: Props) {
  const id = useId().replace(/:/g, "");
  const signature = JSON.stringify(Object.entries(doses).filter(([, amount]) => amount > 0).sort());
  const previous = useRef({ base, doses, replay });
  const [batch, setBatch] = useState({ serial: 0, pulses: [] as Pulse[] });
  const [activeFlavor, setActiveFlavor] = useState("");
  useEffect(() => {
    const old = previous.current;
    const currentDoses = Object.fromEntries(JSON.parse(signature)) as Record<string, number>;
    previous.current = { base, replay, doses: currentDoses };
    const pulses: Pulse[] = syrupPulses(old.doses, currentDoses, replay !== old.replay, old.base !== base).map(flavor => ({ amount: 1, flavor }));
    setBatch((last) => ({ serial: last.serial + 1, pulses }));
    setActiveFlavor(pulses[0]?.flavor || Object.keys(currentDoses)[0] || "");
    onActivityChange(pulses.length > 0);
    if (!pulses.length) return;
    const timers = pulses.slice(1).map((pulse, index) => window.setTimeout(
      () => setActiveFlavor(pulse.flavor), (index + 1) * 1000,
    ));
    timers.push(window.setTimeout(() => {
      setBatch((last) => ({ ...last, pulses: [] }));
      onActivityChange(false);
    }, pulses.length * 1000 + 1600));
    return () => { timers.forEach(window.clearTimeout); onActivityChange(false); };
  }, [base, signature, replay, onActivityChange]);

  if (signature === "[]") return null;
  const flavorId = doses[activeFlavor] > 0 ? activeFlavor : Object.keys(doses).find((key) => doses[key] > 0);
  const flavorName = snapshot.options.find((option) => option.id === flavorId)?.name.replace(/ Syrup$/i, "") || "Coffee";
  const sugarFree = /Sugar-Free/i.test(flavorName);
  const label = flavorName.replace(/Sugar-Free\s*/i, "").toUpperCase();
  const syrupColor = /Caramel|Brown Sugar/i.test(flavorName) ? "#b77b32" :
    /Hazelnut|Toffee/i.test(flavorName) ? "#ac743c" : "#d4a85e";
  const bottlePath = "M-26 83 H0 V108 C0 121 24 120 24 142 V299 Q24 315 9 315 H-36 Q-52 315 -52 299 V142 C-52 120 -26 121 -26 108 Z";
  const paint = (name: string) => `url(#syrup-${name}-${id})`;

  return (
    <g className="syrup-pumps" aria-hidden="true">
      <defs>
        <linearGradient id={`syrup-glass-${id}`}>
          <stop stopColor="#f6dfaf" stopOpacity=".8" />
          <stop offset=".18" stopColor="#fff6df" stopOpacity=".35" />
          <stop offset=".65" stopColor="#d3a969" stopOpacity=".08" />
          <stop offset="1" stopColor="#99632c" stopOpacity=".4" />
        </linearGradient>
        <linearGradient id={`syrup-liquid-${id}`}>
          <stop stopColor="#a67536" />
          <stop offset=".24" stopColor={syrupColor} />
          <stop offset=".6" stopColor="#e1b870" />
          <stop offset="1" stopColor="#b08242" />
        </linearGradient>
        <clipPath id={`syrup-bottle-${id}`}><path d={bottlePath} /></clipPath>
      </defs>
      <g className="syrup-bottle" data-flavor={flavorId}>
        <ellipse cx="-14" cy="326" rx="43" ry="5" fill="#5b4526" opacity=".12" />
        <path d={bottlePath} fill="#fbf1d9" fillOpacity=".35" stroke="#b4986b" strokeWidth="1.2" />
        <g clipPath={`url(#syrup-bottle-${id})`}>
          <path d="M-53 150 Q-14 156 25 150 V317 H-53 Z" fill={paint("liquid")} />
          <ellipse cx="-14" cy="151" rx="39" ry="4" fill="#edcc91" opacity=".65" />
          <path d="M-12 85 V301" stroke="#f7e8c6" strokeWidth="4" opacity=".45" />
          <path d={bottlePath} fill={paint("glass")} />
          <path d="M-39 143 V294" stroke="#fff7dc" strokeWidth="4" strokeLinecap="round" opacity=".65" />
          <path d="M15 151 V293" stroke="#fff4d2" strokeWidth="1.4" strokeLinecap="round" opacity=".4" />
        </g>
        <path d="M-43 302 Q-14 311 16 302" fill="none" stroke="#f4d69d" strokeWidth="2" />
        <rect x="-45" y="185" width="62" height="78" rx="3" fill="#faf4e6" stroke="#dccbad" strokeWidth=".8" />
        <path d="M-45 192 H17 M-45 255 H17" stroke="#c0a678" strokeWidth=".7" />
        <circle cx="-14" cy="205" r="6" fill="#315744" />
        <path d="M-17 205 H-11 M-14 202 V208" stroke="#f6edda" strokeWidth="1" strokeLinecap="round" />
        <text x="-14" y="222" textAnchor="middle" fontSize="8" fontWeight="700" fill="#31513b"
          textLength={label.length > 8 ? 53 : undefined} lengthAdjust="spacingAndGlyphs">{label}</text>
        <text x="-14" y="235" textAnchor="middle" fontSize="7" letterSpacing="1.2" fill="#886333">SYRUP</text>
        <text x="-14" y="248" textAnchor="middle" fontSize="4.5" letterSpacing=".5" fill="#8c816a">{sugarFree ? "SUGAR FREE" : "COFFEE COLLECTION"}</text>
        <rect x="-31" y="73" width="36" height="13" rx="3" fill="#243f32" />
        {[-26, -20, -14, -8, -2].map((x) => <path key={x} d={`M${x} 76 V83`} stroke="#6e8773" strokeWidth="1" />)}
        <path d="M-13 73 V48" stroke="#d6d7c9" strokeWidth="7" />
        <path d="M-15 72 V49" stroke="#fffaf0" strokeWidth="1.5" />
        <g key={batch.serial} className={batch.pulses.length ? "pump-handle" : undefined}
          style={{ animationIterationCount: batch.pulses.length }}>
          <path d="M-35 33 Q-35 28 -30 28 H9 Q14 28 14 34 V37 L94 41 Q104 41 104 49 V53 H96 V50 L13 46 H-30 Q-35 46 -35 41 Z"
            fill="#243f32" stroke="#182f24" strokeWidth="1" />
          <path d="M-30 31 H7 M18 40 L92 44" fill="none" stroke="#789282" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>
      {batch.pulses.map(({ amount, flavor }, index) => (
        <g key={`${batch.serial}-${index}`} className="syrup-pulse" data-amount={amount} data-flavor={flavor}
          style={{ "--pump-delay": `${index * 1000}ms`, "--pump-distance": `${surface - 62}px` } as React.CSSProperties}>
          <g className="syrup-dose" style={{ opacity: 0 }}>
            <path d={`M100 55 Q${91 - amount * 2} ${62 + amount * 2} 100 ${65 + amount * 14} Q${109 + amount * 2} ${62 + amount * 2} 100 55 Z`} fill="#bc7f30" fillOpacity=".9" />
            <path d="M97 62 L97 67" stroke="#ffe3ad" strokeOpacity=".7" strokeWidth="1" strokeLinecap="round" />
          </g>
          <g clipPath={clip}>
            <ellipse className="syrup-ripple" cx="100" cy={surface} rx="9" ry="3" fill="none" stroke="#d7ad73" strokeWidth="2" />
            <path className="syrup-diffusion" d={`M94 ${surface} C83 ${surface + 17} 116 ${surface + 23} 92 ${surface + 45} Q106 ${surface + 61} 104 ${surface + 79} Q125 ${surface + 43} 110 ${surface + 24} L106 ${surface} Z`} fill="#c19355" />
          </g>
        </g>
      ))}
    </g>
  );
}
