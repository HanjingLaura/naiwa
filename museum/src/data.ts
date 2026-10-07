import raw from './exhibits.json';
export interface Exhibit { id: string; hall: string; name: string; desc: string; game: string; w: number; h: number; tags: string[]; model?: string }
export interface Hall { id: string; name: string; icon: string; blurb: string; color: string }
export const HALLS: Hall[] = [
  { id: 'photo', name: '奶蛙影像馆', icon: '📷', blurb: '镇馆之宝：奶蛙的电影感影像：深海、雨夜、云端、盐湖、水母地铁……', color: '#3b4a6b' },
  { id: 'art', name: '奶蛙名画馆', icon: '🖼️', blurb: '当奶蛙走进名画：蒙娜丽莎、珍珠耳环、最后的晚餐，还有清明上河图。', color: '#9a5b2e' },
  { id: 'costume', name: '服装造型馆', icon: '👗', blurb: '修女、医生、朋克、绅士……奶蛙的衣柜比你想的还大。', color: '#e0708c' },
  { id: 'pose', name: '动作姿势馆', icon: '🤸', blurb: '跳、滚、晕、笑——咕咕碰赛场上的每一个高光瞬间。', color: '#4a9be0' },
  { id: 'postcard', name: '旅行明信片馆', icon: '✉️', blurb: '奶蛙出门旅行寄回来的明信片和纪念品。', color: '#6fb53a' },
  { id: 'model', name: '3D 模型馆', icon: '🧊', blurb: '可以拖动旋转的 3D 奶蛙和礼物模型。', color: '#8a6bd6' },
  { id: 'fx', name: '特效道具馆', icon: '✨', blurb: '飞溅的牛奶、星星、冰块、水果和各种小道具。', color: '#e2a31d' },
];
export const GAMES: Record<string, { name: string; url: string }> = raw.games;
export const EXHIBITS: Exhibit[] = raw.exhibits as Exhibit[];
export const byHall = (h: string) => EXHIBITS.filter(e => e.hall === h);
/** case-insensitive search across name, description, hall name, tags and source game */
export function search(q: string, list: Exhibit[] = EXHIBITS): Exhibit[] {
  const t = q.trim().toLowerCase(); if (!t) return list;
  const words = t.split(/\s+/);
  return list.filter(e => {
    const hay = [e.name, e.desc, e.tags.join(' '), HALLS.find(h => h.id === e.hall)?.name, GAMES[e.game]?.name].join(' ').toLowerCase();
    return words.every(w => hay.includes(w));
  });
}
export function tagsOf(list: Exhibit[]): string[] { const s = new Map<string, number>(); list.forEach(e => e.tags.forEach(t => s.set(t, (s.get(t) || 0) + 1))); return [...s.keys()]; }
