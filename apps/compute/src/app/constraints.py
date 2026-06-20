import math

from src.generated import compute_pb2


def _boxes_overlap(
    ax: float, ay: float, aw: float, ah: float,
    bx: float, by: float, bw: float, bh: float,
) -> bool:
    return not (
        ax + aw <= bx
        or bx + bw <= ax
        or ay + ah <= by
        or by + bh <= ay
    )


def check_constraints(
    request: compute_pb2.ConstraintCheckRequest,
) -> compute_pb2.ConstraintCheckResponse:
    conflicts: list[compute_pb2.Conflict] = []
    modules = list(request.modules)
    form = request.form
    proto_constraints = list(request.constraints)

    _check_mechanical_overlap(modules, conflicts)
    _check_enclosure_fit(modules, form, conflicts)
    _check_electrical_compatibility(modules, conflicts)

    for pconstraint in proto_constraints:
        if pconstraint.domain == "mechanical":
            _apply_mechanical_constraint(pconstraint, modules, conflicts)
        elif pconstraint.domain == "electrical":
            _apply_electrical_constraint(pconstraint, modules, conflicts)
        elif pconstraint.domain == "manufacturing":
            _apply_manufacturing_constraint(pconstraint, modules, conflicts)
        elif pconstraint.domain == "assembly":
            _apply_assembly_constraint(pconstraint, modules, conflicts)

    severity_order = {"error": 0, "warning": 1, "info": 2}
    conflicts.sort(key=lambda c: severity_order.get(c.severity, 3))

    total = len(conflicts)
    errors = sum(1 for c in conflicts if c.severity == "error")
    warnings = sum(1 for c in conflicts if c.severity == "warning")
    summary = f"Constraint check complete: {errors} error(s), {warnings} warning(s), {total} total finding(s)."
    if not conflicts:
        summary = "All constraints satisfied. No conflicts found."

    return compute_pb2.ConstraintCheckResponse(
        project_id=request.project_id,
        conflicts=conflicts,
        summary=summary,
    )


def _check_mechanical_overlap(
    modules: list[compute_pb2.Module],
    conflicts: list[compute_pb2.Conflict],
) -> None:
    for i in range(len(modules)):
        for j in range(i + 1, len(modules)):
            a = modules[i]
            b = modules[j]
            if not a.HasField("position") or not b.HasField("position"):
                continue
            aw = a.dimension.width if a.HasField("dimension") else 20
            ah = a.dimension.height if a.HasField("dimension") else 20
            bw = b.dimension.width if b.HasField("dimension") else 20
            bh = b.dimension.height if b.HasField("dimension") else 20
            ax_val, ay_val = a.position.x, a.position.y
            bx_val, by_val = b.position.x, b.position.y

            if _boxes_overlap(ax_val, ay_val, aw, ah, bx_val, by_val, bw, bh):
                conflicts.append(
                    compute_pb2.Conflict(
                        domain="mechanical",
                        severity="warning",
                        description=f"Module '{a.name}' and '{b.name}' overlap at ({ax_val:.1f},{ay_val:.1f}) and ({bx_val:.1f},{by_val:.1f})",
                        recommendation="Move one module to avoid overlap. Minimum clearance: 2mm.",
                        alternatives=[
                            f"Shift '{a.name}' by at least {bw + 2 - (bx_val - ax_val):.1f}mm in X",
                            f"Shift '{b.name}' by at least {aw + 2 - (ax_val - bx_val):.1f}mm in X",
                        ],
                    )
                )


def _check_enclosure_fit(
    modules: list[compute_pb2.Module],
    form: compute_pb2.Form,
    conflicts: list[compute_pb2.Conflict],
) -> None:
    if not form.vertices:
        return
    xs = [p.x for p in form.vertices]
    ys = [p.y for p in form.vertices]
    if not xs or not ys:
        return
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    for mod in modules:
        if not mod.HasField("position"):
            continue
        mw = mod.dimension.width if mod.HasField("dimension") else 20
        mh = mod.dimension.height if mod.HasField("dimension") else 20
        mx, my = mod.position.x, mod.position.y

        if mx < min_x or my < min_y:
            conflicts.append(
                compute_pb2.Conflict(
                    domain="mechanical",
                    severity="error",
                    description=f"Module '{mod.name}' at ({mx:.1f},{my:.1f}) extends outside enclosure boundary (min: {min_x:.1f},{min_y:.1f})",
                    recommendation="Move module inside enclosure or expand enclosure form.",
                    alternatives=[
                        f"Move '{mod.name}' to within ({min_x:.1f}-{max_x - mw:.1f}, {min_y:.1f}-{max_y - mh:.1f})",
                        "Expand enclosure form to contain all modules",
                    ],
                )
            )

        if mx + mw > max_x or my + mh > max_y:
            conflicts.append(
                compute_pb2.Conflict(
                    domain="mechanical",
                    severity="error",
                    description=f"Module '{mod.name}' extends beyond enclosure boundary. Module bounds: ({mx:.1f}-{mx + mw:.1f}, {my:.1f}-{my + mh:.1f}), enclosure max: ({max_x:.1f},{max_y:.1f})",
                    recommendation="Move or shrink module, or expand enclosure.",
                    alternatives=[
                        f"Shrink '{mod.name}' to fit within ({max_x - mx:.1f}, {max_y - my:.1f})",
                        "Expand enclosure form",
                    ],
                )
            )


def _check_electrical_compatibility(
    modules: list[compute_pb2.Module],
    conflicts: list[compute_pb2.Conflict],
) -> None:
    port_map: dict[str, list[tuple[str, compute_pb2.Port]]] = {}
    for mod in modules:
        for port in mod.ports:
            port_map.setdefault(port.protocol or port.name, []).append((mod.name, port))

    for protocol, entries in port_map.items():
        if len(entries) < 2:
            continue
        voltages = [p.voltage for _, p in entries if p.voltage]
        if voltages and max(voltages) - min(voltages) > 1.0:
            names = [f"{name}.{p.name}" for name, p in entries]
            conflicts.append(
                compute_pb2.Conflict(
                    domain="electrical",
                    severity="warning",
                    description=f"Voltage mismatch on protocol '{protocol}': ports {', '.join(names)} have incompatible voltages ({', '.join(f'{v}V' for v in voltages)})",
                    recommendation="Add level shifter or reassign port voltages to compatible levels.",
                    alternatives=[
                        "Insert a voltage level translator",
                        "Reassign ports to matching voltage domains",
                    ],
                )
            )


def _apply_mechanical_constraint(
    pconstraint: compute_pb2.Constraint,
    modules: list[compute_pb2.Module],
    conflicts: list[compute_pb2.Conflict],
) -> None:
    rule_lower = pconstraint.rule.lower()
    if "height" in rule_lower or "z-stack" in rule_lower or "stackup" in rule_lower:
        total_height = sum(
            mod.dimension.depth if mod.HasField("dimension") else 5
            for mod in modules
        )
        if total_height > 100:
            conflicts.append(
                compute_pb2.Conflict(
                    domain="mechanical",
                    severity="warning",
                    description=f"Total module stack height ({total_height:.0f}mm) may exceed enclosure height constraint: '{pconstraint.rule}'",
                    recommendation="Reduce module height or split across multiple boards.",
                    alternatives=[
                        "Use lower-profile components",
                        "Split design across stacked boards",
                    ],
                )
            )


def _apply_electrical_constraint(
    pconstraint: compute_pb2.Constraint,
    modules: list[compute_pb2.Module],
    conflicts: list[compute_pb2.Conflict],
) -> None:
    rule_lower = pconstraint.rule.lower()
    if "power" in rule_lower or "budget" in rule_lower:
        total_power = _estimate_total_power(modules)
        if total_power > 10:
            conflicts.append(
                compute_pb2.Conflict(
                    domain="electrical",
                    severity="warning",
                    description=f"Estimated power budget ({total_power:.1f}W) may be high. Constraint: '{pconstraint.rule}'",
                    recommendation="Verify power supply can deliver required current. Consider power gating.",
                    alternatives=[
                        "Add power gating for unused modules",
                        "Upgrade power supply module",
                        "Reduce module power consumption",
                    ],
                )
            )


def _apply_manufacturing_constraint(
    pconstraint: compute_pb2.Constraint,
    modules: list[compute_pb2.Module],
    conflicts: list[compute_pb2.Conflict],
) -> None:
    rule_lower = pconstraint.rule.lower()
    if "min" in rule_lower and "clearance" in rule_lower:
        min_clearance = 2.0
        import re
        m = re.search(r"(\d+\.?\d*)\s*mm", pconstraint.rule)
        if m:
            min_clearance = float(m.group(1))
        for i in range(len(modules)):
            for j in range(i + 1, len(modules)):
                a, b = modules[i], modules[j]
                if not a.HasField("position") or not b.HasField("position"):
                    continue
                dist = math.sqrt(
                    (a.position.x - b.position.x) ** 2 + (a.position.y - b.position.y) ** 2
                )
                if dist < min_clearance:
                    conflicts.append(
                        compute_pb2.Conflict(
                            domain="manufacturing",
                            severity="warning",
                            description=f"Distance between '{a.name}' and '{b.name}' ({dist:.1f}mm) below minimum clearance ({min_clearance}mm)",
                            recommendation=f"Increase distance to at least {min_clearance}mm.",
                            alternatives=[
                                f"Move modules apart by {min_clearance - dist:.1f}mm",
                                "Consider if this close placement is intentional",
                            ],
                        )
                    )


def _apply_assembly_constraint(
    pconstraint: compute_pb2.Constraint,
    modules: list[compute_pb2.Module],
    conflicts: list[compute_pb2.Conflict],
) -> None:
    _apply_manufacturing_constraint(pconstraint, modules, conflicts)


def _estimate_total_power(modules: list[compute_pb2.Module]) -> float:
    total = 0.0
    rough_estimates = {
        "mcu": 0.5,
        "sensor": 0.1,
        "display": 1.0,
        "connectivity": 0.5,
        "power": 0.2,
        "storage": 0.3,
        "actuator": 2.0,
        "battery": 0.0,
    }
    for mod in modules:
        mtype = mod.name.lower() if mod.name else ""
        for key, est in rough_estimates.items():
            if key in mtype:
                total += est
                break
        else:
            for port in mod.ports:
                if port.voltage:
                    total += port.voltage * 0.05
                    break
    return total
