"""Copy + optimize real fan 奶蛙 assets for tile faces from the local survey dump. See README credits."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
S = sys.argv[1] if len(sys.argv) > 1 else '/workspace/naiwa-survey'
M = S + '/03-miner/files/frog-miner/assets/frog-rare-'; G = S + '/10-gugupeng/files/assets/'
TILES = [M + f'{n}.webp' for n in (10, 11, 12, 13, 14, 15, 16, 25, 40, 8, 30, 38, 4, 45)]
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
