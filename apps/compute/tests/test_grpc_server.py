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
    assert response.version == "0.0.0"


def test_generate_netlist_rpc():
    servicer = ComputeServicer()
    request = compute_pb2.NetlistRequest(project_id="test-1")
    context = _FakeContext()

    response = servicer.GenerateNetlist(request, context)
    assert response.netlist == ""
    assert len(response.warnings) == 1
    assert "not yet implemented" in response.warnings[0]


def test_run_simulation_rpc():
    servicer = ComputeServicer()
    request = compute_pb2.SimulationRequest(
        project_id="test-1",
        netlist="* test netlist",
        analysis_type=compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_DC,
    )
    context = _FakeContext()

    responses = list(servicer.RunSimulation(request, context))
    assert len(responses) == 1
    assert responses[0].status == compute_pb2.SimulationStatus.SIMULATION_STATUS_FAILED
    assert "not yet implemented" in responses[0].error


def test_check_constraints_rpc():
    servicer = ComputeServicer()
    request = compute_pb2.ConstraintCheckRequest(project_id="test-1")
    context = _FakeContext()

    response = servicer.CheckConstraints(request, context)
    assert response.project_id == "test-1"
    assert "not yet implemented" in response.summary


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
