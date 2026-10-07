"""Copy + optimize real fan 奶蛙 assets for tile faces from the local survey dump. See README credits."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
S = sys.argv[1] if len(sys.argv) > 1 else '/workspace/naiwa-survey'
M = S + '/03-miner/files/frog-miner/assets/frog-rare-'; G = S + '/10-gugupeng/files/assets/'
# 18 visually distinct faces from three different sources (frog-miner outfits, gugupeng poses/friends/skins)
TILES = [M + f'{n}.webp' for n in (10, 13, 15, 16, 40, 45, 25, 38, 24, 11)] + [G + f for f in (
  '0a01725bd3bac957.webp', '3cf447de0a6da507.webp', 'naishu-v24-idle.webp', '04fd2f4cbb3eaf15.webp',
  'skins/naiwa-galaxy-shepherd.webp', 'skins/naiwa-night-foreman.webp', 'skins/naidan-caramel-pop.webp', 'skins/naishu-yogurt-punk.webp')]
EXTRA = {'win': G + 'bdde48ade4583f2a.webp', 'lose': G + 'a01bb7af93d35e5c.webp', 'logo': M + '22.webp'}
def clean(p, mx):
  im = Image.open(p).convert('RGBA'); im.thumbnail((900, 900)); a = np.array(im)
  lab, n = ndimage.label(ndimage.binary_closing(a[..., 3] > 20, iterations=3))
  if n > 1:
    sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    a[~ndimage.binary_dilation(lab == np.argmax(sz) + 1, iterations=2), 3] = 0
  im = Image.fromarray(a); im = im.crop(im.getbbox()); im.thumbnail((mx, mx), Image.LANCZOS); return im
for i, p in enumerate(TILES): clean(p, 128).save(f'public/assets/t{i}.webp', 'WEBP', quality=82, method=4)
for k, p in EXTRA.items(): clean(p, 360).save(f'public/assets/{k}.webp', 'WEBP', quality=82, method=4)
print('ok', len(TILES))
