// 3D Avatar Module using Three.js
export class Avatar3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.avatar = null;
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        this.clock = new THREE.Clock();
        this.container = null;
        this.quality = 'high';
        this.isInitialized = false;
    }
    
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }
        
        // Initialize Three.js scene
        this.setupScene();
        this.setupLighting();
        this.setupControls();
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        this.isInitialized = true;
        console.log('3D Avatar system initialized');
    }
    
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
        
        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: this.quality === 'high',
            alpha: true 
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = this.quality === 'high';
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = this.quality === 'high';
        mainLight.shadow.camera.near = 0.1;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -10;
        mainLight.shadow.camera.right = 10;
        mainLight.shadow.camera.top = 10;
        mainLight.shadow.camera.bottom = -10;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4080ff, 0.3);
        fillLight.position.set(-5, 3, -5);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
        rimLight.position.set(0, 3, -5);
        this.scene.add(rimLight);
    }
    
    setupControls() {
        // Simple rotation controls
        let isDragging = false;
        let previousMouseX = 0;
        let targetRotationY = 0;
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMouseX = e.clientX;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging || !this.avatar) return;
            
            const deltaX = e.clientX - previousMouseX;
            targetRotationY += deltaX * 0.01;
            previousMouseX = e.clientX;
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        this.renderer.domElement.addEventListener('mouseleave', () => {
            isDragging = false;
        });
        
        // Touch controls
        this.renderer.domElement.addEventListener('touchstart', (e) => {
            isDragging = true;
            previousMouseX = e.touches[0].clientX;
        });
        
        this.renderer.domElement.addEventListener('touchmove', (e) => {
            if (!isDragging || !this.avatar) return;
            
            const deltaX = e.touches[0].clientX - previousMouseX;
            targetRotationY += deltaX * 0.01;
            previousMouseX = e.touches[0].clientX;
        });
        
        this.renderer.domElement.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        // Smooth rotation in animation loop
        this.targetRotationY = targetRotationY;
    }
    
    async loadAvatar(companionId, avatarType) {
        // Show loading indicator
        this.showLoading(true);
        
        // Remove existing avatar
        if (this.avatar) {
            this.scene.remove(this.avatar);
            this.avatar = null;
        }
        
        try {
            // Option 1: Ready Player Me Integration
            if (avatarType === 'readyplayerme') {
                // Example Ready Player Me avatar URL
                const avatarUrl = 'https://models.readyplayer.me/YOUR_AVATAR_ID.glb';
                await this.loadReadyPlayerMeAvatar(avatarUrl);
            }
            // Option 2: Custom GLTF/GLB models
            else if (avatarType === 'custom') {
                await this.loadCustomModel('/assets/avatars/my-character.glb');
            }
            // Option 3: VRM models (popular for anime-style avatars)
            else if (avatarType === 'vrm') {
                await this.loadVRMModel('/assets/avatars/my-character.vrm');
            }
            // Default: Simple procedural avatar
            else {
                this.avatar = this.createSimpleAvatar(avatarType);
                this.scene.add(this.avatar);
            }
            
            // Setup animations
            this.setupAnimations();
            
            // Play idle animation
            this.playAnimation('idle');
            
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to load avatar:', error);
            this.showLoading(false);
            this.showError('Failed to load avatar');
        }
    }
    
    createSimpleAvatar(type) {
        const group = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: type === 'realistic' ? 0x4a5568 : 
                   type === 'anime' ? 0xff69b4 : 0x10b981,
            roughness: 0.5,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.8;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xfdbcb4,
            roughness: 0.7,
            metalness: 0
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        head.castShadow = true;
        group.add(head);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.1,
            metalness: 0.8
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.08, 1.52, 0.2);
        group.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.08, 1.52, 0.2);
        group.add(rightEye);
        
        // Add some personality based on type
        if (type === 'anime') {
            // Larger eyes for anime style
            leftEye.scale.set(1.5, 1.5, 1.5);
            rightEye.scale.set(1.5, 1.5, 1.5);
        }
        
        // Store references for animations
        group.userData = {
            head,
            body,
            leftEye,
            rightEye
        };
        
        return group;
    }
    
    setupAnimations() {
        // Define simple animations
        this.animations = {
            idle: () => {
                if (!this.avatar) return;
                const time = Date.now() * 0.001;
                const { head, body } = this.avatar.userData;
                
                // Gentle breathing
                body.scale.y = 1 + Math.sin(time * 2) * 0.02;
                body.position.y = 0.8 + Math.sin(time * 2) * 0.01;
                
                // Subtle head movement
                head.rotation.y = Math.sin(time * 0.5) * 0.1;
                head.rotation.x = Math.sin(time * 0.7) * 0.05;
            },
            
            talking: () => {
                if (!this.avatar) return;
                const time = Date.now() * 0.001;
                const { head, body } = this.avatar.userData;
                
                // More active movement
                body.scale.y = 1 + Math.sin(time * 4) * 0.03;
                head.rotation.y = Math.sin(time * 2) * 0.15;
                head.rotation.x = Math.sin(time * 3) * 0.1;
                
                // Simulate mouth movement (scale head slightly)
                head.scale.y = 1 + Math.sin(time * 10) * 0.05;
            },
            
            thinking: () => {
                if (!this.avatar) return;
                const time = Date.now() * 0.001;
                const { head, body } = this.avatar.userData;
                
                // Thoughtful pose
                head.rotation.x = -0.2;
                head.rotation.y = Math.sin(time * 0.3) * 0.2;
                body.rotation.y = Math.sin(time * 0.2) * 0.1;
            },
            
            happy: () => {
                if (!this.avatar) return;
                const time = Date.now() * 0.001;
                const { head, body } = this.avatar.userData;
                
                // Bouncy movement
                body.position.y = 0.8 + Math.abs(Math.sin(time * 3)) * 0.1;
                head.rotation.z = Math.sin(time * 4) * 0.1;
                body.scale.set(
                    1 + Math.sin(time * 5) * 0.05,
                    1 + Math.cos(time * 5) * 0.05,
                    1 + Math.sin(time * 5) * 0.05
                );
            }
        };
    }
    
    playAnimation(animationName) {
        if (this.animations[animationName]) {
            this.currentAnimation = animationName;
            console.log('Playing animation:', animationName);
        }
    }
    
    setExpression(emotion) {
        // Map emotions to animations
        const emotionAnimations = {
            happy: 'happy',
            sad: 'idle',
            excited: 'happy',
            thinking: 'thinking',
            neutral: 'idle'
        };
        
        const animation = emotionAnimations[emotion] || 'idle';
        this.playAnimation(animation);
    }
    
    rotate(degrees) {
        if (this.avatar) {
            this.targetRotationY = this.avatar.rotation.y + (degrees * Math.PI / 180);
        }
    }
    
    resetView() {
        if (this.avatar) {
            this.targetRotationY = 0;
        }
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1, 0);
    }
    
    setQuality(quality) {
        this.quality = quality;
        
        if (this.renderer) {
            this.renderer.antialias = quality === 'high';
            this.renderer.shadowMap.enabled = quality === 'high';
            
            // Recreate renderer
            this.container.removeChild(this.renderer.domElement);
            this.setupScene();
            
            // Reload avatar if exists
            if (this.avatar) {
                const avatarType = this.avatar.userData.type || 'realistic';
                this.loadAvatar(this.avatar.userData.companionId, avatarType);
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update animations
        if (this.currentAnimation && this.animations[this.currentAnimation]) {
            this.animations[this.currentAnimation]();
        }
        
        // Smooth rotation
        if (this.avatar && this.targetRotationY !== undefined) {
            this.avatar.rotation.y += (this.targetRotationY - this.avatar.rotation.y) * 0.1;
        }
        
        // Update mixer if we have one (for loaded animations)
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    showLoading(show) {
        const existingLoader = this.container.querySelector('.avatar-3d-loading');
        
        if (show && !existingLoader) {
            const loader = document.createElement('div');
            loader.className = 'avatar-3d-loading';
            loader.innerHTML = `
                <div class="avatar-3d-loading-spinner"></div>
                <div class="avatar-3d-loading-text">Loading avatar...</div>
            `;
            this.container.appendChild(loader);
        } else if (!show && existingLoader) {
            existingLoader.remove();
        }
    }
    
    showError(message) {
        const error = document.createElement('div');
        error.className = 'avatar-3d-error';
        error.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: var(--error-color);
        `;
        error.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <p>${message}</p>
        `;
        
        this.container.appendChild(error);
        
        setTimeout(() => error.remove(), 5000);
    }
    
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.scene) {
            this.scene.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        
        window.removeEventListener('resize', this.onWindowResize);
    }

    // Ready Player Me loader
    async loadReadyPlayerMeAvatar(url) {
        const loader = new THREE.GLTFLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (gltf) => {
                    this.avatar = gltf.scene;
                    this.avatar.scale.set(1, 1, 1);
                    this.avatar.position.set(0, 0, 0);
                    
                    // Setup animations if available
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                        this.animations.clips = gltf.animations;
                    }
                    
                    this.scene.add(this.avatar);
                    resolve();
                },
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%');
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
    
    // Custom GLTF/GLB model loader
    async loadCustomModel(path) {
        const loader = new THREE.GLTFLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(
                path,
                (gltf) => {
                    this.avatar = gltf.scene;
                    this.scene.add(this.avatar);
                    
                    // Setup animation mixer
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                        
                        // Map animations by name
                        gltf.animations.forEach(clip => {
                            this.animations[clip.name] = this.mixer.clipAction(clip);
                        });
                    }
                    
                    resolve();
                },
                undefined,
                reject
            );
        });
    }
    
    // VRM model loader (requires three-vrm library)
    async loadVRMModel(path) {
        // Note: You'll need to install three-vrm
        // npm install @pixiv/three-vrm
        
        // Example implementation:
        /*
        import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
        
        const loader = new THREE.GLTFLoader();
        loader.register((parser) => new VRMLoaderPlugin(parser));
        
        const gltf = await loader.loadAsync(path);
        const vrm = gltf.userData.vrm;
        
        this.avatar = vrm.scene;
        this.vrm = vrm; // Store VRM instance for blendshape animations
        this.scene.add(this.avatar);
        */
    }
}