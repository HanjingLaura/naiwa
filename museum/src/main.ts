import './style.css';
import { HALLS, GAMES, EXHIBITS, byHall, search, tagsOf, Exhibit } from './data';

const BASE = import.meta.env.BASE_URL;
const img = (e: Exhibit, thumb = true) => `${BASE}ex/${e.id}${thumb ? '-t' : ''}.webp`;
const view = document.getElementById('view')!, lb = document.getElementById('lb')!, q = document.getElementById('q') as HTMLInputElement;
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const thumbFor = (e: Exhibit) => e.model ? `${BASE}ex/${e.id}-t.webp` : img(e);
const GAME_LINKS = [
  { name: '奶娃纸牌', sub: '蜘蛛纸牌 · 1/2/4 花色', href: '/naiwa/spider-solitaire/', pic: 'costume' },
  { name: '奶蛙扫雷', sub: '经典扫雷 · 初级/中级/高级', href: '/naiwa/minesweeper/', pic: 'pose' },
  { name: '奶了个蛙', sub: '三消堆叠 · 7 格槽位', href: '/naiwa/nailegewa/', pic: 'costume' },
  { name: '奶蛙打地鼠', sub: '60 秒 · 连击 · 金奶蛙', href: '/naiwa/whack/', pic: 'pose' },
];
document.getElementById('links')!.innerHTML = HALLS.map(h => `<a href="#/hall/${h.id}">${h.icon}<span>${h.name.replace('奶蛙', '').replace('馆', '')}</span></a>`).join('') + `<a href="#/games">🎮<span>游戏厅</span></a>`;

function card(e: Exhibit, list: Exhibit[]) {
  const ratio = ['photo', 'art', 'postcard'].includes(e.hall) ? `${e.w}/${e.h}` : '1/1';
  return `<button class="ex ${e.hall}" data-id="${e.id}" data-list="${list === EXHIBITS ? '' : ''}">
    <div class="pic" style="aspect-ratio:${ratio}"><img loading="lazy" src="${thumbFor(e)}" alt="${esc(e.name)}"/>${e.model ? '<span class="badge">3D</span>' : ''}</div>
    <div class="cap"><b>${esc(e.name)}</b><small>${esc(GAMES[e.game].name)}</small></div></button>`;
}
let current: Exhibit[] = [];
function grid(list: Exhibit[]) { current = list; return `<div class="grid">${list.map(e => card(e, list)).join('')}</div>`; }

function entrance() {
  const photos = byHall('photo');
  view.innerHTML = `
  <section class="hero">
    <div class="hero-txt"><h1>欢迎来到<br/>奶蛙博物馆</h1><p>一座收藏了 ${EXHIBITS.length} 件奶蛙展品的小小博物馆。<br/>先去影像馆看看镇馆之宝，再顺着地图逛完七个展厅吧。</p>
    <a class="cta" href="#/hall/photo">进入影像馆 →</a></div>
    <div class="hero-pics">${photos.slice(0, 5).map((e, i) => `<img class="hp hp${i}" src="${img(e)}" alt="${esc(e.name)}" data-id="${e.id}"/>`).join('')}</div>
  </section>
  <section><h2 class="sec">🗺️ 展厅地图</h2><div class="map">
    ${HALLS.map((h, i) => { const first = byHall(h.id)[0]; return `<a class="room r${i}" href="#/hall/${h.id}" style="--c:${h.color}">
      <img src="${thumbFor(first)}" alt=""/><div><b>${h.icon} ${h.name}</b><small>${byHall(h.id).length} 件展品</small><p>${h.blurb}</p></div></a>`; }).join('')}
    <a class="room games" href="#/games" style="--c:#c0392b"><div><b>🎮 奶蛙游戏厅</b><small>${GAME_LINKS.length} 个小游戏</small><p>逛累了？来玩一局奶蛙纸牌或奶蛙扫雷。</p></div></a>
  </div></section>
  <section><h2 class="sec">📷 影像馆精选</h2>${grid(photos.slice(0, 8))}<p class="more"><a href="#/hall/photo">查看全部 ${photos.length} 张 →</a></p></section>
  <section><h2 class="sec">🖼️ 名画馆精选</h2>${grid(byHall('art').slice(0, 6))}<p class="more"><a href="#/hall/art">查看全部 ${byHall('art').length} 幅 →</a></p></section>`;
}
function hall(id: string) {
  const h = HALLS.find(x => x.id === id); if (!h) return entrance();
  const all = byHall(id); const tags = tagsOf(all).filter(t => all.some(e => !e.tags.includes(t)));
  const render = (tag: string) => { const l = tag ? all.filter(e => e.tags.includes(tag)) : all; document.getElementById('hg')!.innerHTML = grid(l); };
  view.innerHTML = `<section class="hallhead" style="--c:${h.color}"><a href="#/" class="back">← 返回大厅</a><h1>${h.icon} ${h.name}</h1><p>${h.blurb}</p>
    ${tags.length ? `<div class="chips"><button class="chip on" data-t="">全部 ${all.length}</button>${tags.map(t => `<button class="chip" data-t="${t}">${t}</button>`).join('')}</div>` : ''}</section><div id="hg"></div>`;
  render('');
  view.querySelectorAll<HTMLButtonElement>('.chip').forEach(c => c.onclick = () => { view.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c)); render(c.dataset.t!); });
}
function games() {
  view.innerHTML = `<section class="hallhead" style="--c:#c0392b"><a href="#/" class="back">← 返回大厅</a><h1>🎮 奶蛙游戏厅</h1><p>博物馆自营的奶蛙小游戏，手机电脑都能玩。</p></section>
  <div class="games-grid">${GAME_LINKS.map(g => { const e = byHall(g.pic)[[14, 4, 21, 33][GAME_LINKS.indexOf(g)]]; return `<a class="game" href="${g.href}"><img src="${thumbFor(e)}" alt=""/><div><b>${g.name}</b><small>${g.sub}</small><span>开始游戏 →</span></div></a>`; }).join('')}</div>
  <h2 class="sec">奶蛙展品来自这些粉丝游戏</h2><ul class="srcs">${Object.entries(GAMES).filter(([, g]) => g.url).map(([, g]) => `<li><a href="${g.url}" target="_blank" rel="noopener">${g.name}</a></li>`).join('')}</ul>`;
}
function credits() {
  view.innerHTML = `<section class="hallhead" style="--c:#6b4600"><a href="#/" class="back">← 返回大厅</a><h1>致谢与来源</h1>
  <p>本馆是非商业的粉丝作品。除影像馆照片由 Laura 提供外，其余展品均取自下列奶蛙粉丝游戏，版权归各自作者所有，本站不拥有这些素材。如有侵权请联系下架。</p></section>
  <table class="credits"><tr><th>来源</th><th>展品数</th></tr>${Object.entries(GAMES).map(([k, g]) => `<tr><td>${g.url ? `<a href="${g.url}" target="_blank" rel="noopener">${g.name}</a>` : g.name}</td><td>${EXHIBITS.filter(e => e.game === k).length}</td></tr>`).join('')}</table>`;
}
function results(s: string) {
  const r = search(s);
  view.innerHTML = `<section class="hallhead" style="--c:#4a9be0"><a href="#/" class="back">← 返回大厅</a><h1>🔍 “${esc(s)}”</h1><p>找到 ${r.length} 件展品</p></section>${r.length ? grid(r) : '<p class="empty">没找到…换个词试试，比如「朋克」「旅行」「晕」。</p>'}`;
}
function route() {
  closeLB(); const h = location.hash.slice(1) || '/'; const [, a, b] = h.split('/');
  if (a === 'hall') hall(b); else if (a === 'games') games(); else if (a === 'credits') credits();
  else if (a === 'search') { const s = decodeURIComponent(b || ''); q.value = s; results(s); } else entrance();
  document.querySelectorAll('#links a').forEach(x => x.classList.toggle('on', (x as HTMLAnchorElement).hash === '#' + h));
  if (!h.startsWith('/search')) window.scrollTo(0, 0);
  const m = new URLSearchParams(location.search).get('open'); if (m) openLB(m);
}
// ---------- lightbox ----------
let lbIdx = -1; let disposeViewer: (() => void) | null = null;
async function openLB(id: string) {
  if (!current.some(e => e.id === id)) current = EXHIBITS;
  lbIdx = current.findIndex(e => e.id === id); if (lbIdx < 0) return;
  const e = current[lbIdx]; const g = GAMES[e.game]; const hallName = HALLS.find(h => h.id === e.hall)!.name;
  disposeViewer?.(); disposeViewer = null;
  lb.hidden = false; document.body.classList.add('noscroll');
  lb.innerHTML = `<div class="lbx ${e.hall}" role="dialog" aria-label="${esc(e.name)}">
    <button class="x" aria-label="关闭">✕</button>
    <div class="stage">${e.model ? `<div class="three" id="three"><p class="loading">3D 模型加载中…</p></div>` : `<img src="${img(e, false)}" alt="${esc(e.name)}" style="aspect-ratio:${e.w}/${e.h}"/>`}
      <button class="nav prev" aria-label="上一件">‹</button><button class="nav next" aria-label="下一件">›</button></div>
    <div class="info"><small>${hallName} · ${lbIdx + 1}/${current.length}</small><h2>${esc(e.name)}</h2><p>${esc(e.desc)}</p>
      <p class="src">来源：${g.url ? `<a href="${g.url}" target="_blank" rel="noopener">${g.name} ↗</a>` : g.name}</p>${e.model ? '<p class="hint">拖动旋转 · 双指/滚轮缩放</p>' : ''}</div></div>`;
  lb.querySelector('.x')!.addEventListener('click', closeLB);
  lb.querySelector('.prev')!.addEventListener('click', ev => { ev.stopPropagation(); step(-1); });
  lb.querySelector('.next')!.addEventListener('click', ev => { ev.stopPropagation(); step(1); });
  if (e.model) { const { mountViewer } = await import('./viewer'); const el = document.getElementById('three'); if (el) { el.querySelector('.loading')?.remove(); disposeViewer = mountViewer(el, BASE + e.model); } }
}
function step(d: number) { if (lbIdx < 0) return; openLB(current[(lbIdx + d + current.length) % current.length].id); }
function closeLB() { disposeViewer?.(); disposeViewer = null; lb.hidden = true; lb.innerHTML = ''; lbIdx = -1; document.body.classList.remove('noscroll'); }
lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
let sx = 0; lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => { if ((e.target as HTMLElement).closest('.three')) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') closeLB(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
view.addEventListener('click', e => { const t = (e.target as HTMLElement).closest('[data-id]') as HTMLElement | null; if (t) openLB(t.dataset.id!); });
let qt = 0; q.addEventListener('input', () => { clearTimeout(qt); qt = window.setTimeout(() => { location.hash = q.value.trim() ? '#/search/' + encodeURIComponent(q.value.trim()) : '#/'; }, 250); });
addEventListener('hashchange', route);
(window as any).__museum = { openLB, EXHIBITS };
route();
