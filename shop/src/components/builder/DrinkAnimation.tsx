import React, { lazy, Suspense, useEffect, useState } from 'react';
import type { DrinkBuild } from '../../data/nutrition';
import snapshot from '../../data/starbucks-us.json';
import { cupVisualFor } from '../../data/cup-size';
import DrinkIllustration from './DrinkIllustration';
import useShakeToMix from './useShakeToMix';
import './DrinkAnimation.css';

const DrinkScene = lazy(() => import('./DrinkScene'));
export default function DrinkAnimation({build,replaySyrup=0}:{build:DrinkBuild;replaySyrup?:number}) {
  const [webgl,setWebgl]=useState(()=>typeof window!=='undefined' && typeof window.WebGL2RenderingContext!=='undefined');
  const [expanded,setExpanded]=useState(false);
  const [mixToken,setMixToken]=useState(0),[mixedRecipe,setMixedRecipe]=useState(''),[activity,setActivity]=useState('');
  const key=JSON.stringify(build),base=snapshot.bases.find(base=>base.id===build.base)!;
  const cup=cupVisualFor(build.size,base.form);
  const mix=()=>{setMixToken(token=>token+1);setMixedRecipe(key);};
  const motion=useShakeToMix(mix);
  useEffect(()=>{setMixedRecipe('');},[key]);
  if(!webgl)return <DrinkIllustration build={build} replaySyrup={replaySyrup}/>;
  return <div className={`cup-scene three-cup${mixedRecipe===key?' is-mixed':''}${expanded?' cup-expanded':''}`}  data-mixed={mixedRecipe===key}>
    <div className="drink-viewport" role="img" aria-label={`Animated ${base.name}${build.milk?' with milk':''}${build.foam?' and cold foam':''}`}>
      <Suspense fallback={<div className="cup-loading" role="status">Preparing your cup…</div>}>
        <DrinkScene build={build} mixToken={mixToken} replaySyrup={replaySyrup} onActivity={setActivity} onUnavailable={()=>setWebgl(false)}/>
      </Suspense>
    </div>
    <button type="button" className="cup-expand" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'Compact cup':'Enlarge cup'}</button>
    <span className="cup-caption">{build.size} · {cup.flOz} fl oz · {base.name}</span>
    <p className="pour-status" role="status">{activity||'Drag the cup to look around'}</p>
    <div className="mix-controls"><button type="button" onClick={mix}>Mix drink</button>{motion.status==='on'?<button type="button" onClick={motion.disable}>Turn off shake</button>:<button type="button" onClick={motion.enable} disabled={motion.status==='asking'}>{motion.status==='asking'?'Enabling…':'Enable shake'}</button>}</div>
    <p className="mix-hint" role="status">{motion.status==='denied'?'Motion access wasn’t allowed. You can still tap Mix drink.':motion.status==='unavailable'?'Motion sensing isn’t available here. Tap Mix drink instead.':motion.status==='on'?'Shake gently to mix, or tap Mix drink.':'Tap to mix, or enable shake on your phone.'}</p>
    <span className="mix-result" role="status">{mixedRecipe===key?'Mixed — your drink is blended.':''}</span>
  </div>;
}
