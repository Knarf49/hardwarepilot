import time
import uuid
from collections.abc import Generator

import numpy as np

from src.generated import compute_pb2


def _parse_netlist_components(netlist: str) -> list[dict]:
    elements: list[dict] = []
    for line in netlist.splitlines():
        stripped = line.strip()
        if stripped.startswith("*") or stripped.startswith("."):
            continue
        parts = stripped.split()
        if not parts:
            continue
        prefix = parts[0][0].upper()
        elem = {"name": parts[0], "type": prefix, "raw": stripped}
        if prefix in ("R", "C", "L", "D", "V", "I"):
            try:
                elem["n1"] = int(parts[1])
                elem["n2"] = int(parts[2])
                elem["value"] = _parse_value(parts[3]) if len(parts) > 3 else 1.0
            except (ValueError, IndexError):
                continue
        elif prefix == "Q":
            try:
                elem["nc"] = int(parts[1])
                elem["nb"] = int(parts[2])
                elem["ne"] = int(parts[3])
            except (ValueError, IndexError):
                continue
        elements.append(elem)
    return elements


def _parse_value(val_str: str) -> float:
    val_str = val_str.upper().replace(" ", "")
    multipliers = {
        "F": 1e-15, "P": 1e-12, "N": 1e-9, "U": 1e-6,
        "M": 1e-3, "K": 1e3, "MEG": 1e6, "G": 1e9, "T": 1e12,
    }
    try:
        return float(val_str)
    except ValueError:
        pass
    for suffix, mult in multipliers.items():
        if val_str.endswith(suffix):
            try:
                return float(val_str[:-len(suffix)]) * mult
            except ValueError:
                pass
    try:
        return float(val_str.rstrip("VADC"))
    except ValueError:
        return 1.0


def _find_max_node(elements: list[dict]) -> int:
    max_node = 0
    for elem in elements:
        for key in ("n1", "n2", "nc", "nb", "ne"):
            if key in elem:
                max_node = max(max_node, elem[key])
    return max_node


def dc_solve(netlist: str) -> tuple[dict[str, np.ndarray | list[float]], list[str]]:
    elements = _parse_netlist_components(netlist)
    if not elements:
        return {"error": ["no components parsed from netlist"]}, []

    num_nodes = _find_max_node(elements)
    if num_nodes == 0:
        return {"error": ["no valid nodes found in netlist. Check that nets connect components to ground (node 0)."]}, []

    n = num_nodes
    G = np.zeros((n, n))
    I = np.zeros(n)

    for elem in elements:
        prefix = elem["type"]
        if prefix == "R":
            g = 1.0 / max(elem["value"], 1e-12)
            n1, n2 = elem["n1"], elem["n2"]
            if n1 > 0:
                G[n1 - 1, n1 - 1] += g
            if n2 > 0:
                G[n2 - 1, n2 - 1] += g
            if n1 > 0 and n2 > 0:
                G[n1 - 1, n2 - 1] -= g
                G[n2 - 1, n1 - 1] -= g
        elif prefix == "V":
            pass
        elif prefix == "I":
            n1, n2 = elem["n1"], elem["n2"]
            if n1 > 0:
                I[n1 - 1] -= elem["value"]
            if n2 > 0:
                I[n2 - 1] += elem["value"]

    voltage_sources = [e for e in elements if e["type"] == "V"]
    num_vsrc = len(voltage_sources)
    size = n + num_vsrc

    A = np.zeros((size, size))
    b = np.zeros(size)
    A[:n, :n] = G
    b[:n] = I

    for idx, vsrc in enumerate(voltage_sources):
        col = n + idx
        n1, n2 = vsrc["n1"], vsrc["n2"]
        if n1 > 0:
            A[n1 - 1, col] = 1
            A[col, n1 - 1] = 1
        if n2 > 0:
            A[n2 - 1, col] = -1
            A[col, n2 - 1] = -1
        b[col] = vsrc["value"]

    try:
        x = np.linalg.solve(A, b)
    except np.linalg.LinAlgError as exc:
        return {"error": [f"matrix singular: {exc}"]}, []

    warnings: list[str] = []
    node_voltages: list[float] = [0.0]
    for i in range(n):
        node_voltages.append(float(x[i]))
    node_voltages_dict: dict[str, np.ndarray | list[float]] = {
        "node_voltages": np.array(node_voltages),
    }

    for vsrc in voltage_sources:
        n1, n2 = vsrc["n1"], vsrc["n2"]
        v1 = node_voltages[n1] if n1 < len(node_voltages) else 0.0
        v2 = node_voltages[n2] if n2 < len(node_voltages) else 0.0
        current = 0.0
        if vsrc["value"] and n1 > 0 and n2 > 0:
            for elem in elements:
                if elem["type"] == "R":
                    rn1, rn2 = elem["n1"], elem["n2"]
                    if (rn1 == n1 and rn2 == n2) or (rn1 == n2 and rn2 == n1):
                        current += (v1 - v2) / max(elem["value"], 1e-12)
        node_voltages_dict[f"I({vsrc['name']})"] = np.array([current])

    return node_voltages_dict, warnings


def run_simulation(
    request: compute_pb2.SimulationRequest,
) -> Generator[compute_pb2.SimulationResult, None, None]:
    job_id = str(uuid.uuid4())
    netlist = request.netlist

    yield compute_pb2.SimulationResult(
        job_id=job_id,
        status=compute_pb2.SimulationStatus.SIMULATION_STATUS_RUNNING,
    )

    analysis = request.analysis_type
    signals: list[compute_pb2.Signal] = []

    try:
        if analysis == compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_DC:
            result, warnings = dc_solve(netlist)
        elif analysis == compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_TRANSIENT:
            result = {"error": ["transient analysis requires ngspice (not yet integrated). Use DC analysis."]}
        elif analysis == compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_AC:
            result = {"error": ["AC analysis requires ngspice (not yet integrated). Use DC analysis."]}
        else:
            result = {"error": [f"unsupported analysis type: {analysis}"]}

        if "error" in result:
            yield compute_pb2.SimulationResult(
                job_id=job_id,
                status=compute_pb2.SimulationStatus.SIMULATION_STATUS_FAILED,
                error="; ".join(result["error"]),
            )
            return

        if "node_voltages" in result:
            voltages = result["node_voltages"]
            times = [0.0]
            for i in range(len(voltages)):
                signals.append(
                    compute_pb2.Signal(
                        name=f"V({i})",
                        time=times,
                        voltage=[float(voltages[i])] if isinstance(voltages, np.ndarray) else [voltages[i]],
                        current=[],
                        power=[],
                    )
                )
            for key, val in result.items():
                if key.startswith("I("):
                    signals.append(
                        compute_pb2.Signal(
                            name=key,
                            time=times,
                            voltage=[],
                            current=[float(val.item()) if isinstance(val, np.ndarray) else float(val)],
                            power=[],
                        )
                    )

        time.sleep(0.1)

        yield compute_pb2.SimulationResult(
            job_id=job_id,
            status=compute_pb2.SimulationStatus.SIMULATION_STATUS_COMPLETED,
            signals=signals,
        )

    except Exception as exc:
        yield compute_pb2.SimulationResult(
            job_id=job_id,
            status=compute_pb2.SimulationStatus.SIMULATION_STATUS_FAILED,
            error=str(exc),
        )
