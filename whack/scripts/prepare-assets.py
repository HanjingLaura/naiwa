"""Copy + optimize real fan 奶蛙 assets for 打奶蛙 from the local survey dump. See README credits."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
S = sys.argv[1] if len(sys.argv) > 1 else '/workspace/naiwa-survey'
G = S + '/10-gugupeng/files/assets/'; M = S + '/03-miner/files/frog-miner/assets/frog-rare-'
# pools: several different naiwa per role so every round looks varied
PICK = {
  **{f'normal{i}': G + f for i, f in enumerate(['07a8abdf58338ff6', '93db9f6eda3e71a5', '01662141d7cef953', '97e2373e78f5d0a4', '4690b22b63f4748d', '04fd2f4cbb3eaf15', 'naishu-v24-idle'])},
  **{f'normal{7 + i}': M + f'{n}' for i, n in enumerate((16, 15, 13, 45, 40))},
  **{f'hit{i}': G + f for i, f in enumerate(['e3d3581cc9141994', '810e9d06af4c98a9', 'ef2ebd8b85970c6b', 'naishu-v24-hit'])},
  'gold0': G + 'skins/naiwa-galaxy-shepherd', 'gold1': G + 'skins/naiwa-night-foreman', 'gold2': G + 'skins/naidan-caramel-pop',
  'gold-hit': G + 'bdde48ade4583f2a',
  **{f'bomb{i}': G + f for i, f in enumerate(['e7c4f898cd836e40', 'a01bb7af93d35e5c', 'naishu-v24-dizzy'])},
  'bomb-hit': G + '3cf447de0a6da507', 'win': G + '0a01725bd3bac957'}
def clean(p, mx):
  im = Image.open(p).convert('RGBA'); im.thumbnail((900, 900)); a = np.array(im)
  lab, n = ndimage.label(ndimage.binary_closing(a[..., 3] > 20, iterations=3))
  if n > 1:
    sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    a[~ndimage.binary_dilation(lab == np.argmax(sz) + 1, iterations=2), 3] = 0
  im = Image.fromarray(a); im = im.crop(im.getbbox()); im.thumbnail((mx, mx), Image.LANCZOS); return im
for k, p in PICK.items(): clean(p + '.webp', 240).save(f'public/assets/{k}.webp', 'WEBP', quality=82, method=4)
print('ok', len(PICK))
