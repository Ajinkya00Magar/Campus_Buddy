'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, Sparkles } from '@react-three/drei'

export default function Canvas3D() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }} className="w-full h-full pointer-events-none">
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} />
      <Environment preset="city" />
      <Sparkles count={150} scale={15} size={3} speed={0.2} opacity={0.3} color="#10b981" />
      <Sparkles count={50} scale={10} size={5} speed={0.1} opacity={0.1} color="#8b5cf6" />
    </Canvas>
  )
}
