"use client";

import { Box, Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

interface Module3D {
  id: string;
  name: string;
  position: { x: number; y: number; z: number; rotation: number };
  dimension: { w: number; h: number; d: number };
}

interface Vertex {
  x: number;
  y: number;
}

interface EnclosureMesh {
  vertices: number[][];
  triangles: number[][];
}

interface Enclosure3DProps {
  modules: Module3D[];
  formVertices: Vertex[];
  enclosureMesh?: EnclosureMesh | null;
  height: number;
  wallThickness: number;
}

function EnclosureWalls({
  vertices,
  height,
}: {
  vertices: number[][];
  height: number;
  thickness: number;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    if (vertices.length < 3) return geo;

    const positions: number[] = [];
    const indices: number[] = [];

    const n = vertices.length;
    const bottomVerts: [number, number, number][] = vertices.map((v) => [v[0] / 10, 0, v[1] / 10]);
    const topVerts: [number, number, number][] = vertices.map((v) => [
      v[0] / 10,
      height / 10,
      v[1] / 10,
    ]);

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const b1 = bottomVerts[i];
      const b2 = bottomVerts[j];
      const t1 = topVerts[i];
      const t2 = topVerts[j];

      const start = positions.length / 3;
      positions.push(...b1, ...b2, ...t1, ...t2);
      indices.push(start, start + 1, start + 2);
      indices.push(start + 1, start + 3, start + 2);
    }

    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [vertices, height]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#7C5CFC"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
}

function ModuleBlock({ mod }: { mod: Module3D }) {
  const w = Math.max(mod.dimension.w / 10, 0.2);
  const h = Math.max(mod.dimension.d / 10, 0.1);
  const d = Math.max(mod.dimension.h / 10, 0.2);

  return (
    <group
      position={[mod.position.x / 10, mod.position.z / 10, mod.position.y / 10]}
      rotation={[0, (mod.position.rotation * Math.PI) / 180, 0]}
    >
      <Box args={[w, h, d]}>
        <meshStandardMaterial color="#22C55E" transparent opacity={0.6} />
      </Box>
      <Html position={[0, h / 2 + 0.2, 0]} center>
        <span className="text-[10px] text-neutral-300 whitespace-nowrap bg-neutral-900/80 px-1 py-0.5 rounded">
          {mod.name}
        </span>
      </Html>
    </group>
  );
}

function FormBoundary({ vertices }: { vertices: Vertex[] }) {
  const points = useMemo(() => {
    if (vertices.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(vertices[0].x / 10, vertices[0].y / 10);
    for (let i = 1; i < vertices.length; i++) {
      shape.lineTo(vertices[i].x / 10, vertices[i].y / 10);
    }
    shape.closePath();
    return shape.getPoints(64).map((p) => new THREE.Vector3(p.x, 0, p.y));
  }, [vertices]);

  if (!points || points.length === 0) return null;

  const lineGeo = new THREE.BufferGeometry().setFromPoints(points.map((p) => p));
  return (
    <line geometry={lineGeo}>
      <lineBasicMaterial color="#7C5CFC" linewidth={1} />
    </line>
  );
}

function Grid() {
  return (
    <>
      <gridHelper args={[20, 20, "#1F2937", "#111827"]} position={[0, -0.01, 0]} />
      <axesHelper args={[5]} />
    </>
  );
}

export function Enclosure3D({
  modules,
  formVertices,
  enclosureMesh,
  height,
  wallThickness,
}: Enclosure3DProps) {
  const meshVerts = useMemo(() => {
    if (enclosureMesh?.vertices) {
      const scale = 10;
      return enclosureMesh.vertices.map((v) => [v[0] / scale, v[2] / scale, v[1] / scale]);
    }
    return formVertices.map((v) => [v.x, 5, v.y]);
  }, [enclosureMesh, formVertices]);

  return (
    <Canvas camera={{ position: [8, 6, 8], fov: 50 }} style={{ background: "#0A0A0A" }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#7C5CFC" />

      <Grid />
      <EnclosureWalls vertices={meshVerts} height={height} thickness={wallThickness} />
      <FormBoundary vertices={formVertices} />

      {modules.map((mod) => (
        <ModuleBlock key={mod.id} mod={mod} />
      ))}

      <OrbitControls enableDamping dampingFactor={0.1} minDistance={3} maxDistance={30} />
    </Canvas>
  );
}
