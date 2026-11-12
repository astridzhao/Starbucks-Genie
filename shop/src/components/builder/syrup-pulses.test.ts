import { syrupPulses } from './syrup-pulses';
test('increasing syrup animates only added whole pumps; decreasing and unrelated changes do not replay', () => {
  expect(syrupPulses({ '111': 1 }, { '111': 3 })).toEqual(['111', '111']);
  expect(syrupPulses({ '111': 3 }, { '111': 1 })).toEqual([]);
  expect(syrupPulses({ '111': 3 }, { '111': 3 })).toEqual([]);
});
test('changing flavor preserves the new bottle identity and replay includes every selected flavor', () => {
  expect(syrupPulses({ '111': 2 }, { '96': 2 })).toEqual(['96', '96']);
  expect(syrupPulses({ '111': 2, '96': 1 }, { '111': 2, '96': 1 }, true)).toEqual(['111', '111', '96']);
  expect(syrupPulses({}, { '111': 2 }, false, true)).toEqual([]);
});
