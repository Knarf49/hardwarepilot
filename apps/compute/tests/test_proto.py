def test_proto_stubs_importable():
    from src.generated import compute_pb2, compute_pb2_grpc

    assert hasattr(compute_pb2, "SimulationRequest")
    assert hasattr(compute_pb2, "SimulationResult")
    assert hasattr(compute_pb2, "NetlistRequest")
    assert hasattr(compute_pb2, "NetlistResponse")
    assert hasattr(compute_pb2, "ConstraintCheckRequest")
    assert hasattr(compute_pb2, "ConstraintCheckResponse")
    assert hasattr(compute_pb2_grpc, "ComputeServiceServicer")
    assert hasattr(compute_pb2_grpc, "add_ComputeServiceServicer_to_server")


def test_can_build_request_messages():
    from src.generated import compute_pb2

    req = compute_pb2.SimulationRequest(
        project_id="test-1",
        netlist="V1 1 0 DC 5V",
        analysis_type=compute_pb2.SimulationRequest.AnalysisType.ANALYSIS_TYPE_DC,
    )
    assert req.project_id == "test-1"
    assert req.netlist == "V1 1 0 DC 5V"

    netlist_req = compute_pb2.NetlistRequest(project_id="test-1")
    assert netlist_req.project_id == "test-1"

    constraint_req = compute_pb2.ConstraintCheckRequest(project_id="test-1")
    assert constraint_req.project_id == "test-1"
