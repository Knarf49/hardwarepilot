import grpc

from src.app import constraints, netlist, simulator
from src.generated import compute_pb2, compute_pb2_grpc


class ComputeServicer(compute_pb2_grpc.ComputeServiceServicer):
    def Health(
        self, request: compute_pb2.HealthRequest, context: grpc.ServicerContext
    ) -> compute_pb2.HealthResponse:
        return compute_pb2.HealthResponse(status="ok", version="0.1.0")

    def RunSimulation(
        self, request: compute_pb2.SimulationRequest, context: grpc.ServicerContext
    ):
        yield from simulator.run_simulation(request)

    def GenerateNetlist(
        self, request: compute_pb2.NetlistRequest, context: grpc.ServicerContext
    ) -> compute_pb2.NetlistResponse:
        return netlist.generate_netlist(request)

    def CheckConstraints(
        self, request: compute_pb2.ConstraintCheckRequest, context: grpc.ServicerContext
    ) -> compute_pb2.ConstraintCheckResponse:
        return constraints.check_constraints(request)
