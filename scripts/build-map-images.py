"""Build only the five mobile map images; retain all source PNGs and fish art."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
NAMES = ['world', 'okeechobee-preview', 'amazon-preview', 'flooded-forest-preview', 'sac-actun-preview']
for name in NAMES:
    source = ROOT / 'map-images' / (name + '.png')
    target = ROOT / 'map-images' / 'mobile' / (name + '.webp')
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = image.convert('RGB')
        if name == 'world':
            # Keep full resolution for zoom; geographic anchors never change.
            image.save(target, 'WEBP', quality=94, method=6)
        else:
            image.thumbnail((960, 600), Image.Resampling.LANCZOS)
            image.save(target, 'WEBP', quality=90, method=6)
    print(f'{name}: {source.stat().st_size} -> {target.stat().st_size} bytes')
