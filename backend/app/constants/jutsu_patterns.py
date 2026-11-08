JUTSU_PATTERNS = {
    ("Snake", "Ram", "Monkey", "Boar", "Horse", "Tiger"): {
        "name": "Fire Release: Great Fireball",
        "japanese_name": "火遁・豪火球の術",
        "type": "FIRE",
        "chant": "Katon: Goukakyuu no Jutsu",
        "description": "A roaring sphere of fire exhaled from the lungs.",
    },
    ("Ox", "Hare", "Monkey"): {
        "name": "Shadow Clone Jutsu",
        "japanese_name": "影分身の術",
        "type": "SHADOW",
        "chant": "Kage Bunshin no Jutsu",
        "description": "Split chakra into living copies that fight beside you.",
    },
    ("Tiger", "Snake", "Ox", "Hare"): {
        "name": "Water Release: Water Dragon",
        "japanese_name": "水遁・水龍弾の術",
        "type": "WATER",
        "chant": "Suiton: Suiryuudan no Jutsu",
        "description": "Shape a surging dragon from surrounding water.",
    },
    ("Rat", "Dog", "Bird"): {
        "name": "Lightning Release: Chidori",
        "japanese_name": "雷遁・千鳥",
        "type": "LIGHTNING",
        "chant": "Chidori",
        "description": "Concentrate lightning into a thousand-bird cry.",
    },
    ("Dog", "Ram", "Snake", "Tiger"): {
        "name": "Wind Release: Rasengan Formation",
        "japanese_name": "風遁・螺旋丸",
        "type": "WIND",
        "chant": "Fuuton: Rasengan",
        "description": "Spin wind chakra into a spiraling sphere.",
    },
    ("Boar", "Horse", "Ram"): {
        "name": "Earth Release: Earth Wall",
        "japanese_name": "土遁・土流壁",
        "type": "EARTH",
        "chant": "Doton: Doryuuheki",
        "description": "Raise a stone rampart from the ground.",
    },
}


def catalog() -> list[dict]:
    items = []
    for pattern, jutsu in JUTSU_PATTERNS.items():
        items.append({**jutsu, "seals": list(pattern)})
    return items
