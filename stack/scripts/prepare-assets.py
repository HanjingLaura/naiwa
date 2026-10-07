"""Copy + optimize real fan 奶蛙 assets for stack blocks from the local survey dump. See README credits."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
S = sys.argv[1] if len(sys.argv) > 1 else '/workspace/naiwa-survey'
M = S + '/03-miner/files/frog-miner/assets/frog-rare-'; G = S + '/10-gugupeng/files/assets/'
M = S + '/03-miner/files/frog-miner/assets/frog-rare-'
PICK = {**{f'b{i}': M + f'{n}.webp' for i, n in enumerate((9, 34, 36, 32, 25, 4, 8, 44, 38, 26, 30, 35))}, 'fall': G + 'a01bb7af93d35e5c.webp', 'win': G + 'bdde48ade4583f2a.webp', 'logo': M + '22.webp'}

def clean(p, mx):
  im = Image.open(p).convert('RGBA'); im.thumbnail((900, 900)); a = np.array(im)
  lab, n = ndimage.label(ndimage.binary_closing(a[..., 3] > 20, iterations=3))
  if n > 1:
    sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    a[~ndimage.binary_dilation(lab == np.argmax(sz) + 1, iterations=2), 3] = 0
  im = Image.fromarray(a); im = im.crop(im.getbbox()); im.thumbnail((mx, mx), Image.LANCZOS); return im
for k, p in PICK.items(): clean(p, 240).save(f'public/assets/{k}.webp', 'WEBP', quality=82, method=4)

print('ok')
