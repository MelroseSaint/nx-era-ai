"use client";

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import { Mesh } from 'three';

interface InteractiveTextProps {
  children: string;
  position?: [number, number, number];
  color?: string;
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ children, position = [0, 0, 0], color = '#FFD700' }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
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

const ThreeDCanvas: React.FC = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ width: '100%', height: '300px', borderRadius: '0.5rem', background: 'linear-gradient(145deg, #1a1a2e, #16213e)' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <InteractiveText>VibeCoder AI</InteractiveText>
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
};

export default ThreeDCanvas;