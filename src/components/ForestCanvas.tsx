"use client";

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { ForestConfiguration } from '../app/page';

interface ForestCanvasProps {
  config: ForestConfiguration;
  year: number;
  setYear: (year: number) => void;
}

interface TreeProps {
  position: [number, number, number];
  size?: number;
}

const Tree: React.FC<TreeProps> = ({ position, size = 1 }) => (
  <Box position={position} scale={[0.5 * size, 2 * size, 0.5 * size]}>
    <meshStandardMaterial color="brown" />
  </Box>
);

const ForestCanvas: React.FC<ForestCanvasProps> = ({ config, year, setYear }) => {
  const growthFactor = 1 + (year - 1900) / 100;

  return (
    <div className="w-full h-full bg-gray-200">
      <div className="w-full h-96">
        <Canvas>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />
          {config.selectedTrees.map((treeId, index) => {
            const position: [number, number, number] = [index * 2 - (config.selectedTrees.length - 1), 0, 0];
            return <Tree key={treeId} position={position} size={growthFactor} />;
          })}
          <OrbitControls />
        </Canvas>
      </div>
      <div className="p-4">
        <label htmlFor="year-slider" className="block text-sm font-medium text-gray-700">
          Year: {year}
        </label>
        <input
          id="year-slider"
          type="range"
          min="1900"
          max="2100"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ForestCanvas;
