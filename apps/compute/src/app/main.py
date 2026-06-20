from fastapi import FastAPI
from pydantic import BaseModel

from src.app import constraints, enclosure, netlist, simulator
from src.generated import compute_pb2

app = FastAPI(
    title="HardwarePilot Compute",
    description="Geometry, constraint solving, and enclosure generation service",
    version="0.1.0",
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "0.1.0"}


class SimulationRestRequest(BaseModel):
    project_id: str
    netlist: str
    analysis_type: str = "dc"


@app.post("/simulate")
async def simulate(req: SimulationRestRequest):
    analysis_map = {
        "dc": compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_DC,
        "ac": compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_AC,
        "tran": compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_TRANSIENT,
    }
    grpc_req = compute_pb2.SimulationRequest(
        project_id=req.project_id,
        netlist=req.netlist,
        analysis_type=analysis_map.get(req.analysis_type, compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_DC),
    )
    results = list(simulator.run_simulation(grpc_req))
    final = results[-1] if results else None
    if final is None:
        return {"success": False, "error": "no simulation results"}
    if final.status == compute_pb2.SimulationStatus.SIMULATION_STATUS_FAILED:
        return {"success": False, "error": final.error}
    return {
        "success": True,
        "job_id": final.job_id,
        "signals": [
            {
                "name": s.name,
                "time": list(s.time),
                "voltage": list(s.voltage),
                "current": list(s.current),
                "power": list(s.power),
            }
            for s in final.signals
        ],
    }


class NetlistRestRequest(BaseModel):
    project_id: str
    components: list[dict] = []
    nets: list[dict] = []


@app.post("/netlist")
async def generate_netlist_rest(req: NetlistRestRequest):
    components = []
    for c in req.components:
        pins = [compute_pb2.Pin(name=p.get("name", ""), number=p.get("number", 0)) for p in c.get("pins", [])]
        components.append(
            compute_pb2.Component(
                refdes=c.get("refdes", c.get("name", "")),
                name=c.get("name", ""),
                type=c.get("type", ""),
                value=c.get("value", ""),
                pins=pins,
            )
        )
    pb_nets = []
    for n in req.nets:
        nodes = [compute_pb2.Node(component=nd.get("component", ""), pin=nd.get("pin", "")) for nd in n.get("nodes", n.get("connections", []))]
        pb_nets.append(compute_pb2.Net(name=n.get("name", ""), nodes=nodes))

    grpc_req = compute_pb2.NetlistRequest(project_id=req.project_id, components=components, nets=pb_nets)
    response = netlist.generate_netlist(grpc_req)
    return {"netlist": response.netlist, "warnings": list(response.warnings)}


class ConstraintRestRequest(BaseModel):
    project_id: str
    modules: list[dict] = []
    form: dict | None = None
    constraints: list[dict] = []


@app.post("/check-constraints")
async def check_constraints_rest(req: ConstraintRestRequest):
    modules = []
    for m in req.modules:
        ports = [compute_pb2.Port(name=p.get("name", ""), protocol=p.get("protocol", ""), voltage=p.get("voltage", 0.0)) for p in m.get("ports", [])]
        dim = compute_pb2.Dimension(
            width=m.get("dimension", {}).get("width", m.get("dimension", {}).get("w", 20)),
            height=m.get("dimension", {}).get("height", m.get("dimension", {}).get("h", 20)),
            depth=m.get("dimension", {}).get("depth", m.get("dimension", {}).get("d", 5)),
        )
        pos = None
        if m.get("position"):
            pos = compute_pb2.Position(
                x=m["position"].get("x", 0),
                y=m["position"].get("y", 0),
                z=m["position"].get("z", 0),
                rotation=m["position"].get("rotation", 0),
            )
        pb_mod = compute_pb2.Module(
            id=m.get("id", ""), name=m.get("name", ""),
            dimension=dim, ports=ports,
        )
        if pos:
            pb_mod.position.CopyFrom(pos)
        modules.append(pb_mod)

    form = compute_pb2.Form()
    if req.form and req.form.get("vertices"):
        for v in req.form["vertices"]:
            form.vertices.append(compute_pb2.Point(x=v.get("x", 0), y=v.get("y", 0)))

    pb_constraints = []
    for c in req.constraints:
        pb_constraints.append(
            compute_pb2.Constraint(
                id=c.get("id", ""), domain=c.get("domain", ""),
                rule=c.get("rule", ""), priority=c.get("priority", "should"),
            )
        )

    grpc_req = compute_pb2.ConstraintCheckRequest(
        project_id=req.project_id, modules=modules, form=form, constraints=pb_constraints,
    )
    response = constraints.check_constraints(grpc_req)
    return {
        "project_id": response.project_id,
        "conflicts": [
            {
                "domain": c.domain, "severity": c.severity,
                "description": c.description, "recommendation": c.recommendation,
                "alternatives": list(c.alternatives),
            }
            for c in response.conflicts
        ],
        "summary": response.summary,
    }


class EnclosureRequest(BaseModel):
    project_id: str
    vertices: list[dict] = []
    height: float = 30.0
    wall_thickness: float = 2.0


@app.post("/enclosure/generate")
async def generate_enclosure(req: EnclosureRequest):
    form_verts = [(v.get("x", 0), v.get("y", 0)) for v in req.vertices]
    if len(form_verts) < 3:
        return {"success": False, "error": "Need at least 3 vertices for enclosure form"}

    mesh = enclosure.generate_enclosure_mesh(form_verts, req.height, req.wall_thickness)
    holes = enclosure.generate_mounting_holes(form_verts)

    stl_bytes = enclosure.export_stl(mesh)

    return {
        "success": True,
        "mesh": {
            "vertices": mesh["vertices"],
            "triangles": mesh["triangles"],
        },
        "mounting_holes": [{"x": h[0], "y": h[1], "radius": h[2], "depth": h[3]} for h in holes],
        "stl_base64": __import__("base64").b64encode(stl_bytes).decode(),
        "dimensions": {
            "height": req.height,
            "wall_thickness": req.wall_thickness,
            "vertex_count": len(form_verts),
        },
    }
