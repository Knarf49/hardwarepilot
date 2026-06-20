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
        assert response.version == "0.0.0"
    finally:
        server.stop(grace=None)


def test_grpc_netlist_stub():
    server = _start_test_server(50052)
    time.sleep(0.1)
    try:
        channel = grpc.insecure_channel("localhost:50052")
        stub = compute_pb2_grpc.ComputeServiceStub(channel)
        response = stub.GenerateNetlist(compute_pb2.NetlistRequest(project_id="test"))
        assert "not yet implemented" in response.warnings[0]
    finally:
        server.stop(grace=None)
