import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D Floating Holographic Avatar Plane of Kirmada
 */
const HolographicAvatarCard = ({ isSpeaking }) => {
  const meshRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();

  // Load Kirmada portrait texture safely
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load('/kirmada.jpg');
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Floating hovering motion
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(t * 1.5) * 0.12;
      meshRef.current.rotation.y = Math.sin(t * 0.8) * 0.08;
    }

    // Rotating 3D energy rings around Kirmada
    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * (isSpeaking ? 1.8 : 0.8);
      ringRef1.current.rotation.x = Math.sin(t * 0.5) * 0.3;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z = -t * (isSpeaking ? 2.2 : 0.6);
      ringRef2.current.rotation.y = Math.cos(t * 0.5) * 0.3;
    }
  });

  return (
    <group ref={meshRef}>
      {/* 3D Holographic Portrait Card */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[2.2, 2.2]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* Glowing 3D Outer Cyber Wireframe Border */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[2.28, 2.28]} />
        <meshBasicMaterial
          color={isSpeaking ? '#00F0FF' : '#0066FF'}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 3D Concentric Hologram Orbit Ring 1 */}
      <group ref={ringRef1}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.65, 0.02, 16, 64]} />
          <meshBasicMaterial
            color="#00F0FF"
            transparent
            opacity={isSpeaking ? 0.9 : 0.5}
          />
        </mesh>
      </group>

      {/* 3D Concentric Hologram Orbit Ring 2 */}
      <group ref={ringRef2}>
        <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[1.85, 0.015, 16, 64]} />
          <meshBasicMaterial
            color="#8B5CF6"
            transparent
            opacity={isSpeaking ? 0.8 : 0.4}
          />
        </mesh>
      </group>

      {/* Point Light emitted from Hologram */}
      <pointLight 
        color={isSpeaking ? '#00F0FF' : '#0066FF'} 
        distance={4} 
        intensity={isSpeaking ? 4.5 : 2.5} 
      />
    </group>
  );
};

/**
 * 3D Holographic Projector Pedestal Base
 */
const ProjectorBase = ({ isSpeaking }) => {
  const baseRef = useRef();

  useFrame(({ clock }) => {
    if (baseRef.current) {
      baseRef.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group position={[0, -1.35, 0]} ref={baseRef}>
      {/* Base Cylinders */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.3, 1.5, 0.18, 32]} />
        <meshStandardMaterial
          color="#060D24"
          roughness={0.3}
          metalness={0.9}
        />
      </mesh>

      {/* Inner Glowing Core */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 0.08, 32]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={isSpeaking ? 1.5 : 0.8}
        />
      </mesh>

      {/* Hologram Light Cone */}
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[1.35, 1.6, 32, 1, true]} />
        <meshBasicMaterial
          color="#00F0FF"
          transparent
          opacity={isSpeaking ? 0.12 : 0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

/**
 * Orbiting 3D Skill Particles
 */
const OrbitingSkillNodes = ({ isSpeaking }) => {
  const groupRef = useRef();

  const nodes = useMemo(() => [
    { name: 'TypeScript', color: '#10B981', radius: 2.3, speed: 0.8, angle: 0 },
    { name: 'React 18', color: '#00F0FF', radius: 2.6, speed: -0.6, angle: 1.5 },
    { name: 'Vector DBs', color: '#F59E0B', radius: 2.1, speed: 0.9, angle: 3.2 },
    { name: 'LangChain', color: '#8B5CF6', radius: 2.8, speed: -0.5, angle: 4.8 },
  ], []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const mult = isSpeaking ? 1.6 : 1.0;
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.4 * mult;
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(node.angle) * node.radius,
            Math.sin(node.angle * 2) * 0.35,
            Math.sin(node.angle) * node.radius,
          ]}
        >
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  );
};

/**
 * 3D Parallax Camera Rig
 */
const CameraParallax = ({ pointerPos }) => {
  useFrame(({ camera }) => {
    const targetX = pointerPos.x * 1.2;
    const targetY = pointerPos.y * 0.8;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
};

/**
 * Main 3D Hologram Scene Canvas
 */
export const KirmadaHologram3D = ({ isSpeaking }) => {
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [webglSupported, setWebglSupported] = useState(true);

  // Check WebGL availability safely
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch (e) {
      setWebglSupported(false);
    }
  }, []);

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setPointerPos({ x, y });
  };

  if (!webglSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <img
          src="/kirmada.jpg"
          alt="Kirmada"
          className="w-36 h-36 rounded-2xl object-cover border border-cyan-400 shadow-glow-cyan"
        />
      </div>
    );
  }

  return (
    <div 
      onMouseMove={handlePointerMove}
      className="relative w-full h-[260px] sm:h-[300px] cursor-grab active:cursor-grabbing select-none"
    >
      <Canvas
        camera={{ position: [0, 0.2, 4.2], fov: 45 }}
        onCreated={({ gl }) => {
          try {
            gl.setClearColor(0x000000, 0);
          } catch (e) {}
        }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#00F0FF" />
        <directionalLight position={[-5, -4, -3]} intensity={0.8} color="#8B5CF6" />

        <HolographicAvatarCard isSpeaking={isSpeaking} />
        <ProjectorBase isSpeaking={isSpeaking} />
        <OrbitingSkillNodes isSpeaking={isSpeaking} />
        <CameraParallax pointerPos={pointerPos} />
      </Canvas>
    </div>
  );
};

export default KirmadaHologram3D;
