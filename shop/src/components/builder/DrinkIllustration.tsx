import React, { useEffect, useId, useRef, useState } from "react";
import type { DrinkBuild } from "../../data/nutrition";
import snapshot from "../../data/starbucks-us.json";
import "./DrinkAnimation.css";
import useShakeToMix from "./useShakeToMix";
import { isMilkDrink, assumedRecipeMilkMl } from "../../data/drink-recipes";
import { milkServing } from "../../data/milk-splash";
import { cupVisualFor } from "../../data/cup-size";
import SyrupPumps from "./SyrupPumps";

function blend(a: string, b: string, amount: number) {
  const parse = (color: string) => color.startsWith("rgb")
    ? color.match(/[\d.]+/g)!.map(Number)
    : [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
  const first = parse(a);
  const second = parse(b);
  const channels = first.map((value, index) => Math.round(value * (1 - amount) + second[index] * amount));
  return `rgb(${channels.join(",")})`;
}

const ice = [
  { x: 83, y: 116, angle: -18, scale: 1.04 },
  { x: 135, y: 108, angle: 13, scale: 0.94 },
  { x: 181, y: 125, angle: -9, scale: 0.9 },
  { x: 104, y: 162, angle: 24, scale: 0.92 },
  { x: 159, y: 170, angle: -26, scale: 1.03 },
  { x: 113, y: 218, angle: -8, scale: 0.78 },
];

export default function DrinkAnimation({ build, replaySyrup = 0 }: { build: DrinkBuild; replaySyrup?: number }) {
  const id = useId().replace(/:/g, "");
  const base = snapshot.bases.find((item) => item.id === build.base)!;
  const milkAmount = build.milk ? isMilkDrink(build.base) ? assumedRecipeMilkMl(build.base, build.size) : milkServing(build).volume : 0;
  const cupSize = cupVisualFor(build.size, base.form);
  const previous = useRef({ base: build.base, milk: build.milk, amount: milkAmount });
  const [mix, setMix] = useState(0);
  const [pumping, setPumping] = useState(false);
  const recipeKey = JSON.stringify([build.base, build.size, build.milk, milkAmount,
    build.syrup, build.pumps, build.foam, build.foamPortion,
    Object.entries(build.extras || {}).filter(([, quantity]) => quantity > 0).sort(), build.extraPortions, build.roast, build.shotStyle]);
  const [mixedRecipe, setMixedRecipe] = useState("");
  const [stir, setStir] = useState(0);
  useEffect(() => { setMixedRecipe(""); }, [recipeKey]);
  const mixed = mixedRecipe === recipeKey;
  const mixDrink = () => {
    setMixedRecipe(recipeKey);
    setStir((value) => value + 1);
  };
  const motion = useShakeToMix(mixDrink);
  useEffect(() => {
    const old = previous.current;
    if (old.base === build.base && milkAmount > 0 &&
      (old.milk !== build.milk || milkAmount > old.amount)) setMix((value) => value + 1);
    previous.current = { base: build.base, milk: build.milk, amount: milkAmount };
  }, [build.base, build.milk, milkAmount]);

  const extras = Object.entries(build.extras || {}).flatMap(([optionId, quantity]) => {
    const option = snapshot.options.find((item) => item.id === optionId);
    return option && quantity > 0 ? [{ ...option, quantity: quantity * ({ light: .65, regular: 1, extra: 1.5 }[build.extraPortions?.[optionId] || "regular"]) }] : [];
  });
  const syrupDoses: Record<string, number> = {};
  if (build.syrup && build.pumps > 0) syrupDoses[build.syrup] = build.pumps;
  for (const item of extras.filter((option) => option.group === "Syrups")) {
    syrupDoses[item.id] = (syrupDoses[item.id] || 0) + item.quantity;
  }
  const has = (groups: string[]) => extras.some((item) => groups.includes(item.group));
  const matcha = has(["Tea Powders"]);
  const sauces = extras.filter((item) => item.group === "Sauces");
  const chocolate = sauces.some((item) => /Mocha|Chocolate/.test(item.name));
  const fruit = extras.filter((item) => ["Fruit Add-Ins", "Flavored Pearls"].includes(item.group));
  const fruitCount = Math.min(10, Math.ceil(fruit.reduce((sum, item) => sum + item.quantity * 3, 0)));
  const toppingCount = Math.min(18, Math.ceil(extras.filter((item) =>
    ["Topping Options", "Powders"].includes(item.group)).reduce((sum, item) => sum + item.quantity * 5, 0)));
  const whipped = has(["Whipped Cream"]);
  const drizzle = extras.find((item) => ["Drizzle", "Line the Cup"].includes(item.group));
  const foamName = snapshot.options.find((item) => item.id === build.foam)?.name || "";
  const foamColor = /Chocolate|Mocha/.test(foamName) ? "#c6a086" :
    /Matcha|Pistachio/.test(foamName) ? "#d5d7ae" : /Strawberry/.test(foamName) ? "#f0ccca" : "#f6ead5";
  const foamHeight = build.foam ? { light: 17, regular: 30, extra: 43 }[build.foamPortion] : 0;
  const surface = 112;
  const foamTop = surface - foamHeight;
  const rawColor = matcha ? "#849454" : chocolate ? "#543022" : base.color;
  const milkRatio = Math.min(0.76, milkAmount / 230);
  const mixedColor = blend(blend(rawColor, "#eddbc0", milkRatio), foamColor, foamHeight / 225);
  const liquidTop = mixed ? mixedColor : blend(rawColor, "#eddbc0", milkRatio);
  const liquidBottom = mixed ? mixedColor : blend(rawColor, "#e4c9a4", milkRatio * 0.65);
  const url = (name: string) => `url(#${name}-${id})`;
  const toppingY = whipped ? foamTop - 10 : build.foam ? foamTop : surface;

  return (
    <div className={`cup-scene realistic-cup${mixed ? " is-mixed" : ""}${Object.keys(syrupDoses).length ? " has-syrup-bottle" : ""}`} data-mixed={mixed}>
      <svg viewBox={Object.keys(syrupDoses).length ? "-80 0 380 360" : "0 0 300 360"} role="img"
        aria-label={`Animated ${base.name}${build.milk ? " with milk" : ""}${build.foam ? " and cold foam" : ""}${extras.length ? ` with ${extras.length} extra ingredients` : ""}`}>
        <defs>
          <clipPath id={`cup-${id}`}><path d="M61 76 Q150 58 239 76 L217 308 Q150 332 83 308 Z" /></clipPath>
          <linearGradient id={`drink-${id}`} x1="0" y1="0" x2="0.15" y2="1">
            <stop stopColor={liquidTop} /><stop offset=".55" stopColor={liquidBottom} />
            <stop offset="1" stopColor={mixed ? mixedColor : blend(rawColor, "#201108", 0.22)} />
          </linearGradient>
          <linearGradient id={`glass-${id}`}>
            <stop stopColor="#fff" stopOpacity=".65" /><stop offset=".12" stopColor="#fff" stopOpacity=".12" />
            <stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset=".84" stopColor="#fff" stopOpacity=".04" />
            <stop offset=".95" stopColor="#fff" stopOpacity=".4" /><stop offset="1" stopColor="#7a837d" stopOpacity=".15" />
          </linearGradient>
          <linearGradient id={`ice-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff" stopOpacity=".68" /><stop offset=".4" stopColor="#e7f2ec" stopOpacity=".15" />
            <stop offset="1" stopColor="#fff" stopOpacity=".36" />
          </linearGradient>
          <linearGradient id={`foam-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fffaf1" /><stop offset=".5" stopColor={foamColor} />
            <stop offset="1" stopColor={blend(foamColor, rawColor, 0.23)} />
          </linearGradient>
          <radialGradient id={`shadow-${id}`}><stop stopColor="#3a3024" stopOpacity=".2" /><stop offset="1" stopColor="#3a3024" stopOpacity="0" /></radialGradient>
          <linearGradient id={`swirl-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#f6e5c9" stopOpacity=".9" /><stop offset="1" stopColor="#e8cda4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="cup-size-geometry" data-cup-size={build.size} style={{ transform: `translate(150px, 332px) scale(${cupSize.width}, ${cupSize.height}) translate(-150px, -332px)` }}>
        {base.form === 'hot' && <g className="hot-steam" fill="none" stroke="#809186" strokeWidth="2" opacity=".55"><path d="M120 50 Q107 34 120 18 M150 49 Q137 30 150 10 M180 50 Q167 34 180 18" /></g>}
        <ellipse cx="150" cy="332" rx="94" ry="15" fill={url("shadow")} />
        <path d="M61 76 Q150 58 239 76 L217 308 Q150 332 83 308 Z" fill="#fff" fillOpacity=".16" />
        <g clipPath={url("cup")}>
          <path className="drink-body" d={`M60 ${foamTop} Q150 ${foamTop - 14} 240 ${foamTop} V330 H60 Z`} fill={url("drink")} />
          <ellipse className="drink-surface" cx="150" cy={foamTop} rx="88" ry="11" fill={liquidTop} />
          <g className="milk-threads">
          {milkAmount > 0 && <g key={`${build.base}-${mix}`} className={mix ? "cream-cloud cream-cloud-enter" : "cream-cloud"} opacity={0.05 + milkRatio * 0.08}>
            <path d="M100 108 C80 143 159 145 124 186 S161 231 128 280 C174 248 143 218 166 189 S107 141 142 109 Z" fill={url("swirl")} />
            <path d="M171 109 C151 137 201 157 176 192 S189 241 165 263 C210 224 180 216 204 179 S165 138 192 111 Z" fill={url("swirl")} />
          </g>}
          </g>
          {base.hasIce && ice.map((cube, index) => <g key={index} transform={`translate(${cube.x} ${cube.y}) rotate(${cube.angle} 21 20) scale(${cube.scale})`}>
            <g className={stir ? "natural-ice ice-stir" : mix ? "natural-ice ice-settle" : "natural-ice"} key={`${mix}-${stir}`} style={{ animationDelay: `${index * 35}ms` }}>
              <path d="M7 1 L34 3 Q42 4 42 12 L39 34 Q38 41 30 41 L6 37 Q0 36 1 27 L2 8 Q2 2 7 1 Z" fill={url("ice")} stroke="#fff" strokeOpacity=".32" strokeWidth=".8" />
              <path d="M7 6 L31 7 M6 8 L5 26 M12 31 L29 34 L34 25" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M13 13 L23 19 L18 29 M23 19 L33 16" fill="none" stroke="#fff" strokeOpacity=".15" strokeWidth=".7" />
            </g>
          </g>)}
          {Array.from({ length: fruitCount }, (_, index) => <ellipse key={`fruit-${index}`} className="mix-in" cx={94 + ((index * 39) % 112)} cy={177 + ((index * 47) % 110)} rx={5 + index % 3} ry={4 + index % 2} fill="#af4e61" stroke="#e99c9c" strokeWidth=".8" />)}
          {build.foam && <g className="foam-mixing-layer"><g className="natural-foam">
            <path d={`M60 ${foamTop} Q150 ${foamTop - 16} 240 ${foamTop} L240 ${surface} Q204 ${surface + 7} 168 ${surface + 3} T60 ${surface + 1} Z`} fill={url("foam")} />
            <ellipse cx="150" cy={foamTop} rx="89" ry="10" fill={foamColor} />
            <ellipse cx="143" cy={foamTop - 2} rx="67" ry="5" fill="#fff" opacity=".16" />
            {Array.from({ length: 30 }, (_, index) => <circle key={index} cx={75 + ((index * 37) % 150)} cy={foamTop - 4 + ((index * 13) % 10)} r={0.55 + (index % 4) * 0.35} fill="#fff" opacity={0.18 + index % 3 * 0.1} />)}
          </g></g>}
          {whipped && <path className="whipped-layer" d={`M78 ${foamTop + 3} Q78 ${foamTop - 7} 100 ${foamTop - 11} Q91 ${foamTop - 20} 121 ${foamTop - 23} Q144 ${foamTop - 26} 144 ${foamTop - 36} Q172 ${foamTop - 28} 173 ${foamTop - 20} Q201 ${foamTop - 20} 200 ${foamTop - 9} Q218 ${foamTop - 7} 222 ${foamTop + 3} Q150 ${foamTop + 18} 78 ${foamTop + 3} Z`} fill={url("foam")} stroke="#fff5e6" strokeWidth="1.5" />}
          {drizzle && <path className="drizzle-layer" d={`M88 ${toppingY} Q111 ${toppingY - 10} 131 ${toppingY} T176 ${toppingY} T212 ${toppingY} M97 ${toppingY + 5} Q127 ${toppingY - 1} 150 ${toppingY + 6} T204 ${toppingY + 5}`} fill="none" stroke={/Mocha|Chocolate/.test(drizzle.name) ? "#603a28" : "#b87a37"} strokeWidth="2.6" strokeLinecap="round" />}
          {Array.from({ length: toppingCount }, (_, index) => <ellipse className="topping-dot mix-in" key={index} cx={88 + ((index * 31) % 125)} cy={toppingY - 4 + ((index * 7) % 10)} rx={1.2 + index % 3 * 0.5} ry="1.2" fill="#6d4630" />)}
          <path d="M61 76 Q150 58 239 76 L217 308 Q150 332 83 308 Z" fill={url("glass")} />
          <path d="M71 97 L90 298" stroke="#fff" strokeOpacity=".38" strokeWidth="3" strokeLinecap="round" />
          <path d="M226 102 L210 296" stroke="#fff" strokeOpacity=".24" strokeWidth="1.5" strokeLinecap="round" />
          {Array.from({ length: 17 }, (_, index) => <ellipse key={`dew-${index}`} cx={76 + ((index * 43) % 146)} cy={147 + ((index * 31) % 151)} rx={1 + index % 3 * 0.6} ry={1.7 + index % 3 * 0.7} fill="#fff" fillOpacity=".17" stroke="#fff" strokeOpacity=".22" strokeWidth=".5" />)}
        </g>
        <SyrupPumps base={build.base} doses={syrupDoses} surface={foamTop} clip={url("cup")} replay={replaySyrup} onActivityChange={setPumping} />
        <path d="M61 76 L83 308 Q150 332 217 308 L239 76" fill="none" stroke="#a7b1a7" strokeOpacity=".55" strokeWidth="1.2" />
        <ellipse cx="150" cy="76" rx="89" ry="12" fill="none" stroke="#d5ddd3" strokeWidth="3.5" />
        <path d="M61 75 A89 12 0 0 0 239 75" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.4" />
        <path d="M86 309 Q150 331 214 309" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
        </g>
      </svg>
      <span className="cup-caption">{build.size} · {cupSize.flOz} fl oz · {base.name}</span>
      {pumping && <p className="syrup-animation-status" role="status">Adding syrup · pump by pump</p>}
      <div className="mix-controls">
        <button type="button" onClick={mixDrink}>Mix drink</button>
        {motion.status === "on" ? (
          <button type="button" onClick={motion.disable}>Turn off shake</button>
        ) : (
          <button type="button" onClick={motion.enable} disabled={motion.status === "asking"}>
            {motion.status === "asking" ? "Enabling…" : "Enable shake"}
          </button>
        )}
      </div>
      <p className="mix-hint" role="status">
        {motion.status === "denied" ? "Motion access wasn’t allowed. You can still tap Mix drink." :
          motion.status === "unavailable" ? "Motion sensing isn’t available here. Tap Mix drink instead." :
          motion.status === "on" ? "Shake gently to mix, or tap Mix drink." : "Tap to mix, or enable shake on your phone."}
      </p>
      <span className="mix-result" role="status">{mixed ? "Mixed — your drink is blended." : ""}</span>
    </div>
  );
}
