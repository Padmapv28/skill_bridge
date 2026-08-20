import React, { useRef, useState, useMemo, useEffect, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Skill node data with match strengths
const SKILL_NODES = [
  { name: 'TypeScript', color: '#10B981', radius: 2.8, speed: 0.55, angle: 0, size: 0.28, type: 'Matched (98%)' },
  { name: 'React.js', color: '#10B981', radius: 3.4, speed: -0.4, angle: 1.2, size: 0.32, type: 'Matched (95%)' },
  { name: 'Node.js', color: '#10B981', radius: 2.2, speed: 0.65, angle: 2.4, size: 0.26, type: 'Matched (92%)' },
  { name: 'LangChain', color: '#F59E0B', radius: 4.0, speed: -0.3, angle: 3.5, size: 0.26, type: 'Growth Gap (70%)' },
  { name: 'Vector DBs', color: '#F43F5E', radius: 4.6, speed: 0.22, angle: 4.8, size: 0.24, type: 'Missing (High Impact)' },
  { name: 'RAG Architecture', color: '#38BDF8', radius: 3.8, speed: 0.45, angle: 0.8, size: 0.27, type: 'Target Skill' },
  { name: 'Docker', color: '#10B981', radius: 3.0, speed: -0.5, angle: 5.2, size: 0.22, type: 'Matched (88%)' },
  { name: 'Python AI', color: '#F59E0B', radius: 4.4, speed: 0.35, angle: 2.0, size: 0.25, type: 'Growth Gap (65%)' },
];

/**
 * Local Error Boundary specifically for the 3D Canvas
 */
class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.warn('[SkillUniverseScene] Canvas error caught, falling back to CSS visual:', err);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Orbit Ring Component using standard line loop
 */
const OrbitRing = ({ radius, tilt = [0, 0, 0], color = '#223259' }) => {
  const lineGeometry = useMemo(() => {
    const pts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  return (
    <group rotation={tilt}>
      <lineLoop geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.35} />
      </lineLoop>
    </group>
  );
};

/**
 * Orbiting Skill Node
 */
const OrbitingNode = ({ skill, onHover }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * skill.speed + skill.angle;
    const x = Math.cos(t) * skill.radius;
    const z = Math.sin(t) * skill.radius;
    const y = Math.sin(t * 1.5) * 0.35;

    if (meshRef.current) {
      meshRef.current.position.set(x, y, z);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(skill);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(null);
        }}
      >
        <sphereGeometry args={[skill.size * (hovered ? 1.35 : 1), 24, 24]} />
        <meshStandardMaterial
          color={skill.color}
          emissive={skill.color}
          emissiveIntensity={hovered ? 1.2 : 0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <pointLight color={skill.color} distance={1.8} intensity={hovered ? 2.5 : 1} />
    </group>
  );
};

/**
 * Central "Target Role" Core
 */
const TargetRoleCore = () => {
  const coreRef = useRef();

  useFrame(({ clock }) => {
    if (coreRef.current) {
      const t = clock.getElapsedTime();
      coreRef.current.rotation.y = t * 0.3;
      coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group ref={coreRef}>
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial
          color="#0066FF"
          emissive="#0044BB"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[1.15, 16, 16]} />
        <meshStandardMaterial
          color="#00D2FF"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      <pointLight color="#00D2FF" distance={5} intensity={3} />
      <pointLight color="#0066FF" distance={8} intensity={2} />
    </group>
  );
};

/**
 * Particle Starfield
 */
const ParticleField = () => {
  const count = 160;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#38BDF8"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
};

/**
 * Smooth Camera and Parallax Rig
 */
const CameraRig = ({ pointerPos }) => {
  useFrame(({ camera }) => {
    const targetX = pointerPos.x * 2.5;
    const targetY = 3.5 + pointerPos.y * 1.5;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return null;
};

/**
 * Floating Container Group
 */
const SceneContent = ({ onHover }) => {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.position.y = Math.sin(t * 0.8) * 0.15;
      groupRef.current.rotation.y = t * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <TargetRoleCore />
      <OrbitRing radius={2.2} tilt={[0.2, 0, 0]} color="#1E3A8A" />
      <OrbitRing radius={3.2} tilt={[-0.25, 0.15, 0]} color="#2563EB" />
      <OrbitRing radius={4.2} tilt={[0.15, -0.3, 0]} color="#334778" />

      {SKILL_NODES.map((skill, index) => (
        <OrbitingNode key={index} skill={skill} onHover={onHover} />
      ))}

      <ParticleField />
    </group>
  );
};

/**
 * Fallback visual if WebGL is disabled in browser or in headless environments
 */
const CosmicSceneFallback = () => (
  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-navy-900 to-navy-950 rounded-3xl border border-navy-800 relative overflow-hidden">
    <div className="relative w-40 h-40 flex items-center justify-center mb-4">
      {/* Outer Orbit */}
      <div className="absolute inset-0 rounded-full border border-brand-blue/30 animate-spin-slow" />
      {/* Middle Orbit */}
      <div className="absolute inset-4 rounded-full border border-dashed border-cyan-400/30 animate-spin-reverse" />
      {/* Target Core */}
      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-blue to-cyan-400 flex items-center justify-center shadow-glow-blue animate-pulse">
        <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping" />
      </div>
      {/* Orbiting Dots */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-status-success shadow-glow-success" title="Matched Skill" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-brand-gold shadow-glow-gold" title="Growth Gap" />
      <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 rounded-full bg-status-danger shadow-glow-danger" title="Missing Capability" />
      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 rounded-full bg-brand-blue-light shadow-glow-blue" title="Target Skill" />
    </div>

    <p className="font-heading font-bold text-slate-100 text-base">3D Skill Orbit Visualizer</p>
    <p className="text-xs text-slate-400 max-w-xs mt-1">
      Active Target Role matching across 18 competency benchmarks
    </p>
  </div>
);

/**
 * Main 3D Hero Scene Container
 */
export const SkillUniverseScene = () => {
  const [activeSkill, setActiveSkill] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });

  // Safe client-side WebGL test
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setIsSupported(false);
      }
    } catch (e) {
      setIsSupported(false);
    }
  }, []);

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setPointerPos({ x, y });
  };

  return (
    <div 
      onMouseMove={handlePointerMove}
      className="relative w-full h-[460px] md:h-[540px] rounded-3xl overflow-hidden bg-gradient-to-b from-navy-900/40 via-navy-950/80 to-navy-950 border border-navy-700/60 shadow-2xl backdrop-blur-sm"
    >
      {/* Active Skill Hover HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="px-3.5 py-2 rounded-xl bg-navy-900/90 border border-navy-700/80 backdrop-blur-md shadow-lg flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-blue shadow-glow-blue animate-pulse" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
              Role Focus: <span className="text-white font-semibold">AI Application Engineer</span>
            </p>
            {activeSkill ? (
              <p className="text-xs font-semibold text-slate-100 mt-0.5">
                <span style={{ color: activeSkill.color }}>●</span> {activeSkill.name} — <span className="font-mono text-slate-300">{activeSkill.type}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                Hover nodes to inspect match strength
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Legend at bottom right */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none hidden sm:flex flex-col gap-1.5 p-3 rounded-xl bg-navy-900/85 border border-navy-800 text-[11px] font-mono text-slate-300 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-success shadow-glow-success" />
          <span>Matched Skill (High)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-gold shadow-glow-gold" />
          <span>Growth Gap (Moderate)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-status-danger shadow-glow-danger" />
          <span>Missing Capability</span>
        </div>
      </div>

      {/* 3D R3F Canvas wrapped in CanvasErrorBoundary */}
      {!isSupported ? (
        <CosmicSceneFallback />
      ) : (
        <CanvasErrorBoundary fallback={<CosmicSceneFallback />}>
          <Canvas
            camera={{ position: [0, 3.5, 7.5], fov: 45 }}
            onCreated={({ gl }) => {
              try {
                gl.setClearColor(0x060913, 0);
              } catch (e) {}
            }}
            className="w-full h-full cursor-crosshair"
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <pointLight position={[-10, -10, -5]} color="#0066FF" intensity={0.5} />

            <SceneContent onHover={setActiveSkill} />
            <CameraRig pointerPos={pointerPos} />
          </Canvas>
        </CanvasErrorBoundary>
      )}
    </div>
  );
};

export default SkillUniverseScene;
