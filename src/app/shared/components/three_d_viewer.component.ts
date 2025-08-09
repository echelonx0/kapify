// src/app/shared/components/three-d-viewer.component.ts
import { Component, ElementRef, ViewChild, OnInit, OnDestroy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';

@Component({
  selector: 'app-three-d-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <!-- 3D Canvas Container -->
      <div #canvasContainer class="w-full h-full"></div>
      
      <!-- Loading Overlay -->
      @if (isLoading) {
        <div class="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p class="text-sm text-blue-400 font-medium">Loading 3D Model...</p>
          </div>
        </div>
      }
      
      <!-- Error State -->
      @if (hasError) {
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="text-center text-blue-400">
            <div class="w-16 h-16 mx-auto mb-4 bg-blue-900/20 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <p class="font-medium mb-2">3D Model Unavailable</p>
            <p class="text-sm opacity-60">Using fallback visualization</p>
          </div>
        </div>
      }
      
      <!-- Controls Hint -->
      @if (!isLoading && !hasError) {
        <div class="absolute bottom-4 left-4 bg-blue-900/30 backdrop-blur-sm text-blue-200 text-xs px-3 py-2 rounded-full border border-blue-500/30">
          Click & drag to rotate • Scroll to zoom
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
  `]
})
export class ThreeDViewerComponent implements OnInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;
  
  // Inputs
  objUrl = input<string>('');
  modelScale = input<number>(1);
  autoRotate = input<boolean>(true);
  showMeshSphere = input<boolean>(true);
  
  // Three.js objects
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private model: THREE.Object3D | null = null;
  private meshSphere: THREE.Mesh | null = null;
  private particleSystem: THREE.Points | null = null;
  private animationId: number = 0;
  
  // Component state
  isLoading = true;
  hasError = false;
  
  // Mouse interaction
  private mouse = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  
  ngOnInit() {
    this.initThreeJS();
    this.createMeshSphere();
    this.createParticleField();
    this.loadModel();
    this.animate();
  }
  
  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
  
  private initThreeJS() {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000010); // Dark blue-black
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 15);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    container.appendChild(this.renderer.domElement);
    
    // Lighting for sphere mesh effect
    this.setupLighting();
    
    // Controls
    this.setupControls();
    
    // Handle resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  private setupLighting() {
    // Ambient light (low intensity for atmosphere)
    const ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
    this.scene.add(ambientLight);
    
    // Blue rim light
    const rimLight = new THREE.DirectionalLight(0x4a9eff, 1.2);
    rimLight.position.set(10, 10, 5);
    this.scene.add(rimLight);
    
    // Accent lights
    const accentLight1 = new THREE.PointLight(0x00a8ff, 0.8, 50);
    accentLight1.position.set(-15, 0, 0);
    this.scene.add(accentLight1);
    
    const accentLight2 = new THREE.PointLight(0xff6b6b, 0.6, 50);
    accentLight2.position.set(15, 0, 0);
    this.scene.add(accentLight2);
  }
  
  private createMeshSphere() {
    if (!this.showMeshSphere()) return;
    
    // Create sphere with wireframe
    const sphereGeometry = new THREE.SphereGeometry(8, 32, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    
    this.meshSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.meshSphere);
    
    // Add inner glow sphere
    const glowGeometry = new THREE.SphereGeometry(7.8, 16, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a4a8a,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(glowSphere);
  }
  
  private createParticleField() {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Random positions in sphere
      const radius = Math.random() * 20 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      // Color variation (blue to red)
      const colorChoice = Math.random();
      if (colorChoice < 0.7) {
        colors[i * 3] = 0.3 + Math.random() * 0.7; // Blue-ish
        colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
        colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3] = 1; // Red-ish
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
        colors[i * 3 + 2] = 0.4 + Math.random() * 0.3;
      }
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particleSystem);
  }
  
  private setupControls() {
    const canvas = this.renderer.domElement;
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    
    canvas.addEventListener('mousedown', (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });
    
    canvas.addEventListener('mousemove', (event) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      // Rotate entire scene
      if (this.meshSphere) {
        this.meshSphere.rotation.y += deltaX * 0.01;
        this.meshSphere.rotation.x += deltaY * 0.01;
      }
      
      if (this.particleSystem) {
        this.particleSystem.rotation.y += deltaX * 0.005;
        this.particleSystem.rotation.x += deltaY * 0.005;
      }
      
      if (this.model) {
        this.model.rotation.y += deltaX * 0.01;
        this.model.rotation.x += deltaY * 0.01;
      }
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    });
    
    canvas.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
    
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      this.camera.position.multiplyScalar(scale);
      this.camera.position.clampLength(8, 30);
    });
  }
  
  private async loadModel() {
    try {
      if (this.objUrl()) {
        // Load glTF file using GLTFLoader (built-in to Three.js)
        await this.loadGLTFModel();
      } else {
        await this.createFallbackModel();
      }
      this.isLoading = false;
    } catch (error) {
      console.error('Error loading 3D model:', error);
      await this.createFallbackModel();
      this.hasError = true;
      this.isLoading = false;
    }
  }
  
  private async loadGLTFModel(): Promise<void> {
    // Import GLTFLoader (built into Three.js)
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        this.objUrl(), // Now expects .gltf file
        (gltf) => {
          const model = gltf.scene;
          model.scale.setScalar(this.modelScale());
          model.position.set(0, 0, 0);
          
          // Apply materials to loaded model
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.material) {
                // Enhance existing materials
                child.material.transparent = true;
                child.material.opacity = 0.9;
              } else {
                // Apply default material
                child.material = new THREE.MeshPhongMaterial({
                  color: 0xffffff,
                  shininess: 100,
                  transparent: true,
                  opacity: 0.9
                });
              }
            }
          });
          
          this.model = model;
          this.scene.add(this.model);
          resolve();
        },
        (progress) => {
          console.log('Loading progress:', progress);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }
  
  private async createFallbackModel(): Promise<void> {
    // Create a simple geometric model that works well with the sphere
    const group = new THREE.Group();
    
    // Central crystal-like structure
    const crystalGeometry = new THREE.OctahedronGeometry(1.5);
    const crystalMaterial = new THREE.MeshPhongMaterial({
      color: 0x00d4ff,
      shininess: 100,
      transparent: true,
      opacity: 0.8,
      emissive: 0x001122
    });
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
    group.add(crystal);
    
    // Orbiting elements
    for (let i = 0; i < 6; i++) {
      const orbitGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const orbitMaterial = new THREE.MeshPhongMaterial({
        color: i % 2 === 0 ? 0xff6b6b : 0x4a9eff,
        shininess: 100,
        emissive: i % 2 === 0 ? 0x220000 : 0x000022
      });
      const orbitSphere = new THREE.Mesh(orbitGeometry, orbitMaterial);
      
      const angle = (i / 6) * Math.PI * 2;
      orbitSphere.position.set(
        Math.cos(angle) * 3,
        Math.sin(angle * 0.5) * 2,
        Math.sin(angle) * 3
      );
      
      group.add(orbitSphere);
    }
    
    group.scale.setScalar(this.modelScale());
    this.model = group;
    this.scene.add(this.model);
    
    return Promise.resolve();
  }
  
  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    // Auto-rotate mesh sphere
    if (this.autoRotate() && this.meshSphere) {
      this.meshSphere.rotation.y += 0.002;
      this.meshSphere.rotation.x += 0.001;
    }
    
    // Animate particles
    if (this.particleSystem && this.autoRotate()) {
      this.particleSystem.rotation.y += 0.001;
    }
    
    // Animate model
    if (this.model && this.autoRotate()) {
      this.model.rotation.y += 0.005;
      
      // Animate orbiting elements
      this.model.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && index > 0) {
          child.rotation.y += 0.02;
          child.position.y += Math.sin(time + index) * 0.01;
        }
      });
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  private onWindowResize() {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}