#!/usr/bin/env python3
"""Impor BATCH_FILOSOFI_PART_1 (mf001-mf050) ke src/data/raw/motions.json.

Setiap mosi mendapat dua kode: id vault (m316+) dan kode sumber (mf0NN).
"""
import json, re, sys, unicodedata

SRC = "/mnt/user-uploads/BATCH_FILOSOFI_PART_1_mf001-050.txt"
OUT = "src/data/raw/motions.json"

raw = open(SRC, encoding="utf-8").read()
blocks = re.split(r"\n## (mf\d{3}) — ", raw)[1:]
pairs = list(zip(blocks[0::2], blocks[1::2]))

def clean(s):
    s = s.replace("**", "").replace("*", "").strip()
    return re.sub(r"\s+", " ", s)

def field(body, name):
    m = re.search(r"\*\*%s:?\*\*[:]?\s*(.+)" % re.escape(name), body)
    return clean(m.group(1)) if m else None

def table(body, side):
    m = re.search(r"\*\*%s — 10 poin\*\*\n((?:\|.*\n)+)" % side, body)
    if not m:
        return []
    rows = []
    for line in m.group(1).strip().split("\n"):
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 4:
            continue
        tier = clean(cells[0])
        if tier.lower() in ("tier", "---") or set(tier) <= {"-"}:
            continue
        text = clean(cells[1])
        def pct(x):
            mm = re.search(r"([\d.]+)", x)
            return round(float(mm.group(1))) if mm else 50
        if tier == "N":
            text = "RANK N — " + text
        rows.append({"tier": tier if tier in "SABCN" else "B",
                     "text": text, "strength": pct(cells[2]), "risk": pct(cells[3])})
    return rows

def case(body, header):
    m = re.search(r"\*\*%s[^\n]*\*\*\n((?:- .*\n?)+)" % re.escape(header), body)
    if not m:
        return None
    out = {}
    for line in m.group(1).strip().split("\n"):
        t = clean(line.lstrip("- "))
        if t.upper().startswith("PRO"):
            out["pro"] = (out.get("pro", "") + " " + t[3:].lstrip(": ").strip()).strip()
        elif t.upper().startswith("KON"):
            out["kon"] = (out.get("kon", "") + " " + t[3:].lstrip(": ").strip()).strip()
    return out or None

def bullets(body, header):
    m = re.search(r"\*\*%s[^\n]*\*\*\n((?:- .*\n?)+)" % re.escape(header), body)
    if not m:
        return []
    return [clean(l.lstrip("- ")) for l in m.group(1).strip().split("\n") if l.strip().startswith("-")]

CAT_MAP = {
    "ekonomi": "ekonomi", "politik": "politik", "hukum": "hukum", "sosial": "sosial",
    "etika": "filosofi", "filosofis": "filosofi", "filsafat": "filosofi",
    "teknologi": "teknologi", "lingkungan": "lingkungan", "agama": "agama",
    "pendidikan": "pendidikan", "kesehatan": "kesehatan", "budaya": "sosial",
    "militer": "hubungan-internasional", "internasional": "hubungan-internasional",
    "fiksi": "filosofi", "futuristik": "teknologi", "eksistensial": "filosofi",
}

def detect_type(title, tipe, hibrid):
    t = title.lower()
    base = None
    if re.search(r"\bmemilih dunia|akan memilih dunia|lebih memilih dunia", t):
        base = "memilih"
    elif "berpandangan" in t or "percaya" in t or "berpendapat" in t:
        base = "pandangan"
    elif "menyesali" in t or "menyesalkan" in t:
        base = "penyesalan"
    elif "memprediksi" in t:
        base = "prediksi"
    elif "berharap" in t:
        base = "harapan"
    elif "mendukung" in t:
        base = "dukungan"
    else:
        base = "kebijakan"
    aktor = bool(re.match(r"^\s*(\[tipe [abc]\]\s*)?sebagai\b", t)) or ", sebagai " in t or "terikat di rel" in t
    if aktor:
        return "aktor" if base == "kebijakan" else f"{base}-aktor"
    return base

def detect_cat(tipe, hibrid, title):
    hay = " ".join(x for x in [tipe or "", hibrid or ""]).lower()
    for k, v in CAT_MAP.items():
        if k in hay:
            return v
    return "filosofi"

motions = []
for code, body in pairs:
    title_line, rest = body.split("\n", 1)
    title = clean(re.sub(r"^\[Tipe [ABC]\]\s*", "", title_line))
    tipe_line = re.search(r"\*\*Tipe:\*\*\s*(.+)", rest)
    tipe = hibrid = None
    if tipe_line:
        parts = tipe_line.group(1).split("|")
        tipe = clean(parts[0])
        for p in parts[1:]:
            if "Hibrid" in p:
                hibrid = clean(p.split(":", 1)[-1])
    prob = re.search(r"\*\*Probabilitas:?\*\*\s*PRO\s*([\d.]+)%\s*·\s*KON\s*([\d.]+)%\s*(?:—\s*(.+))?", rest)
    terms = field(rest, "Istilah kunci")
    m = {
        "id": None,
        "kode": code,
        "title": title,
        "cat": detect_cat(tipe, hibrid, title),
        "type": detect_type(title, tipe, hibrid),
        "hybrid": hibrid,
        "ctx": field(rest, "Infoslide"),
        "note": field(rest, "Catatan pakai"),
        "terms": [clean(x) for x in terms.split(",")] if terms else [],
        "probPro": round(float(prob.group(1))) if prob else None,
        "probKon": round(float(prob.group(2))) if prob else None,
        "probNote": clean(prob.group(3)) if prob and prob.group(3) else None,
        "tiersPro": table(rest, "PRO"),
        "tiersKon": table(rest, "KON"),
        "cases": {},
        "rotation": {},
        "research": " • ".join(bullets(rest, "RISET / Matter")) or None,
    }
    for key, header in (("ideal", "IDEAL CASE"), ("mayor", "MAYOR CASE"),
                        ("minor", "MINOR CASE"), ("niche", "NICHE CASE")):
        c = case(rest, header)
        if c:
            m["cases"][key] = c
    for line in bullets(rest, "ROTASI"):
        low = line.lower()
        if low.startswith("ofensif"):
            m["rotation"]["ofensif"] = line.split(":", 1)[-1].strip()
        elif low.startswith("defensif"):
            m["rotation"]["defensif"] = line.split(":", 1)[-1].strip()
    m["pro"] = [p["text"] for p in m["tiersPro"][:6]]
    m["kon"] = [p["text"] for p in m["tiersKon"][:6]]
    if not m["cases"]:
        del m["cases"]
    if not m["rotation"]:
        del m["rotation"]
    m = {k: v for k, v in m.items() if v not in (None, [], {})}
    motions.append(m)

existing = json.load(open(OUT, encoding="utf-8"))
have = {re.sub(r"[^a-z0-9]", "", (x.get("title") or "").lower()) for x in existing}
used = {x.get("id") for x in existing}
nxt = 316
added = 0
for m in motions:
    key = re.sub(r"[^a-z0-9]", "", m["title"].lower())
    if key in have:
        continue
    while f"m{nxt:03d}" in used:
        nxt += 1
    m["id"] = f"m{nxt:03d}"
    used.add(m["id"])
    have.add(key)
    nxt += 1
    existing.append(m)
    added += 1

json.dump(existing, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
from collections import Counter
print("added", added, "total", len(existing))
print(Counter(x.get("type") for x in existing).most_common(12))
