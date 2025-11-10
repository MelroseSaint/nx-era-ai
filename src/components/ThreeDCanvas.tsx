"use client";

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Line } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';

interface InteractiveTextProps {
  children: string;
  position?: [number, number, number];
  color?: string;
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ children, position = [0, 0, 0], color = '#FFD700' }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
      // Continuous rotation
      meshRef.current.rotation.y += 0.005;
      // Scale on hover
      meshRef.current.scale.setScalar(hovered ? 1.1 : 1);
    }
  });

  return (
    <Text
      ref={meshRef}
      position={position}
      fontSize={0.8}
      color={color}
      anchorX="center"
      anchorY="middle"
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {children}
    </Text>
  );
};

const LaserGrid: React.FC = () => {
  const lineRef = useRef<any>(null); // Using 'any' for simplicity with Line component
  const points = useRef<Vector3[]>([]);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const time = clock.getElapsedTime();
      const speed = 0.5;
      const amplitude = 0.5;
      const frequency = 2;

      // Generate dynamic points for the laser grid
      points.current = [];
      for (let i = -5; i <= 5; i += 1) {
        // Horizontal lines
        points.current.push(new Vector3(-5, i * 0.5, Math.sin(time * speed + i * frequency) * amplitude));
        points.current.push(new Vector3(5, i * 0.5, Math.sin(time * speed + i * frequency) * amplitude));
        points.current.push(new Vector3(NaN, NaN, NaN)); // Break for new line

        // Vertical lines
        points.current.push(new Vector3(i * 0.5, -5, Math.cos(time * speed + i * frequency) * amplitude));
        points.current.push(new Vector3(i * 0.5, 5, Math.cos(time * speed + i * frequency) * amplitude));
        points.current.push(new Vector3(NaN, NaN, NaN)); // Break for new line
      }
      lineRef.current.setPoints(points.current);
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[]} // Initial empty points
      color="#00FFFF" // Cyan laser color
      lineWidth={1}
      dashed={false}
    />
  );
};

const ThreeDCanvas: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ width: '100%', height: '300px', borderRadius: '0.5rem', background: 'linear-gradient(145deg, #1a1a2e, #16213e)' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <InteractiveText>VibeCoder AI</InteractiveText>
      <LaserGrid />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
};

export default ThreeDCanvas;