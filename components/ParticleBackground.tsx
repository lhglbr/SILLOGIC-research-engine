

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ResearchField } from '../types';

interface ParticleBackgroundProps {
  field?: ResearchField;
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

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ field }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetColorRef = useRef({ r: 0.2, g: 0.4, b: 1.0 });

  useEffect(() => {
    // Update target color when field changes
    if (field && FIELD_COLORS[field]) {
      targetColorRef.current = FIELD_COLORS[field];
    } else {
      targetColorRef.current = FIELD_COLORS[ResearchField.GENERAL];
    }
  }, [field]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002); // Darker fog for contrast

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
    const SHAPE_COUNT = 6;
    
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

    // 3. Archimedean Spiral / Helix
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
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.9
    });

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
      
      // Morph Ease
      const ease = (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const alpha = ease(transitionProgress);

      for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          
          // Position Update
          if (transitionProgress > 0) {
              currentPositions[idx] = sourceShape[idx] + (targetShape[idx] - sourceShape[idx]) * alpha;
              currentPositions[idx+1] = sourceShape[idx+1] + (targetShape[idx+1] - sourceShape[idx+1]) * alpha;
              currentPositions[idx+2] = sourceShape[idx+2] + (targetShape[idx+2] - sourceShape[idx+2]) * alpha;
          }

          // Color Update (Dynamic Gradient based on position factor + Theme color)
          const variation = initialColorParams[idx]; 
          
          currentColors[idx]   = currentR * (0.2 + variation * 0.8);
          currentColors[idx+1] = currentG * (0.2 + variation * 0.8);
          currentColors[idx+2] = currentB * (0.2 + variation * 0.8);
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
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0 bg-black pointer-events-none" />;
};

export default ParticleBackground;