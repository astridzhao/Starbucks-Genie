import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createIce(width: number, liquidRadius: number, surface: number, drinkColor: string) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xdce9e5, transparent: true, opacity: .58, depthWrite: true,
    roughness: .16, ior: 1.31, clearcoat: .8, clearcoatRoughness: .12,
    envMapIntensity: .35,
  });
  // Drink-coloured attenuation below the waterline keeps submerged ice
  // visible without turning it into bright white shapes on the drink surface.
  material.onBeforeCompile = shader => {
    shader.uniforms.iceSurface = { value: surface };
    shader.uniforms.iceDrinkColor = { value: new THREE.Color(drinkColor) };
    shader.vertexShader = 'varying float iceWorldY;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\niceWorldY = (modelMatrix * vec4(transformed, 1.)).y;');
    shader.fragmentShader = 'uniform float iceSurface; uniform vec3 iceDrinkColor; varying float iceWorldY;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float submerged = 1. - smoothstep(iceSurface - .025, iceSurface + .025, iceWorldY);
      float iceEdge = pow(1. - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.);
      diffuseColor.rgb = mix(diffuseColor.rgb, iceDrinkColor, submerged * .82);
      diffuseColor.a *= mix(.28, 1., iceEdge) * mix(1., .65, submerged);`);
  };
  material.customProgramCacheKey = () => 'submerged-ice-v1';
  return Array.from({ length: 8 }, (_, i) => {
    const w = (.235 + (i % 3) * .009) * width;
    const h = (.28 + (i % 2) * .018) * width;
    const d = (.24 + (i % 4) * .006) * width;
    const cube = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, .035 * width), material);
    const ring = (liquidRadius - .24 * width) * (i % 2 ? .97 : 1);
    const angle = (i / 6) * Math.PI * 2 + .18 + (i % 2 ? .025 : -.025);
    cube.rotation.set(.10 + (i % 3) * .045, .36 * (i % 3 - 1), .10 * (i % 2 ? 1 : -1));
    // Six separated pieces around the perimeter, one centre piece, one lower
    // in the drink. Only the rounded upper shoulders protrude above the liquid.
    cube.position.set(i < 6 ? Math.cos(angle) * ring : 0,
      surface - (i === 7 ? .48 : .105 + (i % 3) * .008) * width,
      i < 6 ? Math.sin(angle) * ring : 0);
    cube.userData.home = cube.position.clone();
    cube.userData.rotation = cube.rotation.clone();
    return cube;
  });
}
