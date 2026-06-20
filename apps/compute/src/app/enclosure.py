import math
from typing import TypedDict

import numpy as np

from src.generated import compute_pb2


class Mesh(TypedDict):
    vertices: list[list[float]]
    triangles: list[list[int]]


def _extrude_polygon(
    vertices: list[tuple[float, float]],
    height: float,
    thickness: float,
) -> Mesh:
    n = len(vertices)
    s = 10.0
    mesh_vertices: list[list[float]] = []
    mesh_triangles: list[list[int]] = []

    bottom: list[int] = []
    top: list[int] = []
    for x, y in vertices:
        bottom.append(len(mesh_vertices))
        mesh_vertices.append([x / s, 0.0, y / s])
        top.append(len(mesh_vertices))
        mesh_vertices.append([x / s, height / s, y / s])

    for i in range(n):
        j = (i + 1) % n
        b0, b1 = bottom[i], bottom[j]
        t0, t1 = top[i], top[j]
        mesh_triangles.append([b0, b1, t0])
        mesh_triangles.append([b1, t1, t0])

    cx = sum(x for x, _ in vertices) / n / s
    cy = sum(y for _, y in vertices) / n / s
    avg_dist = sum(math.sqrt((x / s - cx) ** 2 + (y / s - cy) ** 2) for x, y in vertices) / n
    scale = 1.0 - (thickness / s) / avg_dist if avg_dist > 0 else 0.8

    inner_bottom: list[int] = []
    inner_top: list[int] = []
    for x, y in vertices:
        ix = cx + (x / s - cx) * scale
        iy = cy + (y / s - cy) * scale
        inner_bottom.append(len(mesh_vertices))
        mesh_vertices.append([ix, thickness / s, iy])
        inner_top.append(len(mesh_vertices))
        mesh_vertices.append([ix, (height - thickness) / s, iy])

    for i in range(n):
        j = (i + 1) % n
        ib0, ib1 = inner_bottom[i], inner_bottom[j]
        it0, it1 = inner_top[i], inner_top[j]
        mesh_triangles.append([ib0, ib1, it0])
        mesh_triangles.append([ib1, it1, it0])

    for i in range(n):
        b = bottom[i]
        t = top[i]
        ib = inner_bottom[i]
        it = inner_top[i]
        mesh_triangles.append([b, ib, t])
        mesh_triangles.append([t, ib, it])

    return {"vertices": mesh_vertices, "triangles": mesh_triangles}


def _order_ccw(vertices: list[tuple[float, float]]) -> list[tuple[float, float]]:
    if len(vertices) < 3:
        return vertices
    cx = sum(x for x, _ in vertices) / len(vertices)
    cy = sum(y for _, y in vertices) / len(vertices)
    return sorted(vertices, key=lambda p: math.atan2(p[1] - cy, p[0] - cx))


def generate_enclosure_mesh(
    form_vertices: list[tuple[float, float]],
    height: float = 30,
    wall_thickness: float = 2,
) -> Mesh:
    order = _order_ccw(form_vertices)
    return _extrude_polygon(order, height, wall_thickness)


def _convex_hull(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    pts = sorted(set(points))
    if len(pts) <= 1:
        return pts

    def cross(o: tuple[float, float], a: tuple[float, float], b: tuple[float, float]) -> float:
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower: list[tuple[float, float]] = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper: list[tuple[float, float]] = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    return lower[:-1] + upper[:-1]


def generate_mounting_holes(
    form_vertices: list[tuple[float, float]],
    corner_offset: float = 5.0,
) -> list[tuple[float, float, float, float]]:
    if len(form_vertices) < 3:
        return []
    hull = _convex_hull(form_vertices)
    holes: list[tuple[float, float, float, float]] = []
    for x, y in hull:
        holes.append((x, y, 2.5, 5.0))
    return holes


def export_stl(mesh: Mesh) -> bytes:
    vertices = mesh["vertices"]
    triangles = mesh["triangles"]

    header = b"\x00" * 80
    num_triangles = len(triangles).to_bytes(4, "little")

    data = bytearray()
    for tri in triangles:
        v0 = np.array(vertices[tri[0]], dtype=np.float32)
        v1 = np.array(vertices[tri[1]], dtype=np.float32)
        v2 = np.array(vertices[tri[2]], dtype=np.float32)
        normal = np.cross(v1 - v0, v2 - v0)
        norm = np.linalg.norm(normal)
        if norm > 1e-10:
            normal = normal / norm
        data.extend(normal.astype(np.float32).tobytes())
        data.extend(v0.tobytes())
        data.extend(v1.tobytes())
        data.extend(v2.tobytes())
        data.extend((0).to_bytes(2, "little"))

    return header + num_triangles + bytes(data)


def get_module_positions_as_proto(
    modules: list[compute_pb2.Module],
) -> list[dict]:
    result = []
    for mod in modules:
        pos = {"x": 0.0, "y": 0.0, "z": 0.0, "rotation": 0.0}
        if mod.HasField("position"):
            pos = {
                "x": mod.position.x,
                "y": mod.position.y,
                "z": mod.position.z,
                "rotation": mod.position.rotation,
            }
        dim = {"w": 20.0, "h": 20.0, "d": 5.0}
        if mod.HasField("dimension"):
            dim = {
                "w": mod.dimension.width,
                "h": mod.dimension.height,
                "d": mod.dimension.depth,
            }
        result.append({
            "id": mod.id,
            "name": mod.name,
            "position": pos,
            "dimension": dim,
        })
    return result
