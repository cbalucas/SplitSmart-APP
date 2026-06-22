from PIL import Image, ImageDraw
import numpy as np
from collections import deque

def color_distance(c1, c2):
    """Distancia euclidiana entre dos colores RGB."""
    return ((int(c1[0])-int(c2[0]))**2 + (int(c1[1])-int(c2[1]))**2 + (int(c1[2])-int(c2[2]))**2) ** 0.5

def remove_background(path, tolerance=35):
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    data = np.array(img, dtype=np.uint8)
    rgb = data[:, :, :3]

    visited = np.zeros((h, w), dtype=bool)
    mask = np.zeros((h, w), dtype=bool)

    # Puntos semilla: 4 esquinas + midpoints de cada borde
    seeds = [
        (0, 0), (0, w-1), (h-1, 0), (h-1, w-1),
        (0, w//2), (h-1, w//2), (h//2, 0), (h//2, w-1),
    ]

    # Recolectar colores de referencia del fondo desde las semillas
    bg_colors = []
    for r, c in seeds:
        bg_colors.append(rgb[r, c].tolist())

    queue = deque()
    for r, c in seeds:
        if not visited[r, c]:
            visited[r, c] = True
            queue.append((r, c))
            mask[r, c] = True

    while queue:
        r, c = queue.popleft()
        px = rgb[r, c].tolist()
        for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
            nr, nc = r+dr, c+dc
            if 0 <= nr < h and 0 <= nc < w and not visited[nr, nc]:
                npx = rgb[nr, nc].tolist()
                # Aceptar si es similar a algún color de fondo conocido
                if any(color_distance(npx, bg) <= tolerance for bg in bg_colors):
                    visited[nr, nc] = True
                    mask[nr, nc] = True
                    # Agregar color del nuevo píxel al modelo si es suficientemente diferente
                    if all(color_distance(npx, bg) > tolerance*0.3 for bg in bg_colors):
                        bg_colors.append(npx)
                        if len(bg_colors) > 50:
                            bg_colors.pop(0)
                    queue.append((nr, nc))

    data[mask, 3] = 0
    result = Image.fromarray(data)
    result.save(path)
    removed = int(mask.sum())
    total = w * h
    name = path.replace('\\', '/').split('/')[-1]
    print(f'{name}: eliminados {removed} px ({removed*100//total}%)')

base = 'c:/APPs/SplitSmart-APP/assets/splitsmart/'
for f in ['Splitty_AR.png', 'Splitty_PT.png', 'Splitty_US.png']:
    remove_background(base + f, tolerance=35)
    print('  OK')
