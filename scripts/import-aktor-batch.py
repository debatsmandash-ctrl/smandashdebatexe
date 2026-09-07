#!/usr/bin/env python3
"""Impor batch mosi aktor teks-polos (PART_2_mosi_51-70.txt) ke motions.json.

Tiap mosi mendapat dua kode: id vault (m3xx) dan kode sumber (maNN).
"""
import json, re

SRC = "/mnt/user-uploads/PART_2_mosi_51-70.txt"
OUT = "src/data/raw/motions.json"

raw = open(SRC, encoding="utf-8").read()


def clean(s):
    return re.sub(r"\s+", " ", (s or "").replace("**", "").strip())


# blok = "m31 — Judul ...\n\nTipe: ..." sampai header berikutnya
parts = re.split(r"\n(m\d{2,3}) — ", raw)[1:]
blocks = list(zip(parts[0::2], parts[1::2]))
blocks = [(c, b) for c, b in blocks if "PRO — " in b and "IDEAL CASE" in b]


def sec(body, name, nxt):
    m = re.search(r"\n%s\s*\n(.*?)(?=\n(?:%s)\b|\Z)" % (name, nxt), body, re.S)
    return m.group(1).strip() if m else ""


def table(body, side):
    m = re.search(r"\n%s — \d+ poin\s*\n(.*?)(?=\n\s*\n)" % side, body, re.S)
    if not m:
        return []
    rows = []
    for line in m.group(1).split("\n"):
        cells = [c.strip() for c in line.split("\t") if c.strip()]
        if len(cells) < 4 or cells[0].lower() == "tier":
            continue
        tier = clean(cells[0])[:1].upper()
        if tier not in "SABCN":
            continue
        def pct(x):
            mm = re.search(r"([\d.]+)", x)
            return round(float(mm.group(1))) if mm else 50
        text = clean(cells[1])
        if tier == "N":
            text = "RANK N — " + text
        rows.append({"tier": tier, "text": text, "strength": pct(cells[-2]), "risk": pct(cells[-1])})
    return rows


def side_lines(chunk):
    out = {}
    for line in chunk.split("\n"):
        t = clean(line)
        if not t:
            continue
        up = t.upper()
        if up.startswith("PRO"):
            out["pro"] = (out.get("pro", "") + " " + t[3:].lstrip(" —-:")).strip()
        elif up.startswith("KON"):
            out["kon"] = (out.get("kon", "") + " " + t[3:].lstrip(" —-:")).strip()
    return out or None


motions = []
for i, (code, body) in enumerate(blocks):
    head, rest = body.split("\nTipe:", 1)
    rest = "Tipe:" + rest
    title = clean(head)
    tipe_line = clean(re.search(r"Tipe:\s*(.+)", rest).group(1))
    hibrid = None
    if "Hibrid" in tipe_line:
        tipe, hib = tipe_line.split("Hibrid", 1)
        hibrid = clean(hib.lstrip(":| "))
        tipe_line = clean(tipe.strip(" |"))

    def field(name):
        m = re.search(r"\n%s[^:\n]*:\s*(.*?)(?=\n[A-Z][^\n]*:|\n\s*\n)" % name, rest, re.S)
        return clean(m.group(1)) if m else None

    ctx = field("Info-slide") or field("Infoslide")
    note = field("Catatan pakai")
    terms = field("Istilah kunci")
    prob = re.search(r"Probabilitas:\s*PRO\s*([\d.]+)%\s*·\s*KON\s*([\d.]+)%\s*(?:—\s*(.*?))?(?=\nIstilah|\n\s*\n)", rest, re.S)

    m = {
        "id": None,
        "kode": f"ma{code[1:].zfill(3)}",
        "title": title,
        "cat": "sosial" if "sosial" in (hibrid or "").lower() else "politik" if "politik" in (hibrid or "").lower() else "aktor",
        "type": "aktor",
        "hybrid": hibrid,
        "ctx": ctx,
        "note": note,
        "terms": [clean(x) for x in terms.split(",")] if terms else [],
        "probPro": round(float(prob.group(1))) if prob else None,
        "probKon": round(float(prob.group(2))) if prob else None,
        "probNote": clean(prob.group(3)) if prob and prob.group(3) else None,
        "tiersPro": table(rest, "PRO"),
        "tiersKon": table(rest, "KON"),
        "cases": {},
        "rotation": {},
    }
    for key, name, nxt in (
        ("ideal", "IDEAL CASE", "MAYOR CASE"),
        ("mayor", "MAYOR CASE", "MINOR CASE"),
        ("minor", "MINOR CASE", "NICHE"),
        ("niche", "NICHE / RANK N", "ROTASI"),
    ):
        c = side_lines(sec(rest, name, nxt))
        if c:
            m["cases"][key] = c
    haram = side_lines(sec(rest, r"ROTASI HARAM DEBATE[^\n]*", "ROTASI HALAL"))
    halal = side_lines(sec(rest, r"ROTASI HALAL DEBATE[^\n]*", "LITERASI"))
    if haram:
        m["rotation"]["defensif"] = " | ".join(f"{k.upper()}: {v}" for k, v in haram.items())
    if halal:
        m["rotation"]["ofensif"] = " | ".join(f"{k.upper()}: {v}" for k, v in halal.items())
    lit = sec(rest, "LITERASI TERKAIT", "m\\d{2,3} — ")
    if lit:
        m["research"] = " • ".join(clean(l.lstrip("- ")) for l in lit.split("\n") if l.strip().startswith("-"))
    m["pro"] = [p["text"] for p in m["tiersPro"][:6]]
    m["kon"] = [p["text"] for p in m["tiersKon"][:6]]
    for k in ("cases", "rotation"):
        if not m[k]:
            del m[k]
    motions.append({k: v for k, v in m.items() if v not in (None, [], {}, "")})

existing = json.load(open(OUT, encoding="utf-8"))
norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
have = {norm(x.get("title")) for x in existing}
used = {x.get("id") for x in existing}
nxt = 366
added = 0
for m in motions:
    if norm(m["title"]) in have:
        continue
    while f"m{nxt:03d}" in used:
        nxt += 1
    m["id"] = f"m{nxt:03d}"
    used.add(m["id"]); have.add(norm(m["title"])); nxt += 1
    existing.append(m); added += 1

json.dump(existing, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("blocks", len(blocks), "added", added, "total", len(existing))
