import grpc

from src.generated import compute_pb2, compute_pb2_grpc


class ComputeServicer(compute_pb2_grpc.ComputeServiceServicer):
    def Health(
        self, request: compute_pb2.HealthRequest, context: grpc.ServicerContext
    ) -> compute_pb2.HealthResponse:
        return compute_pb2.HealthResponse(status="ok", version="0.0.0")

    def RunSimulation(
        self, request: compute_pb2.SimulationRequest, context: grpc.ServicerContext
    ):
        yield compute_pb2.SimulationResult(
            job_id=request.project_id,
            status=compute_pb2.SimulationStatus.SIMULATION_STATUS_FAILED,
            error="not yet implemented",
        )

    def GenerateNetlist(
        self, request: compute_pb2.NetlistRequest, context: grpc.ServicerContext
    ) -> compute_pb2.NetlistResponse:
        return compute_pb2.NetlistResponse(warnings=["not yet implemented"])

    def CheckConstraints(
        self, request: compute_pb2.ConstraintCheckRequest, context: grpc.ServicerContext
    ) -> compute_pb2.ConstraintCheckResponse:
        return compute_pb2.ConstraintCheckResponse(
            project_id=request.project_id,
            summary="not yet implemented",
        )
