"use client"

import { useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { PerspectiveCamera, Environment, ContactShadows, Float, OrbitControls, Grid } from "@react-three/drei"
import * as THREE from "three"

function Arm() {
  const group = useRef<THREE.Group>(null)
  const baseRef = useRef<THREE.Group>(null)
  const lowerArmRef = useRef<THREE.Group>(null)
  const upperArmRef = useRef<THREE.Group>(null)
  const clawRef = useRef<THREE.Group>(null)
  const leftFingerRef = useRef<THREE.Mesh>(null)
  const rightFingerRef = useRef<THREE.Mesh>(null)

  // Materials
  const mainMaterial = new THREE.MeshStandardMaterial({ color: "#f3f4f6", roughness: 0.3, metalness: 0.8 })
  const accentMaterial = new THREE.MeshStandardMaterial({ color: "#06b6d4", roughness: 0.2, metalness: 0.5, emissive: "#06b6d4", emissiveIntensity: 0.2 })
  const jointMaterial = new THREE.MeshStandardMaterial({ color: "#18181b", roughness: 0.8, metalness: 0.2 })
  
  useFrame((state) => {
    if (!baseRef.current || !lowerArmRef.current || !upperArmRef.current || !clawRef.current || !leftFingerRef.current || !rightFingerRef.current) return

    // Smooth animation based on time instead of just mouse for visibility
    const t = state.clock.getElapsedTime()
    
    // Active "Wave" animation
    baseRef.current.rotation.y = Math.sin(t * 0.8) * 0.5 // Sweeping left/right
    lowerArmRef.current.rotation.z = Math.sin(t * 0.5) * 0.1 + 0.2
    upperArmRef.current.rotation.z = Math.cos(t * 0.5) * 0.1 - 1
    
    // Rapid waving of the claw
    clawRef.current.rotation.z = Math.sin(t * 3) * 0.3 + 0.5
    
    // Grippers pinching
    const pinch = (Math.sin(t * 4) + 1) * 0.15
    leftFingerRef.current.rotation.z = 0.1 + pinch
    rightFingerRef.current.rotation.z = -0.1 - pinch
    
    // Interactive mouse influence (subtle)
    const mouseX = (state.mouse.x * Math.PI) / 6
    const mouseY = (state.mouse.y * Math.PI) / 6
    
    baseRef.current.rotation.y += mouseX
    lowerArmRef.current.rotation.z -= mouseY
  })

  return (
    <group ref={group} position={[0, -2, 0]} scale={0.7}>
      {/* Base */}
      <group ref={baseRef}>
        <mesh position={[0, 0.2, 0]} material={jointMaterial}>
          <cylinderGeometry args={[1, 1.2, 0.4, 32]} />
        </mesh>
        
        {/* Turret */}
        <mesh position={[0, 0.8, 0]} material={mainMaterial}>
          <boxGeometry args={[1.5, 1, 1.5]} />
        </mesh>
        
        {/* Accent Strip */}
        <mesh position={[0, 0.8, 0.76]} material={accentMaterial}>
          <boxGeometry args={[1.2, 0.2, 0.05]} />
        </mesh>

        {/* Lower Arm Joint */}
        <group position={[0, 1, 0]} ref={lowerArmRef}>
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={jointMaterial}>
            <cylinderGeometry args={[0.6, 0.6, 1.8, 32]} />
          </mesh>
          
          {/* Lower Arm Segment */}
          <mesh position={[0, 1.5, 0]} material={mainMaterial}>
            <boxGeometry args={[0.8, 3.5, 0.8]} />
          </mesh>

          {/* Upper Arm Joint */}
          <group position={[0, 3.2, 0]} ref={upperArmRef}>
             <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={jointMaterial}>
              <cylinderGeometry args={[0.5, 0.5, 1.6, 32]} />
            </mesh>

            {/* Upper Arm Segment */}
            <mesh position={[0, 1.5, 0]} material={mainMaterial}>
              <boxGeometry args={[0.6, 3.5, 0.6]} />
            </mesh>
            
            {/* Claw Joint */}
            <group position={[0, 3.2, 0]} ref={clawRef}>
              <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={jointMaterial}>
                <cylinderGeometry args={[0.4, 0.4, 1.2, 32]} />
              </mesh>
              
              {/* Claw mechanism */}
              <group position={[0, 0.5, 0]}>
                 <mesh position={[0, 0.2, 0]} material={accentMaterial}>
                    <boxGeometry args={[0.8, 0.4, 0.8]} />
                 </mesh>
                 
                 {/* Left Finger */}
                 <mesh ref={leftFingerRef} position={[-0.3, 0.8, 0]} rotation={[0, 0, 0.2]} material={mainMaterial}>
                    <boxGeometry args={[0.15, 1, 0.4]} />
                 </mesh>
                 
                 {/* Right Finger */}
                 <mesh ref={rightFingerRef} position={[0.3, 0.8, 0]} rotation={[0, 0, -0.2]} material={mainMaterial}>
                    <boxGeometry args={[0.15, 1, 0.4]} />
                 </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

export function RobotArm() {
  return (
    <div className="w-full h-full min-h-[400px] bg-muted/20 rounded-xl overflow-hidden cursor-move">
      <Canvas>
        <PerspectiveCamera makeDefault position={[6, 6, 8]} fov={50} />
        
        {/* High intensity lighting to ensure visibility */}
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        <spotLight position={[-10, 10, 5]} angle={0.3} penumbra={1} intensity={2} color="#06b6d4" />
        
        <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
          <Arm />
        </Float>
        
        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={20} blur={2} />
        
        {/* Helpers to debug orientation */}
        <Grid position={[0, -2.5, 0]} args={[10, 10]} cellColor="#888" sectionColor="#06b6d4" fadeDistance={20} />
        
        <OrbitControls 
          enableZoom={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.5}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  )
}
