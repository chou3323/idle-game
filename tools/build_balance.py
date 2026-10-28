#!/usr/bin/env python3
"""Map each of the 36 Aurevia monsters to a comparable original-RO monster *stat shape* (facts only, from data/monsters_ro.json)
and write data/aur_map.json (audit: which RO monster, why) + data/aur_mobs.json (runtime balance used by the game).
Only numbers are used (relative HP / ATK / DEF / EXP, element table, race, size, drop-rate shapes). Names/art stay Aurevia."""
import json, math, statistics, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); DATA = os.path.join(HERE, '..', 'data')
RO = json.load(open(os.path.join(DATA, 'monsters_ro.json')))
RACE_FIX = {'龙族': 'dragon', '龍族': 'dragon'}
for m in RO:
    m['race'] = RACE_FIX.get(m['race'], m['race'])
TIER_LV = {1: 20, 2: 50, 3: 80}
TIER_BAND = {1: (10, 32), 2: (36, 64), 3: (64, 94)}
# our monsters: template -> per-tier (element, preferred races)  [element decides the weakness table; names stay Aurevia]
SPEC = {
 'bunny': [('earth', ['brute']), ('water', ['brute']), ('fire', ['brute'])],
 'blob':  [('water', ['formless', 'plant']), ('water', ['formless']), ('fire', ['formless'])],
 'bee':   [('wind', ['insect']), ('water', ['insect']), ('fire', ['insect'])],
 'beetle':[('earth', ['insect']), ('earth', ['insect']), ('fire', ['insect'])],
 'mush':  [('earth', ['plant']), ('water', ['plant']), ('fire', ['plant'])],
 'ghost': [('ghost', ['undead', 'demon']), ('ghost', ['undead']), ('dark', ['undead', 'demon'])],
 'bat':   [('dark', ['brute', 'demon']), ('dark', ['brute', 'demon']), ('dark', ['demon', 'brute'])],
 'snake': [('earth', ['brute']), ('poison', ['brute']), ('fire', ['brute'])],
 'crab':  [('water', ['fish', 'insect']), ('earth', ['insect', 'fish']), ('fire', ['insect', 'fish'])],
 'golem': [('earth', ['formless']), ('earth', ['formless']), ('fire', ['formless'])],
 'plant': [('earth', ['plant']), ('poison', ['plant']), ('fire', ['plant'])],
 'fox':   [('fire', ['brute']), ('water', ['brute']), ('fire', ['brute'])],
}
ORDER = ['bunny', 'blob', 'bee', 'beetle', 'mush', 'ghost', 'bat', 'snake', 'crab', 'golem', 'plant', 'fox']
SIZE_PREF = {'bunny': 'small', 'blob': 'medium', 'bee': 'small', 'beetle': 'medium', 'mush': 'medium', 'ghost': 'medium', 'bat': 'small', 'snake': 'medium', 'crab': 'medium', 'golem': 'large', 'plant': 'medium', 'fox': 'medium'}
# loot shape: shared tier materials by element (names are ours)
ESS = {'fire': '火之碎片', 'water': '水之碎片', 'earth': '地之碎片', 'wind': '風之碎片', 'poison': '毒之碎片', 'ghost': '暗影碎片', 'dark': '暗影碎片', 'holy': '聖光碎片', 'neutral': '星屑', 'undead': '暗影碎片'}
EXCLUDE_WORDS = ['卡片']
import re
CJK=re.compile(r'^[\u4e00-\u9fff·・]+$')
VARIANT=re.compile(r'^(C\d_|G_|M_|E_|EVENT|SPECIAL|RAID|MD_|OLD)')
def usable(m):
    if VARIANT.match(m['aegis'] or '') or not CJK.match(m['name_zh'] or ''): return False
    return m['def'] is not None and m['exp'] and m['hp'] and m['lv'] and m['atk'] and m['lv'] >= 5 and m.get('elem_table')
pool = [m for m in RO if usable(m)]
def hp_of(m): return m['hp']
def avg_atk(m): a = m['atk']; return (a[0] + a[1]) / 2 if isinstance(a, list) else float(a)
# drop-out boss/MVP-like outliers: hp more than 6x the median hp of monsters within +-6 levels
def is_outlier(m):
    near = [x['hp'] for x in pool if abs(x['lv'] - m['lv']) <= 6]
    return len(near) >= 5 and m['hp'] > 6 * statistics.median(near)
pool = [m for m in pool if not is_outlier(m)]
used = set(); picks = {}
for ti, tier in enumerate((1, 2, 3)):
    lo, hi = TIER_BAND[tier]
    for tpl in ORDER:
        el, races = SPEC[tpl][ti]
        best = None
        for m in pool:
            if m['id'] in used or not (lo - 4 <= m['lv'] <= hi + 4): continue
            s = abs(math.log(m['lv'] / TIER_LV[tier])) * 1.2
            s += 0 if m['element'] == el else 3.5
            s += 0 if m['race'] == races[0] else (0.9 if m['race'] in races else 2.5)
            s += 0 if m['size'] == SIZE_PREF[tpl] else .5
            s += 0 if (m.get('spawn_maps') or []) else .3
            key = (s, m['id'])
            if best is None or key < best[0]: best = (key, m)
        m = best[1]; used.add(m['id']); picks[(tier, tpl)] = (m, best[0][0])
# tier-wise normalisation: ratios against the tier's median so the game's own tier curve stays in charge
out = {}; audit = []
for tier in (1, 2, 3):
    ms = [picks[(tier, t)][0] for t in ORDER]
    mh = statistics.median(hp_of(m) for m in ms); ma = statistics.median(avg_atk(m) for m in ms)
    md = statistics.median(max(1, m['def']) for m in ms); me = statistics.median(m['exp'] / max(1, m['lv']) for m in ms)
    DEFB = {1: 7, 2: 16, 3: 28}[tier]
    for tpl in ORDER:
        m, sc = picks[(tier, tpl)]
        tid = 't%d_%s' % (tier, 'slime' if tpl == 'blob' else tpl)
        hpr = max(.5, min(2.8, hp_of(m) / mh)); atr = max(.55, min(2.0, avg_atk(m) / ma)); dfr = max(.3, min(2.4, max(1, m['def']) / md)); exr = max(.6, min(2.2, (m['exp'] / max(1, m['lv'])) / me))
        tbl = {k: max(25, min(200, int(v))) for k, v in m['elem_table'].items() if k in ('neutral', 'water', 'earth', 'fire', 'wind', 'poison', 'holy', 'dark', 'ghost', 'undead')}
        # drops: compress RO rates (rate/100)^0.62, then scale to playable rates; classify by item id / name
        def c(rate): return (max(rate, 0) / 100.0) ** .62
        etc = sorted([d for d in m['drops'] if d['item_id'] and 900 <= d['item_id'] < 1100 or (d['item_id'] and 7000 <= d['item_id'] < 8000)], key=lambda d: -d['rate'])
        pot = [d for d in m['drops'] if '药水' in d['name_zh'] or '藥水' in d['name_zh']]
        eqp = [d for d in m['drops'] if d['item_id'] and (1100 <= d['item_id'] < 3000 or 2100 <= d['item_id'] < 3000 or 1200 <= d['item_id'] < 1700)]
        card = [d for d in m['drops'] if d['item_id'] and 4000 <= d['item_id'] < 4700 or '卡片' in d['name_zh']]
        r_mat = etc[0]['rate'] if etc else (max((d['rate'] for d in m['drops']), default=20))
        r_m2 = etc[1]['rate'] if len(etc) > 1 else (r_mat * .4)
        r_pot = max((d['rate'] for d in pot), default=1.0)
        r_eq = sum(d['rate'] for d in eqp) or .3
        r_cd = max((d['rate'] for d in card), default=.01)
        drops = {'mat': round(max(.1, min(.6, c(r_mat) * .55)), 3), 'mat2': round(max(.04, min(.3, c(r_m2) * .38)), 3),
                 'pot': round(max(.03, min(.1, c(r_pot) * .22)), 3), 'gear': round(max(.02, min(.09, c(r_eq) * 1.6)), 3),
                 'card': round(max(.004, min(.02, c(r_cd) * 3)), 4), 'ess': ESS.get(m['element'], '星屑')}
        out[tid] = {'ref': m['name_zh'], 'refId': m['id'], 'refLv': int(m['lv']), 'race': m['race'], 'size': m['size'], 'el': m['element'], 'refEl': m['element'], 'elLv': m['element_lv'],
                    'hp': round(hpr, 2), 'atk': round(atr, 2), 'def': round(DEFB * dfr, 1), 'exp': round(exr, 2), 'tbl': tbl, 'drops': drops,
                    'maps': (m.get('spawn_maps') or [])[:5]}
        audit.append({'aurevia': tid, 'tier': tier, 'tpl': tpl, 'ro_id': m['id'], 'ro_aegis': m['aegis'], 'ro_name': m['name_zh'], 'ro_lv': m['lv'], 'ro_hp': m['hp'], 'ro_atk': avg_atk(m), 'ro_def': m['def'], 'ro_element': m['element'], 'ro_race': m['race'], 'ro_size': m['size'], 'match_score': round(sc, 2),
                      'hp_rel': round(hpr, 2), 'atk_rel': round(atr, 2), 'def_pts': round(DEFB * dfr, 1)})
json.dump(audit, open(os.path.join(DATA, 'aur_map.json'), 'w'), ensure_ascii=False, indent=1)
# boss element tables (element level 2 table = mode over dataset monsters with that element/level)
BOSS_EL = {'f1': 'wind', 'd1': 'earth', 'c2': 'dark', 's2': 'water', 'l3': 'fire', 'r3': 'ghost'}
boss = {}
for mid, el in BOSS_EL.items():
    cands = [m for m in RO if m.get('element') == el and m.get('element_lv') == 2 and m.get('elem_table')]
    if not cands: cands = [m for m in RO if m.get('element') == el and m.get('elem_table')]
    tbl = {}
    for k in ('neutral', 'water', 'earth', 'fire', 'wind', 'poison', 'holy', 'dark', 'ghost', 'undead'):
        vals = [m['elem_table'][k] for m in cands if m['elem_table'].get(k) is not None]
        if vals: tbl[k] = max(25, min(200, int(statistics.mode(vals))))
    boss[mid] = {'el': el, 'tbl': tbl}
json.dump({'v': 1, 'bossEl': boss, 'note': 'Runtime balance for the 36 Aurevia monsters. Derived from public RO monster stat facts (ro.dvg.cn) by tools/build_balance.py; no images, names or art are used.', 'mobs': out}, open(os.path.join(DATA, 'aur_mobs.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
for a in audit: print(a['aurevia'], '<-', a['ro_name'], a['ro_aegis'], 'Lv', a['ro_lv'], a['ro_element'], a['ro_race'], 'hpR', a['hp_rel'], 'atkR', a['atk_rel'], 'def', a['def_pts'], 'score', a['match_score'])
