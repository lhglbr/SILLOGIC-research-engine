import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ResearchField } from '../types';

interface ParticleBackgroundProps {
  field?: ResearchField;
  themeColor?: string; // Explicit color override (e.g., 'blue', 'violet')
  isDarkMode: boolean;
}

// Map fields to RGB base colors
const FIELD_COLORS: Record<string, { r: number, g: number, b: number }> = {
  [ResearchField.PHYSICAL]: { r: 0.5, g: 0.0, b: 1.0 },    // Violet
  [ResearchField.LIFE]: { r: 0.0, g: 1.0, b: 0.4 },        // Emerald
  [ResearchField.FORMAL]: { r: 0.0, g: 0.8, b: 1.0 },      // Cyan
  [ResearchField.ENGINEERING]: { r: 1.0, g: 0.6, b: 0.0 }, // Amber
  [ResearchField.SOCIAL]: { r: 1.0, g: 0.2, b: 0.5 },      // Rose
  [ResearchField.GENERAL]: { r: 0.2, g: 0.4, b: 1.0 },     // Blue (Default)
};

// Map explicit color names to RGB
const THEME_RGB: Record<string, { r: number, g: number, b: number }> = {
  violet: { r: 0.5, g: 0.0, b: 1.0 },
  emerald: { r: 0.0, g: 1.0, b: 0.4 },
  cyan: { r: 0.0, g: 0.8, b: 1.0 },
  amber: { r: 1.0, g: 0.6, b: 0.0 },
  rose: { r: 1.0, g: 0.2, b: 0.5 },
  blue: { r: 0.2, g: 0.4, b: 1.0 },
};

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ field, themeColor, isDarkMode }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetColorRef = useRef({ r: 0.2, g: 0.4, b: 1.0 });

  // Refs to access THREE objects inside useEffect without dependencies issues
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    // Priority: Explicit Theme Color > Field Color > Default Blue
    if (themeColor && THEME_RGB[themeColor]) {
        targetColorRef.current = THEME_RGB[themeColor];
    } else if (field && FIELD_COLORS[field]) {
        targetColorRef.current = FIELD_COLORS[field];
    } else {
        targetColorRef.current = THEME_RGB['blue'];
    }
  }, [field, themeColor]);

  // Update scene based on Dark Mode
  useEffect(() => {
    if (sceneRef.current && rendererRef.current && materialRef.current) {
        const bgHex = isDarkMode ? 0x000000 : 0xf9fafb; // Black vs Gray-50
        sceneRef.current.fog = new THREE.FogExp2(bgHex, 0.002);
        
        // Use blending that works for the mode
        // Additive looks great on black (glowing). 
        // Normal/Multiply is better for white (dots).
        materialRef.current.blending = isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending;
        materialRef.current.opacity = isDarkMode ? 0.9 : 0.6;
        materialRef.current.needsUpdate = true;
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Setup ---
    const scene = new THREE.Scene();
    const bgHex = isDarkMode ? 0x000000 : 0xf9fafb;
    scene.fog = new THREE.FogExp2(bgHex, 0.002); 
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 80;
    camera.position.y = 20;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); 
    rendererRef.current = renderer;
    
    renderer.domElement.style.display = 'block';
    
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    // --- Particles & Geometry ---
    const particleCount = 30000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const initialColorParams = new Float32Array(particleCount * 3); // Store base gradient params
    
    // Store different shapes
    const shapes: Float32Array[] = [];
    const SHAPE_COUNT = 8;
    
    // 1. Random Sphere (Initial)
    const shape0 = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 40 + Math.random() * 5;
        shape0[i*3] = r * Math.sin(phi) * Math.cos(theta);
        shape0[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        shape0[i*3+2] = r * Math.cos(phi);
        
        positions[i*3] = shape0[i*3];
        positions[i*3+1] = shape0[i*3+1];
        positions[i*3+2] = shape0[i*3+2];
        
        // Store relative position factors for color gradients later
        initialColorParams[i*3] = (shape0[i*3] / r) + 0.5;   // x factor
        initialColorParams[i*3+1] = (shape0[i*3+1] / r) + 0.5; // y factor
        initialColorParams[i*3+2] = (shape0[i*3+2] / r) + 0.5; // z factor

        // Initial Generic Blue
        colors[i*3] = 0.1;
        colors[i*3+1] = 0.5;
        colors[i*3+2] = 0.9;
    }
    shapes.push(shape0);

    // 2. Butterfly Curve
    const shape1 = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++){
        const t = (i / particleCount) * 100 * Math.PI;
        const expr = Math.exp(Math.cos(t)) - 2*Math.cos(4*t) - Math.pow(Math.sin(t/12), 5);
        const x = Math.sin(t) * expr;
        const y = Math.cos(t) * expr;
        const z = Math.sin(t/5) * 10;
        const scale = 15;
        shape1[i*3] = x * scale;
        shape1[i*3+1] = y * scale;
        shape1[i*3+2] = z * scale * 0.3;
    }
    shapes.push(shape1);

    // 3. Helix / Spring
    const shape2 = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++){
        const t = (i / particleCount) * 50 * Math.PI;
        const r = 0.5 * t;
        const x = r * Math.cos(t);
        const z = r * Math.sin(t);
        const y = (i / particleCount) * 80 - 40;
        shape2[i*3] = x * 0.5;
        shape2[i*3+1] = y;
        shape2[i*3+2] = z * 0.5;
    }
    shapes.push(shape2);

    // 4. Rose Curve
    const shape3 = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++){
         const k = 4; 
         const t = (i / particleCount) * 20 * Math.PI;
         const r = 30 * Math.cos(k * t);
         const x = r * Math.cos(t);
         const y = r * Math.sin(t);
         const z = 15 * Math.sin(t * 3);
         shape3[i*3] = x;
         shape3[i*3+1] = y;
         shape3[i*3+2] = z;
    }
    shapes.push(shape3);

    // 5. Lemniscate
    const shape4 = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++){
        const t = (i / particleCount) * 2 * Math.PI;
        const scale = 40;
        const denom = 1 + Math.sin(t)*Math.sin(t);
        const x = scale * Math.cos(t) / denom;
        const y = scale * Math.sin(t) * Math.cos(t) / denom;
        const z = (Math.random() - 0.5) * 10;
        shape4[i*3] = x;
        shape4[i*3+1] = y;
        shape4[i*3+2] = z;
    }
    shapes.push(shape4);

    // 6. Saddle
    const shape5 = new Float32Array(particleCount * 3);
    const side = Math.sqrt(particleCount);
    for(let i=0; i<particleCount; i++){
        const row = Math.floor(i / side);
        const col = i % side;
        const u = (row / side - 0.5) * 60;
        const v = (col / side - 0.5) * 60;
        const x = u;
        const z = v;
        const y = (u*u - v*v) / 30;
        shape5[i*3] = x;
        shape5[i*3+1] = y;
        shape5[i*3+2] = z;
    }
    shapes.push(shape5);

    // 7. Maxwell EM Wave
    const shape6 = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++){
        const x = (i / particleCount) * 140 - 70; // Long propagation axis
        const freq = 0.12;
        const amp = 15;
        
        // Split particles: half for E-field (Vertical), half for B-Field (Horizontal)
        if (i % 2 === 0) {
            // E-Field: Sinusoidal in Y, 0 in Z
            const y = amp * Math.sin(x * freq);
            const z = (Math.random() - 0.5) * 2; // Slight jitter/thickness
            shape6[i*3] = x;
            shape6[i*3+1] = y;
            shape6[i*3+2] = z;
        } else {
            // B-Field: Sinusoidal in Z, 0 in Y
            const z = amp * Math.sin(x * freq);
            const y = (Math.random() - 0.5) * 2; // Slight jitter/thickness
            shape6[i*3] = x;
            shape6[i*3+1] = y;
            shape6[i*3+2] = z;
        }
    }
    shapes.push(shape6);

    // 8. Archimedean Spiral (Planar Galaxy)
    const shape7 = new Float32Array(particleCount * 3);
    for(let i=0; i<particleCount; i++){
        const arm = i % 3;
        const pointsPerArm = particleCount / 3;
        const t = (Math.floor(i/3) / pointsPerArm) * 12 * Math.PI; 
        
        const r = 2 + 0.8 * t;
        const angle = t + (arm * (2 * Math.PI / 3)); 
        
        const x = r * Math.cos(angle);
        const z = r * Math.sin(angle);
        const y = (Math.random() - 0.5) * (r * 0.2); 
        
        shape7[i*3] = x;
        shape7[i*3+1] = y;
        shape7[i*3+2] = z;
    }
    shapes.push(shape7);

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const getTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        if(context) {
            const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
            gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            context.fillStyle = gradient;
            context.fillRect(0,0,32,32);
        }
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    };

    const material = new THREE.PointsMaterial({
      size: 1.0,
      vertexColors: true,
      map: getTexture(),
      blending: isDarkMode ? THREE.AdditiveBlending : THREE.NormalBlending, // Switch blending for light mode visibility
      depthWrite: false,
      transparent: true,
      opacity: isDarkMode ? 0.9 : 0.6
    });
    materialRef.current = material;

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // --- Animation Logic ---
    let currentShapeIndex = 0;
    let nextShapeIndex = 1;
    let transitionProgress = 0;
    const transitionDuration = 400; 
    const stayDuration = 250; 
    let timer = 0;
    
    // Color Lerp State
    let currentR = 0.2, currentG = 0.4, currentB = 1.0;

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Rotate
      particles.rotation.y += 0.001;
      particles.rotation.z += 0.0005;

      // Color Transition Logic
      const target = targetColorRef.current;
      currentR += (target.r - currentR) * 0.02;
      currentG += (target.g - currentG) * 0.02;
      currentB += (target.b - currentB) * 0.02;

      const posAttr = particles.geometry.attributes.position;
      const colAttr = particles.geometry.attributes.color;
      const currentPositions = posAttr.array as Float32Array;
      const currentColors = colAttr.array as Float32Array;
      
      // Shape Morphing
      if (timer > stayDuration) {
          transitionProgress += 1 / transitionDuration;
          if (transitionProgress >= 1) {
              transitionProgress = 0;
              timer = 0;
              currentShapeIndex = nextShapeIndex;
              nextShapeIndex = (nextShapeIndex + 1) % SHAPE_COUNT;
          }
      } else {
          timer++;
      }

      const sourceShape = shapes[currentShapeIndex];
      const targetShape = shapes[nextShapeIndex];
      
      const ease = (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const alpha = ease(transitionProgress);

      for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          
          if (transitionProgress > 0) {
              currentPositions[idx] = sourceShape[idx] + (targetShape[idx] - sourceShape[idx]) * alpha;
              currentPositions[idx+1] = sourceShape[idx+1] + (targetShape[idx+1] - sourceShape[idx+1]) * alpha;
              currentPositions[idx+2] = sourceShape[idx+2] + (targetShape[idx+2] - sourceShape[idx+2]) * alpha;
          }

          const variation = initialColorParams[idx]; 
          
          // In Light mode, we want darker colors (closer to 0) for visibility on white
          // In Dark mode, we want bright colors (closer to target) for glow
          if (isDarkMode) {
              currentColors[idx]   = currentR * (0.2 + variation * 0.8);
              currentColors[idx+1] = currentG * (0.2 + variation * 0.8);
              currentColors[idx+2] = currentB * (0.2 + variation * 0.8);
          } else {
              // Inverse brightness + Saturation boost for light mode
              // Making them look like "Ink" points
              currentColors[idx]   = currentR * 0.8;
              currentColors[idx+1] = currentG * 0.8;
              currentColors[idx+2] = currentB * 0.8;
          }
      }
      
      if (transitionProgress > 0) posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current) {
         while (mountRef.current.firstChild) {
            mountRef.current.removeChild(mountRef.current.firstChild);
         }
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [isDarkMode]); // Re-run effect if dark mode toggles to update context/materials

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 bg-transparent pointer-events-none" />;
};

export default ParticleBackground;