import { expect, test } from 'vitest';
import * as THREE from 'three';
import { OBB } from 'three/addons/math/OBB.js';
import { createIce } from './ice';
import { cupVisualFor } from '../../data/cup-size';

test('ice stays within the tapered cup and has separate volumes across sizes and foam depths', () => {
  for (const size of ['Tall', 'Grande', 'Venti', 'Trenta'] as const) {
    for (const foam of [0, .15, .22]) {
      const cup = cupVisualFor(size, 'iced');
      const height = 2.5 * cup.height, top = .78 * cup.width, bottom = .54 * cup.width;
      const surface = height * (.84 - foam * .75);
      const radius = bottom + (top - bottom) * surface / height - .033;
      const cubes = createIce(cup.width, radius, surface, '#be9360');
      const boxes = cubes.map(cube => {
        cube.updateMatrixWorld();
        const position = cube.geometry.getAttribute('position');
        for (let i = 0; i < position.count; i++) {
          const point = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(cube.matrixWorld);
          const wall = bottom + (top - bottom) * point.y / height;
          expect(Math.hypot(point.x, point.z)).toBeLessThan(wall - .018 * cup.width);
        }
        cube.geometry.computeBoundingBox();
        return { bounds: new THREE.Box3().setFromObject(cube), solid: new OBB().fromBox3(cube.geometry.boundingBox!).applyMatrix4(cube.matrixWorld) };
      });
      for (let i = 0; i < boxes.length; i++) {
        expect(boxes[i].bounds.min.y).toBeLessThan(surface);
        expect(boxes[i].bounds.max.y - surface).toBeLessThan(.11 * cup.width);
        for (let j = i + 1; j < boxes.length; j++) expect(boxes[i].solid.intersectsOBB(boxes[j].solid), `${size}/${foam}: ice ${i} overlaps ${j}`).toBe(false);
      }
      cubes.forEach(cube => cube.geometry.dispose());
      cubes[0].material.dispose();
    }
  }
});
