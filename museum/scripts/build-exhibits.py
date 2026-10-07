"""Builds museum exhibits (optimized webp + thumbnails + src/exhibits.json) from the local survey dump
(/workspace/naiwa-survey) and Laura's photos. Fan assets — see README credits."""
import sys, os, re, glob, json, shutil, hashlib
import numpy as np
from PIL import Image
from scipy import ndimage
S = '/workspace/naiwa-survey'
PHOTOS = '/home/box/agent-data/agents/15676c22-9dde-4504-bf3a-6d03f974f206/attachments'
OUT = 'public/ex'; os.makedirs(OUT, exist_ok=True); os.makedirs('public/models/Textures', exist_ok=True)
GAMES = {
  'photo': ('Laura 的奶蛙相册', ''),
  'miner': ('青蛙矿工 frog-miner', 'https://66970010-boop.github.io/frog-miner/'),
  'gugupeng': ('奶蛙咕咕碰', 'https://naiwa-gugupeng.pages.dev/'),
  'xiaowu': ('奶蛙旅行小屋 TravelMilkyFrog', 'https://www.bilibili.com/toy/TravelMilkyFrog/index.html'),
  'dance': ('奶蛙跳舞 nailong-dance', 'https://nailong-dance.pages.dev/'),
  'bignaiwa': ('合成大奶蛙 BigNaiWa', 'https://yhsome.github.io/BigNaiWa/'),
}
ex = []
def h(s): return hashlib.md5(s.encode()).hexdigest()
def pick(lst, key): return lst[int(h(key), 16) % len(lst)]
def clean(im):
  im = im.convert('RGBA'); im.thumbnail((1000, 1000), Image.LANCZOS)
  a = np.array(im)
  if a[..., 3].min() < 250:
    lab, n = ndimage.label(ndimage.binary_closing(a[..., 3] > 20, iterations=3))
    if n > 1:
      sz = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1)); big = [i + 1 for i, s in enumerate(sz) if s > 0.12 * sz.max()]
      a[~ndimage.binary_dilation(np.isin(lab, big), iterations=2), 3] = 0
    im = Image.fromarray(a); im = im.crop(im.getbbox())
  return im
def add(hall, src, name, desc, game, full=1000, thumb=360, cleanup=True, tags=(), crop=None):
  i = len(ex); eid = f'{hall}-{i:03d}'
  im = Image.open(src)
  if crop: im = im.crop(crop)
  im = clean(im) if cleanup else im.convert('RGB')
  f = im.copy(); f.thumbnail((full, full), Image.LANCZOS); f.save(f'{OUT}/{eid}.webp', 'WEBP', quality=82, method=4)
  t = im.copy(); t.thumbnail((thumb, thumb), Image.LANCZOS); t.save(f'{OUT}/{eid}-t.webp', 'WEBP', quality=78, method=4)
  ex.append(dict(id=eid, hall=hall, name=name, desc=desc, game=game, w=f.width, h=f.height, tags=list(tags)))
# ---------- 1. 影像馆: Laura's photos ----------
PH = [  # (file prefix, title, description, crop box to strip black bars / app UI)
  ('53bf7f10', '深海里的光', '光线一束束落进海里，奶蛙张开手脚慢慢下沉，像一颗被温柔托住的奶糖。', None),
  ('e6ebbe12', '赛博雨夜', '霓虹、墨镜、皮夹克，子弹擦过雨幕——今晚的奶蛙不好惹，但肚皮依旧软软的。', None),
  ('e149a4d4', '小巷耳机', '夜里靠在巷子的墙上，戴着耳机，谁也别来打扰这首歌。', None),
  ('0be320d4', '黄昏海边的模糊', '晃了一下的快门，刚好留住海边落日前最后一点蓝。', None),
  ('bbcc7309', '云上的木板', '坐在云海上方的一块木板上，耳机里放着风，脚底下是整个天空。', None),
  ('12d23a32', '漂在太阳里', '仰着头漂在海面，太阳正好落在脸上，海浪一下一下地推着肚皮，今天什么也不用做。', (64, 285, 830, 1480)),
  ('6c415746', '草坡上的一跃', '大朵的云压得很低，影子落满草坡，奶蛙跳起来，想去够一够。', (0, 222, 1179, 2333)),
  ('7f7cee23', '天空之镜', '盐湖上摆一把椅子坐下，天空倒映在脚边，分不清自己是坐在云上还是水里。', (0, 166, 884, 1750)),
  ('db134475', '云朵午睡', '把自己挂在一朵云上睡着了，风往哪吹，就飘到哪里。', (41, 215, 864, 1690)),
  ('d7b46d8a', '天窗与鱼群', '水泥房间顶上开了一扇水做的天窗，光落下来，鱼群绕着悬浮的奶蛙慢慢转圈。', (82, 349, 1130, 2228)),
  ('980f48d3', '水母地铁', '末班地铁的车窗外游过一只发光的水母，奶蛙抱着手坐好，不知道下一站是不是海底。', (66, 307, 1136, 2234)),
  ('2b5e9ddc', '楼梯间的窗', '旧楼梯间里坐一会儿，窗户刚好框住一朵很大的云。', (41, 290, 1143, 2032)),
  ('c27fd4af', '雾里的阳台', '整座城都泡在雾里，奶蛙站在半空的水泥阳台上，等雾散。', (57, 320, 1133, 2240)),
  ('8a3df806', '星空飞升', '身体发着光，从星河里缓缓升起——今晚奶蛙就是最亮的那颗星。', (0, 352, 1179, 2272)),
  ('fe69de23', '玻璃墙角', '缩在长满藤蔓的玻璃墙角，阳光一格一格地照进来。', (79, 376, 1123, 2186)),
]
for p, n, d, c in PH:
  add('photo', glob.glob(f'{PHOTOS}/{p}*.jpg')[0], n, d, 'photo', full=1600, thumb=520, cleanup=False, tags=['影像', '摄影'], crop=c)

# ---------- 1b. 名画馆: Laura's art parodies (cropped from phone screenshots) ----------
ART = [
  ('1fe6f2a5', '蒙娜·奶蛙', '致敬达·芬奇《蒙娜丽莎》：那个神秘的微笑，其实是在憋笑。', 'west', (0, 281, 884, 1634)),
  ('1804a544', '倒牛奶的奶蛙', '致敬维米尔《倒牛奶的女仆》：倒的当然是奶，蛙的奶。', 'west', (0, 487, 884, 1428)),
  ('10d66296', '戴珍珠耳环的奶蛙', '致敬维米尔《戴珍珠耳环的少女》：回眸一瞥，绿眼睛比珍珠还亮。', 'west', (0, 440, 884, 1474)),
  ('86657554', '割耳朵的奶蛙', '致敬梵高《割耳朵后的自画像》：等等，奶蛙本来就没有耳朵。', 'west', (0, 555, 1179, 2001)),
  ('21832284', '叼烟斗的奶蛙', '致敬梵高《叼烟斗缠绷带的自画像》：笔触旋转，奶蛙很淡定。', 'west', (0, 459, 884, 1455)),
  ('ec79c407', '最后的奶餐', '致敬达·芬奇《最后的晚餐》：长桌一排全是奶蛙，到底是谁偷吃了布丁？', 'west', (0, 736, 884, 1179)),
  ('2ff16b92', '阿尔诺芬尼奶蛙夫妇', '致敬扬·凡·艾克《阿尔诺芬尼夫妇像》：大肚皮先生牵起了绿裙子太太的手。', 'west', (0, 493, 1179, 2063)),
  ('2cc6de6d', '奶蛙翻越阿尔卑斯', '致敬大卫《拿破仑翻越阿尔卑斯山》：马在嘶鸣，披风猎猎，奶蛙指向远方的零食。', 'west', (0, 493, 1179, 2063)),
  ('c3e3e051', '创造奶蛙', '致敬米开朗基罗《创造亚当》：指尖将触未触的一瞬，奶蛙被点化成了奶蛙。', 'west', (0, 709, 884, 1207)),
  ('1236e527', '天使的指尖', '金光从云里落下，长着翅膀的奶蛙伸出手，轻轻接住另一只奶蛙。', 'west', (0, 253, 884, 1663)),
  ('e067d0bd', '奶蛙升天', '致敬古典《升天》题材：众人仰望，奶蛙张开双臂，往光里飘去。', 'west', (0, 449, 884, 1465)),
  ('61e131c8', '奶蛙之舞', '致敬马蒂斯《舞蹈》：五只奶蛙手拉手转圈，笑得停不下来。', 'west', (0, 804, 1179, 1751)),
  ('e24f4a51', '执玫瑰的奶蛙', '厚涂油画里的奶蛙，递来一朵粉玫瑰，背后的光像糖霜一样化开。', 'west', (0, 400, 884, 1514)),
  ('e8c9d5d7', '秋千上的奶蛙', '致敬洛可可《秋千》：林间荡秋千，两只奶蛙的浪漫时刻。', 'west', (0, 338, 884, 1577)),
  ('22def001', '奶蛙受封', '致敬莱顿《骑士授勋》（The Accolade）：连鎏金画框一起收藏，奶蛙今天正式成为骑士。', 'west', (0, 541, 1179, 2016)),
  ('0c42e21f', '夜晚的奶蛙咖啡馆', '致敬梵高《夜晚露天咖啡馆》：星空下坐满了奶蛙，每桌都点了一杯奶。', 'west', (0, 617, 1179, 1944)),
  ('276c725b', '奶蛙一世加冕礼（全景）', '致敬大卫《拿破仑加冕》：满殿宾客，见证奶蛙一世登基。', 'west', (0, 597, 884, 1320)),
  ('18b9ac3a', '奶蛙一世加冕礼（近景）', '同一场加冕礼的近景：王冠举起的那一刻，全场屏住呼吸。', 'west', (0, 650, 884, 1264)),
  ('9f0a916c', '奶蛙夜宴图', '仿唐代宫廷夜宴：满屋奶蛙宾客，吃果子、听琵琶，热闹到天亮。', 'east', (0, 493, 1179, 2063)),
  ('9be4780c', '簪花奶蛙仕女图', '致敬唐《簪花仕女图》：云髻花钿，团扇古琴，仕女们个个圆滚滚。', 'east', (0, 492, 1179, 2064)),
  ('c25c8bcd', '清明上河奶蛙图', '致敬张择端《清明上河图》：虹桥上下、集市内外，数一数一共有多少只奶蛙？', 'east', (0, 493, 1179, 2063)),
]
for p, n, d, t, c in ART:
  add('art', glob.glob(f'{PHOTOS}/{p}*.jpg')[0], n, d, 'photo', full=1600, thumb=520, cleanup=False, tags=['名画', '西洋名画' if t == 'west' else '中国古画'], crop=c)
# ---------- 2. 服装造型馆 ----------
M = f'{S}/03-miner/files/frog-miner/assets/'
RARE = {1:'元气蹦跳',2:'粉裙小淑女',3:'读报老干部',4:'奶茶续命',5:'抱猫咪',6:'踢踢舞',7:'挥手打招呼',8:'送你一束花',9:'圆滚滚',10:'修女',11:'白大褂医生',12:'摄影师',13:'朋克炸毛',14:'黑衣特工',15:'礼帽绅士',16:'小厨师',17:'眼镜教授',18:'背书包上学',19:'奶鼠乱入',20:'法棍面包',21:'大眼瞪你',22:'奶蛙人举旗',23:'灵魂凝视',24:'躺平海豹',25:'比心',26:'头顶橘子',27:'牛奶推销员',28:'面包袋',29:'兔兔玩偶',30:'薯条一盒',31:'双手薯条',32:'委屈巴巴',33:'鸡腿到手',34:'安静站好',35:'可乐干杯',36:'微微一笑',37:'鸡腿配可乐',38:'冰淇淋',39:'爆米花',40:'圣诞帽',41:'软塌塌',42:'摊成一张饼',43:'抱膝发呆',44:'苹果',45:'汉服小姐姐',46:'服务生',47:'大侦探'}
CD = ['今天的造型由奶蛙本蛙亲自挑选。','穿上这一身，奶蛙觉得自己又行了。','稀有款！在矿洞深处才挖得到。','衣柜里最常穿的一套，肚皮依旧露在外面。','据说穿这身出门，回头率百分百。','奶蛙认真起来，连眼神都变了。','换装成功，但还是那个熟悉的大肚皮。']
for k, n in RARE.items():
  add('costume', f'{M}frog-rare-{k}.webp', n, f'{n}版奶蛙。' + pick(CD, n), 'miner', tags=['服装', '造型'])
G = f'{S}/10-gugupeng/files/assets/'
for f, n, d in [('naiwa-galaxy-shepherd', '银河牧羊人', '披着星河出门放羊，羊没找到，先把自己闪晕了。'),
                ('naiwa-night-foreman', '夜班工头', '夜班开工！皮带一扣、安全帽一戴，工地今晚由奶蛙罩着。'),
                ('naishu-yogurt-punk', '酸奶朋克（奶鼠）', '奶蛙的好朋友奶鼠，今天走酸奶朋克路线。'),
                ('naidan-caramel-pop', '焦糖爆米花（奶蛋）', '奶蛋穿上焦糖外壳，闻起来甜甜的。')]:
  add('costume', f'{G}skins/{f}.webp', n, d, 'gugupeng', tags=['皮肤', '造型'])
# ---------- 3. 动作姿势馆 (gugupeng sprites) ----------
POSE = {'01662141':'叉腰站','047fbe49':'跳台挥手','04fd2f4c':'奶蛋发呆','07a8abdf':'眯眼偷笑','0a01725b':'笑到肚子疼','0c2e405e':'奶鼠打滚','15adf802':'原地转圈','259a76':'张嘴喊你','2a23d09e':'奶鼠踩台','2dd63348':'奶鼠吃惊','2ee6679d':'奶鼠歪头','338aeaa4':'奶鼠背影','37345d6c':'奶蛋站岗','37762d9e':'奶鼠站好','3cf447de':'晕倒摊平','4690b22b':'得意洋洋','4f7060ac':'旋风奶蛙','5a12790d':'奶蛋正脸','5e7250df':'被压扁的奶蛋','611086c6':'奶鼠飞扑','6c33fb12':'奶蛋侧脸','6e5f71a4':'奶鼠小跑','7113eeb3':'空中翻滚','77ee6572':'奶鼠起跳','810e9d06':'乖乖站着','8a1601c1':'飞踢','93db9f6e':'立正','97e2373e':'开心拍手','9b1080b2':'奶蛋沉思','9f22acbc':'甩手舞','9f954840':'后仰下腰','a01bb7af':'转晕了','aa17cf3e':'冲刺！','bdde48ad':'欢呼胜利','c02fc735':'奶鼠冲刺','d500750b':'奶鼠躺云朵','d5684c41':'奶鼠捂脸','d7faa49c':'捧腹大笑','da274e4a':'奶蛋滚过来','dc1af4f9':'趴成一摊','e0dcf33b':'跳台受惊','e3d3581c':'吓一跳','e7c4f898':'晕头转向','e818016a':'奶鼠被砸晕','ef2ebd8b':'大喊一声','m6-role-naiwa':'奶蛙登场','m6-role-naidan':'奶蛋登场'}
PD = ['定格在最好笑的一瞬间。','动作满分，表情管理零分。','这一招叫做「奶蛙式」。','慢放十倍也看不清它怎么做到的。','做完这个动作，奶蛙需要躺一会儿。','咕咕碰赛场上的招牌动作。']
for k, n in POSE.items():
  f = glob.glob(f'{G}{k}*.webp')
  if f: add('pose', f[0], n, n + '。' + pick(PD, n), 'gugupeng', tags=['动作', '奶鼠' if '奶鼠' in n else '奶蛋' if '奶蛋' in n else '奶蛙'])
for f in sorted(glob.glob(f'{G}naishu-v24-*.webp')):
  k = f.split('-')[-1][:-5]; n = '奶鼠·' + {'idle':'待机','dizzy':'眩晕','maxcharge':'蓄满力','charge':'蓄力','hit':'被击中','victory':'胜利','dash':'冲刺'}.get(k, k)
  add('pose', f, n, n + '。奶蛙的好朋友奶鼠也来展览啦。', 'gugupeng', tags=['动作', '奶鼠'])
# ---------- 4. 旅行明信片馆 ----------
X = glob.glob(f'{S}/06-xiaowu/files/toy/TravelMilkyFrog/*/assets/')[0]
PC = {'alien_cry':('外星人也哭了','和外星人一起读书，读到感人处，两个都哭了。'),'backrooms_zero':('后室零层','一不小心走进了没有尽头的黄色走廊。'),'banana_cat_rain':('香蕉猫的雨天','香蕉猫哭成瀑布，奶蛙淡定撑伞。'),'capybara_bath':('和卡皮巴拉泡温泉','头顶橘子，水温刚好，谁也不想起来。'),'check_cards':('查牌时间','牌桌上奶蛙递出底牌，对面的人陷入沉思。'),'chicken_soup':('一碗鸡汤','路边小馆的热鸡汤，喝完继续赶路。'),'dagou_tap':('大狗拍拍','戴耳机的大狗太热情，奶蛙被拍得一晃一晃。'),'diarrhea':('紧急情况','这张明信片的背面写着：别问。'),'dog_cat_escape':('猫狗大逃亡','一路狂奔，零食撒了一地。'),'dungeon_trip':('地牢冒险','举着火把探地牢，宝藏没找到，先交了朋友。'),'fatdudu_meal':('和胖嘟嘟吃饭','街边小桌，一人一份，吃得很满足。'),'gpti_personality':('人格测试','测了一下，结果三个格子都是奶蛙。'),'home_gate':('小屋门口','旅行出发前，在家门口拍一张。'),'huaqiang_melon':('买瓜','这瓜保熟吗？奶蛙也想知道。'),'jiuzhuan_dachang':('九转大肠','厨师端上一盘招牌菜，奶蛙表示很有味道。'),'knife_shield':('刀与盾','海边遇到海狗骑士，切磋了一下。'),'kunkun_dance':('篮球舞','运球、转身、跳舞，一气呵成。'),'lanlao_flying':('云上飞行','和墨镜大叔一起在云上飞，风很大。'),'lost_stop':('迷路的车站','站牌看不懂，地图拿反了，先坐下歇会儿。'),'main-scene-base':('旅行小屋全景','奶蛙的家，每次旅行都从这里出发。'),'meme_lab':('表情包实验室','和大公鸡博士一起研究新表情包。'),'niulai_group':('牛来合影','一群毛茸茸的朋友，挤在一起拍照。'),'penguin':('海边企鹅','在海边遇到一只企鹅，一起看了很久的海。'),'pine_bbq':('松林烧烤','在松林里生火烤肉，香味飘了很远。'),'runaway_riceball':('逃跑的饭团','饭团自己滚走了，奶蛙在后面追。'),'salary_cat_dance':('发工资的猫','猫猫发工资了，开心得跳起舞来。'),'shortcut_stuck':('抄近路卡住','想抄近路翻墙，结果卡在了墙上。'),'snacks_gone':('零食没了','打开背包，发现零食已经被吃光了。')}
best = {}
for f in glob.glob(X + '*.webp'):
  k = re.sub(r'-v\d-.*', '', os.path.basename(f)); s = os.path.getsize(f)
  if k in PC and (k not in best or s > best[k][1]): best[k] = (f, s)
for k in sorted(best):
  n, d = PC[k]; add('postcard', best[k][0], n, d, 'xiaowu', full=1280, thumb=420, cleanup=False, tags=['旅行', '明信片'])
KS = {'keepsake-animals':('动物爪印石','旅行纪念品：路上遇到的动物朋友留下的爪印。'),'keepsake-coast':('海边贝壳','旅行纪念品：从海边捡回来的贝壳。'),'keepsake-food':('一碗热汤','旅行纪念品：记住了某个地方的味道。'),'keepsake-landmark':('小城堡','旅行纪念品：地标打卡成功。'),'keepsake-letter':('一封信','旅行纪念品：朋友寄来的信。'),'keepsake-wonder':('星星瓶','旅行纪念品：把一颗星星装进了瓶子。'),'keepsake-stage':('黑胶唱片','旅行纪念品：在舞台边听到的歌。'),'keepsake-ordinary':('路牌','旅行纪念品：最普通的一天也值得纪念。'),'backpack':('旅行背包','奶蛙出门必背的绿色背包。'),'mailbox':('小屋信箱','明信片都是从这里寄出去的。'),'bento-stove':('便当炉','旅行前做便当用的小炉子。')}
for k, (n, d) in KS.items():
  f = sorted(glob.glob(X + k + '-v*'), key=os.path.getsize)[-1]
  add('postcard', f, n, d, 'xiaowu', full=600, thumb=300, tags=['旅行', '纪念品'])
# ---------- 5. 特效馆 ----------
FX = {'03592b45':'牛奶瓶','28795eea':'牛奶飞溅','2b73f4a4':'砰！','3ffd45a8':'星星环绕','75de6466':'速度线','8f69eae0':'一滩牛奶','a0c39088':'云朵烟雾','a454f580':'碎裂地砖','aa8703f9':'光环','c91e9160':'闪闪发光','d1c1c90b':'奶油大炮','e97058fc':'刺刺炸开','ebdb5c85':'弹力鼓','ddc83946':'奶蛙飞碟','c4665d54':'蘑菇屋','200efb3c':'危险警告牌','impact-mobile':'冲击波','splash-mobile':'飞溅','star-mobile':'星星','ring-mobile':'圆环','sparkle-mobile':'亮晶晶','cloud-mobile':'云','dizzy-mobile':'眩晕圈','bottle-mobile':'奶瓶'}
for k, n in FX.items():
  f = glob.glob(f'{G}{k}*.webp')
  if f: add('fx', f[0], n, f'咕咕碰里的「{n}」特效，奶蛙出招时会冒出来。', 'gugupeng', thumb=300, tags=['特效'])
FR = {'01-grape':'葡萄','02-cherry':'樱桃','03-orange':'橘子','04-lemon':'柠檬','05-kiwi':'猕猴桃','06-tomato':'番茄','07-peach':'桃子','08-pineapple':'菠萝','09-coconut':'椰子','10-halfmelon':'半个西瓜','11-watermelon':'大西瓜'}
for k, n in FR.items():
  add('fx', f'{S}/01-bignaiwa/files/BigNaiWa/assets/fruits/{k}.webp', n, f'合成大奶蛙的第 {int(k[:2])} 级水果：{n}。两个一样的碰在一起会变大！', 'bignaiwa', thumb=300, tags=['道具', '水果'])
for k, n, d in [('ice-1', '大冰块', '矿洞里挖出来的冰块，奶蛙舔了一口。'), ('ice-3', '冰块三兄弟', '三块一起出现，清凉加倍。'), ('diamond-icon', '钻石', '青蛙矿工最想挖到的宝贝。'), ('can', '橘子罐头', '一整罐橘子，矿工的能量补给。')]:
  add('fx', f'{M}{k}.webp', n, d, 'miner', thumb=300, tags=['道具'])
# ---------- 6. 3D 模型馆 ----------
D = f'{S}/02-dance/files/'
for f, n, d in [('rigged.glb', '跳舞奶蛙（带骨骼）', '可以跳舞的 3D 奶蛙模型，拖动旋转，看看它的大肚皮。'), ('baby1.glb', '开场奶蛙', '跳舞游戏开场时登场的奶蛙模型。'),
                ('gifts/muffin.glb', '纸杯蛋糕', '观众扔上台的礼物：一个纸杯蛋糕。'), ('gifts/ice-cream-cne.glb', '甜筒', '观众扔上台的礼物：甜筒冰淇淋。'),
                ('gifts/g-hotdog.glb', '热狗', '观众扔上台的礼物：热狗。'), ('gifts/grapes.glb', '一串葡萄', '观众扔上台的礼物：一串葡萄。')]:
  eid = f'model-{len(ex):03d}'; shutil.copy(D + f, f'public/models/{eid}.glb')
  ex.append(dict(id=eid, hall='model', name=n, desc=d, game='dance', model=f'models/{eid}.glb', w=600, h=600, tags=['3D', '模型']))
shutil.copy(D + 'gifts/Textures/colormap.png', 'public/models/Textures/colormap.png')  # gift GLBs reference this external texture
json.dump({'games': {k: {'name': v[0], 'url': v[1]} for k, v in GAMES.items()}, 'exhibits': ex}, open('src/exhibits.json', 'w'), ensure_ascii=False, indent=1)
print(len(ex), {h_: sum(1 for e in ex if e['hall'] == h_) for h_ in ['photo', 'art', 'costume', 'pose', 'postcard', 'fx', 'model']})
