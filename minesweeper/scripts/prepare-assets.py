"""Copy + optimize real fan 奶蛙 assets from the local survey dump (/workspace/naiwa-survey). See README credits."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
S = sys.argv[1] if len(sys.argv) > 1 else '/workspace/naiwa-survey'
G = S + '/10-gugupeng/files/assets/'; M = S + '/03-miner/files/frog-miner/assets/'
PICK = {  # out name: (source, max px)
  'mine': (G + '3cf447de0a6da507.webp', 128),
  'flag': (M + 'frog-rare-22.webp', 128),
  'face-idle': (G + '93db9f6eda3e71a5.webp', 128),
  'face-worried': (G + '810e9d06af4c98a9.webp', 128),
  'face-win': (G + 'bdde48ade4583f2a.webp', 128),
  'face-dizzy': (G + 'a01bb7af93d35e5c.webp', 128),
  'win': (G + '0a01725bd3bac957.webp', 420),
  'lose': (G + 'e818016a0d25c224.webp', 420),
}
def clean(p, mx):
  a = np.array(Image.open(p).convert('RGBA'))
  lab, n = ndimage.label(ndimage.binary_closing(a[..., 3] > 20, iterations=3))
  if n > 1:
    sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    a[~ndimage.binary_dilation(lab == np.argmax(sz) + 1, iterations=2), 3] = 0
  im = Image.fromarray(a); im = im.crop(im.getbbox()); im.thumbnail((mx, mx), Image.LANCZOS); return im
import glob
for k, (p, mx) in PICK.items():
  p = glob.glob(p.replace('.webp', '*'))[0] if not __import__('os').path.exists(p) else p
  clean(p, mx).save(f'public/assets/{k}.webp', 'WEBP', quality=85, method=6); print(k, p.split('/')[-1])
