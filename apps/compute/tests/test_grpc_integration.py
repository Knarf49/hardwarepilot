import time
from concurrent.futures import ThreadPoolExecutor

import grpc

from src.app.grpc_server import ComputeServicer
from src.generated import compute_pb2, compute_pb2_grpc


def _start_test_server(port: int):
    server = grpc.server(ThreadPoolExecutor(max_workers=2))
    compute_pb2_grpc.add_ComputeServiceServicer_to_server(ComputeServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    return server


def test_grpc_health_via_channel():
    server = _start_test_server(50051)
    time.sleep(0.1)
    try:
        channel = grpc.insecure_channel("localhost:50051")
        stub = compute_pb2_grpc.ComputeServiceStub(channel)
        response = stub.Health(compute_pb2.HealthRequest())
        assert response.status == "ok"
        assert response.version == "0.1.0"
    finally:
        server.stop(grace=None)


def test_grpc_netlist_via_channel():
    server = _start_test_server(50052)
    time.sleep(0.1)
    try:
        channel = grpc.insecure_channel("localhost:50052")
        stub = compute_pb2_grpc.ComputeServiceStub(channel)
        comp = compute_pb2.Component(
            refdes="R1", name="Test R", type="resistor", value="10k",
            pins=[
                compute_pb2.Pin(name="1", number=1),
                compute_pb2.Pin(name="2", number=2),
            ],
        )
        response = stub.GenerateNetlist(
            compute_pb2.NetlistRequest(project_id="test", components=[comp])
        )
        assert "R1" in response.netlist
        assert "10k" in response.netlist
        assert ".end" in response.netlist
    finally:
        server.stop(grace=None)


def test_grpc_simulation_via_channel():
    server = _start_test_server(50053)
    time.sleep(0.1)
    try:
        channel = grpc.insecure_channel("localhost:50053")
        stub = compute_pb2_grpc.ComputeServiceStub(channel)
        request = compute_pb2.SimulationRequest(
            project_id="test",
            netlist="* test\nR1 1 0 1k\nV1 1 0 DC 5\n.end",
            analysis_type=compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_DC,
        )
        responses = list(stub.RunSimulation(request))
        assert len(responses) >= 2
        completed = next(
            r for r in responses
            if r.status == compute_pb2.SimulationStatus.SIMULATION_STATUS_COMPLETED
        )
        assert len(completed.signals) > 0
    finally:
        server.stop(grace=None)


def test_grpc_constraints_via_channel():
    server = _start_test_server(50054)
    time.sleep(0.1)
    try:
        channel = grpc.insecure_channel("localhost:50054")
        stub = compute_pb2_grpc.ComputeServiceStub(channel)
        request = compute_pb2.ConstraintCheckRequest(project_id="test")
        response = stub.CheckConstraints(request)
        assert response.project_id == "test"
        assert "constraints satisfied" in response.summary.lower()
    finally:
        server.stop(grace=None)
