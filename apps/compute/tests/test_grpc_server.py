import grpc

from src.app.grpc_server import ComputeServicer
from src.generated import compute_pb2, compute_pb2_grpc


def test_servicer_implements_interface():
    servicer = ComputeServicer()
    assert isinstance(servicer, compute_pb2_grpc.ComputeServiceServicer)


def test_health_rpc():
    servicer = ComputeServicer()
    request = compute_pb2.HealthRequest()
    context = _FakeContext()

    response = servicer.Health(request, context)
    assert response.status == "ok"
    assert response.version == "0.1.0"


def test_generate_netlist_empty():
    servicer = ComputeServicer()
    request = compute_pb2.NetlistRequest(project_id="test-1")
    context = _FakeContext()

    response = servicer.GenerateNetlist(request, context)
    assert "* No components" in response.netlist
    assert "no components found" in response.warnings


def test_generate_netlist_with_resistor():
    servicer = ComputeServicer()
    comp = compute_pb2.Component(
        refdes="R1", name="10k Resistor", type="resistor", value="10k",
        pins=[
            compute_pb2.Pin(name="1", number=1),
            compute_pb2.Pin(name="2", number=2),
        ],
    )
    net = compute_pb2.Net(
        name="VCC",
        nodes=[
            compute_pb2.Node(component="R1", pin="1"),
        ],
    )
    request = compute_pb2.NetlistRequest(
        project_id="test-1", components=[comp], nets=[net],
    )
    context = _FakeContext()

    response = servicer.GenerateNetlist(request, context)
    assert "R1" in response.netlist
    assert "10k" in response.netlist
    assert response.netlist.endswith(".end\n") or ".end" in response.netlist


def test_generate_netlist_with_voltage_source():
    servicer = ComputeServicer()
    comp = compute_pb2.Component(
        refdes="V1", name="5V Source", type="voltage_source", value="5",
        pins=[
            compute_pb2.Pin(name="pos", number=1),
            compute_pb2.Pin(name="neg", number=2),
        ],
    )
    net_pos = compute_pb2.Net(
        name="VCC",
        nodes=[compute_pb2.Node(component="V1", pin="pos")],
    )
    request = compute_pb2.NetlistRequest(
        project_id="test-1", components=[comp], nets=[net_pos],
    )
    context = _FakeContext()
    response = servicer.GenerateNetlist(request, context)
    assert "V1" in response.netlist
    assert "DC 5" in response.netlist


def test_run_simulation_dc():
    servicer = ComputeServicer()
    netlist_text = "* test\nR1 1 0 1k\nV1 1 0 DC 5\n.end"
    request = compute_pb2.SimulationRequest(
        project_id="test-1",
        netlist=netlist_text,
        analysis_type=compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_DC,
    )
    context = _FakeContext()

    responses = list(servicer.RunSimulation(request, context))
    assert len(responses) >= 2
    statuses = [r.status for r in responses]
    assert compute_pb2.SimulationStatus.SIMULATION_STATUS_RUNNING in statuses
    assert compute_pb2.SimulationStatus.SIMULATION_STATUS_COMPLETED in statuses
    completed = next(r for r in responses if r.status == compute_pb2.SimulationStatus.SIMULATION_STATUS_COMPLETED)
    assert len(completed.signals) > 0
    assert any(s.name == "V(1)" for s in completed.signals)


def test_run_simulation_dc_no_components():
    servicer = ComputeServicer()
    request = compute_pb2.SimulationRequest(
        project_id="test-1",
        netlist="* empty\n",
        analysis_type=compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_DC,
    )
    context = _FakeContext()
    responses = list(servicer.RunSimulation(request, context))
    statuses = [r.status for r in responses]
    assert compute_pb2.SimulationStatus.SIMULATION_STATUS_FAILED in statuses


def test_check_constraints_no_modules():
    servicer = ComputeServicer()
    request = compute_pb2.ConstraintCheckRequest(project_id="test-1")
    context = _FakeContext()

    response = servicer.CheckConstraints(request, context)
    assert response.project_id == "test-1"
    assert "constraints satisfied" in response.summary.lower()


def test_check_constraints_overlap():
    servicer = ComputeServicer()
    mod_a = compute_pb2.Module(
        id="m1", name="MCU",
        dimension=compute_pb2.Dimension(width=30, height=20, depth=5),
        position=compute_pb2.Position(x=0, y=0),
    )
    mod_b = compute_pb2.Module(
        id="m2", name="Sensor",
        dimension=compute_pb2.Dimension(width=20, height=20, depth=3),
        position=compute_pb2.Position(x=10, y=10),
    )
    request = compute_pb2.ConstraintCheckRequest(
        project_id="test-1", modules=[mod_a, mod_b],
    )
    context = _FakeContext()

    response = servicer.CheckConstraints(request, context)
    assert response.project_id == "test-1"
    assert len(response.conflicts) > 0
    assert any(c.domain == "mechanical" for c in response.conflicts)


def test_check_constraints_no_overlap():
    servicer = ComputeServicer()
    mod_a = compute_pb2.Module(
        id="m1", name="MCU",
        dimension=compute_pb2.Dimension(width=20, height=20, depth=5),
        position=compute_pb2.Position(x=0, y=0),
    )
    mod_b = compute_pb2.Module(
        id="m2", name="Sensor",
        dimension=compute_pb2.Dimension(width=20, height=20, depth=5),
        position=compute_pb2.Position(x=30, y=30),
    )
    request = compute_pb2.ConstraintCheckRequest(
        project_id="test-1", modules=[mod_a, mod_b],
    )
    context = _FakeContext()

    response = servicer.CheckConstraints(request, context)
    assert response.project_id == "test-1"
    mechanical_conflicts = [c for c in response.conflicts if c.domain == "mechanical" and "overlap" in c.description.lower()]
    assert len(mechanical_conflicts) == 0


class _FakeContext:
    def __init__(self):
        self._code = None
        self._details = None

    def set_code(self, code):
        self._code = code

    def set_details(self, details):
        self._details = details

    def abort(self, code, details):
        self._code = code
        self._details = details
        raise grpc.RpcError()
