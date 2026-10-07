import { describe, it, expect } from 'vitest';
import { EXHIBITS, HALLS, GAMES, search, byHall } from '../src/data';
import { existsSync } from 'fs';
describe('museum data', () => {
  it('every hall has exhibits and photo hall has the 7 photos', () => {
    for (const h of HALLS) expect(byHall(h.id).length).toBeGreaterThan(0);
    expect(byHall('photo').length).toBe(15); expect(byHall('art').length).toBe(21);
  });
  it('every exhibit has name, description, known source game, and its image files', () => {
    const ids = new Set<string>();
    for (const e of EXHIBITS) {
      expect(ids.has(e.id)).toBe(false); ids.add(e.id);
      expect(e.name.length).toBeGreaterThan(0); expect(e.desc.length).toBeGreaterThan(4);
      expect(GAMES[e.game]).toBeTruthy();
      if (e.model) { expect(existsSync('public/' + e.model)).toBe(true); expect(existsSync('public/models/Textures/colormap.png')).toBe(true); expect(existsSync(`public/ex/${e.id}-t.webp`)).toBe(true); }
      else { expect(existsSync(`public/ex/${e.id}.webp`)).toBe(true); expect(existsSync(`public/ex/${e.id}-t.webp`)).toBe(true); }
    }
  });
  it('every non-photo exhibit credits a source game with a link', () => {
    for (const e of EXHIBITS.filter(x => x.game !== 'photo')) expect(GAMES[e.game].url).toMatch(/^https:\/\//);
  });
  it('search matches name, tags, hall and game; multi-word AND', () => {
    expect(search('朋克').some(e => e.name.includes('朋克'))).toBe(true);
    expect(search('明信片').length).toBeGreaterThan(10);
    expect(search('咕咕碰').every(e => e.game === 'gugupeng')).toBe(true);
    expect(search('奶鼠 晕').every(e => (e.name + e.desc + e.tags).includes('奶鼠'))).toBe(true);
    expect(search('').length).toBe(EXHIBITS.length);
    expect(search('不存在的东西xyz').length).toBe(0);
  });
});
