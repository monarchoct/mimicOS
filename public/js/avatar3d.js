// 3D Avatar Module - Comprehensive System
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
        
        // Avatar-specific properties
        this.vrm = null; // For VRM avatars
        this.morphTargets = {}; // For facial expressions
        this.bones = {}; // For procedural animations
        
        // Loaders
        this.gltfLoader = null;
        this.vrmLoader = null;
    }
    
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return;
        }
        
        // Initialize loaders
        this.initLoaders();
        
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
    
    initLoaders() {
        // GLTF Loader for GLB/GLTF files
        this.gltfLoader = new THREE.GLTFLoader();
        
        // Add DRACOLoader for compressed models (optional but recommended)
        const dracoLoader = new THREE.DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        this.gltfLoader.setDRACOLoader(dracoLoader);
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
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        
        this.container.appendChild(this.renderer.domElement);
        
        // Add ground plane for shadows
        const groundGeometry = new THREE.PlaneGeometry(10, 10);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
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
        this.targetRotationY = 0;
        
        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            previousMouseX = e.clientX;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isDragging || !this.avatar) return;
            
            const deltaX = e.clientX - previousMouseX;
            this.targetRotationY += deltaX * 0.01;
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
            this.targetRotationY += deltaX * 0.01;
            previousMouseX = e.touches[0].clientX;
        });
        
        this.renderer.domElement.addEventListener('touchend', () => {
            isDragging = false;
        });
    }
    
    async loadAvatar(companionId, avatarType, avatarData = {}) {
        // Show loading indicator
        this.showLoading(true);
        
        // Remove existing avatar
        if (this.avatar) {
            this.scene.remove(this.avatar);
            this.avatar = null;
            this.vrm = null;
            this.morphTargets = {};
            this.bones = {};
        }
        
        try {
            switch (avatarType) {
                case 'readyplayerme':
                    await this.loadReadyPlayerMeAvatar(avatarData.url || avatarData.avatarId);
                    break;
                    
                case 'custom':
                    await this.loadCustomModel(avatarData.modelPath || '/assets/avatars/default.glb');
                    break;
                    
                case 'vrm':
                    await this.loadVRMModel(avatarData.vrmPath || '/assets/avatars/default.vrm');
                    break;
                    
                case 'mixamo':
                    await this.loadMixamoCharacter(avatarData);
                    break;
                    
                case 'vroid':
                    await this.loadVRoidModel(avatarData.vroidPath);
                    break;
                    
                default:
                    // Fallback to simple avatar
                    this.avatar = this.createSimpleAvatar(avatarType);
                    this.scene.add(this.avatar);
            }
            
            // Setup animations based on avatar type
            this.setupAnimationsForType(avatarType);
            
            // Play idle animation
            this.playAnimation('idle');
            
            // Store avatar info
            if (this.avatar) {
                this.avatar.userData.companionId = companionId;
                this.avatar.userData.avatarType = avatarType;
            }
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('Failed to load avatar:', error);
            this.showLoading(false);
            this.showError('Failed to load avatar');
            
            // Fallback to simple avatar
            this.avatar = this.createSimpleAvatar('realistic');
            this.scene.add(this.avatar);
        }
    }
    
    // Ready Player Me Integration
    async loadReadyPlayerMeAvatar(urlOrId) {
        let avatarUrl = urlOrId;
        
        // If it's just an ID, construct the full URL
        if (!urlOrId.startsWith('http')) {
            avatarUrl = `https://models.readyplayer.me/${urlOrId}.glb`;
        }
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                avatarUrl,
                (gltf) => {
                    this.avatar = gltf.scene;
                    
                    // Scale and position
                    this.avatar.scale.set(1, 1, 1);
                    this.avatar.position.set(0, 0, 0);
                    
                    // Enable shadows
                    this.avatar.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Setup animations if available
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                        gltf.animations.forEach(clip => {
                            this.animations[clip.name] = this.mixer.clipAction(clip);
                        });
                    }
                    
                    // Extract morph targets for facial expressions
                    this.extractMorphTargets();
                    
                    // Extract bones for procedural animation
                    this.extractBones();
                    
                    this.scene.add(this.avatar);
                    resolve();
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    console.log('Loading Ready Player Me avatar:', percent.toFixed(2) + '%');
                    this.updateLoadingProgress(percent);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
    
    // Custom GLTF/GLB Model Loader
    async loadCustomModel(path) {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => {
                    this.avatar = gltf.scene;
                    
                    // Auto-scale to fit view
                    const box = new THREE.Box3().setFromObject(this.avatar);
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const scale = 2 / maxDim;
                    this.avatar.scale.multiplyScalar(scale);
                    
                    // Center the model
                    const center = box.getCenter(new THREE.Vector3());
                    this.avatar.position.sub(center.multiplyScalar(scale));
                    this.avatar.position.y = 0;
                    
                    // Enable shadows
                    this.avatar.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    // Setup animation mixer
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                        
                        // Map animations by name
                        gltf.animations.forEach(clip => {
                            this.animations[clip.name.toLowerCase()] = this.mixer.clipAction(clip);
                        });
                    }
                    
                    this.extractMorphTargets();
                    this.extractBones();
                    
                    this.scene.add(this.avatar);
                    resolve();
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    this.updateLoadingProgress(percent);
                },
                reject
            );
        });
    }
    
    // VRM Model Loader
    async loadVRMModel(path) {
        // For VRM support, you need to include the VRM loader
        // This is a simplified version - full VRM support requires additional setup
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                path,
                (gltf) => {
                    this.avatar = gltf.scene;
                    
                    // VRM specific setup
                    if (gltf.userData.vrm) {
                        this.vrm = gltf.userData.vrm;
                        
                        // Setup VRM blend shapes for expressions
                        if (this.vrm.blendShapeProxy) {
                            this.morphTargets = this.vrm.blendShapeProxy;
                        }
                    }
                    
                    // Standard setup
                    this.avatar.scale.set(1, 1, 1);
                    this.avatar.position.set(0, 0, 0);
                    
                    this.avatar.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.avatar);
                        gltf.animations.forEach(clip => {
                            this.animations[clip.name] = this.mixer.clipAction(clip);
                        });
                    }
                    
                    this.scene.add(this.avatar);
                    resolve();
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    this.updateLoadingProgress(percent);
                },
                reject
            );
        });
    }
    
    // Mixamo Character with Animations
    async loadMixamoCharacter(data) {
        const { characterPath, animationPaths = {} } = data;
        
        // Load the character model
        await this.loadCustomModel(characterPath);
        
        // Load additional animations
        const animationPromises = Object.entries(animationPaths).map(async ([name, path]) => {
            return new Promise((resolve) => {
                this.gltfLoader.load(
                    path,
                    (gltf) => {
                        if (gltf.animations && gltf.animations.length > 0) {
                            const clip = gltf.animations[0];
                            clip.name = name;
                            this.animations[name] = this.mixer.clipAction(clip);
                        }
                        resolve();
                    },
                    undefined,
                    (error) => {
                        console.warn(`Failed to load animation ${name}:`, error);
                        resolve(); // Don't fail the whole process
                    }
                );
            });
        });
        
        await Promise.all(animationPromises);
    }
    
    // VRoid Model Loader
    async loadVRoidModel(path) {
        // VRoid models are typically VRM format
        return this.loadVRMModel(path);
    }
    
    // Extract morph targets for facial expressions
    extractMorphTargets() {
        if (!this.avatar) return;
        
        this.avatar.traverse((child) => {
            if (child.isMesh && child.morphTargetDictionary) {
                Object.keys(child.morphTargetDictionary).forEach(key => {
                    this.morphTargets[key] = {
                        mesh: child,
                        index: child.morphTargetDictionary[key]
                    };
                });
            }
        });
        
        console.log('Morph targets found:', Object.keys(this.morphTargets));
    }
    
    // Extract bones for procedural animation
    extractBones() {
        if (!this.avatar) return;
        
        const boneNames = [
            'Head', 'Neck', 'Spine', 'Hips',
            'LeftArm', 'RightArm', 'LeftHand', 'RightHand',
            'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot'
        ];
        
        this.avatar.traverse((child) => {
            if (child.isBone) {
                const boneName = boneNames.find(name => 
                    child.name.toLowerCase().includes(name.toLowerCase())
                );
                if (boneName) {
                    this.bones[boneName] = child;
                }
            }
        });
        
        console.log('Bones found:', Object.keys(this.bones));
    }
    
    // Setup animations based on avatar type
    setupAnimationsForType(avatarType) {
        if (Object.keys(this.animations).length > 0) {
            // Model has built-in animations
            console.log('Using model animations:', Object.keys(this.animations));
            return;
        }
        
        // Setup procedural animations
        this.setupProceduralAnimations();
    }
    
    // Procedural animations
    setupProceduralAnimations() {
        this.animations = {
            idle: () => {
                if (!this.avatar) return;
                const time = Date.now() * 0.001;
                
                // Breathing
                if (this.bones.Spine) {
                    this.bones.Spine.rotation.x = Math.sin(time * 2) * 0.02;
                }
                
                // Subtle head movement
                if (this.bones.Head) {
                    this.bones.Head.rotation.y = Math.sin(time * 0.5) * 0.1;
                    this.bones.Head.rotation.x = Math.sin(time * 0.7) * 0.05;
                }
                
                // Blink using morph targets
                if (this.morphTargets.eyeBlinkLeft && this.morphTargets.eyeBlinkRight) {
                    const blinkValue = Math.sin(time * 5) > 0.98 ? 1 : 0;
                    this.setMorphTarget('eyeBlinkLeft', blinkValue);
                    this.setMorphTarget('eyeBlinkRight', blinkValue);
                }
            },
            
            talking: () => {
                if (!this.avatar) return;
                const time = Date.now() * 0.001;
                
                // Head movement while talking
                if (this.bones.Head) {
                    this.bones.Head.rotation.y = Math.sin(time * 2) * 0.15;
                    this.bones.Head.rotation.x = Math.sin(time * 3) * 0.1;
                }
                
                // Mouth movement
                if (this.morphTargets.mouthOpen) {
                    const mouthValue = Math.abs(Math.sin(time * 10)) * 0.5;
                    this.setMorphTarget('mouthOpen', mouthValue);
                }
                
                // Hand gestures
                if (this.bones.LeftHand) {
                    this.bones.LeftHand.rotation.z = Math.sin(time * 4) * 0.2;
                }
                if (this.bones.RightHand) {
                    this.bones.RightHand.rotation.z = -Math.sin(time * 4) * 0.2;
                }
            },
            
            thinking: () => {
                if (!this.avatar) return;
                const time = Date.now() * 0.001;
                
                // Thoughtful pose
                if (this.bones.Head) {
                    this.bones.Head.rotation.x = -0.2;
                    this.bones.Head.rotation.y = Math.sin(time * 0.3) * 0.2;
                }
                
                // Hand to chin pose
                if (this.bones.RightArm) {
                    this.bones.RightArm.rotation.z = -1.2;
                    this.bones.RightArm.rotation.x = -0.5;
                }
            },
            
            happy: () => {
                if (!this.avatar) return;
                const time = Date.now() * 0.001;
                
                // Bouncy movement
                if (this.avatar) {
                    this.avatar.position.y = Math.abs(Math.sin(time * 3)) * 0.1;
                }
                
                // Smile
                if (this.morphTargets.mouthSmile) {
                    this.setMorphTarget('mouthSmile', 0.8);
                }
                
                // Happy eyes
                if (this.morphTargets.eyeSquintLeft && this.morphTargets.eyeSquintRight) {
                    this.setMorphTarget('eyeSquintLeft', 0.5);
                    this.setMorphTarget('eyeSquintRight', 0.5);
                }
            },
            
            sad: () => {
                if (!this.avatar) return;
                
                // Drooped head
                if (this.bones.Head) {
                    this.bones.Head.rotation.x = 0.3;
                }
                
                // Sad expression
                if (this.morphTargets.mouthFrown) {
                    this.setMorphTarget('mouthFrown', 0.6);
                }
                
                if (this.morphTargets.eyesClosed) {
                    this.setMorphTarget('eyesClosed', 0.3);
                }
            }
        };
    }
    
    // Set morph target value
    setMorphTarget(name, value) {
        if (this.morphTargets[name]) {
            const { mesh, index } = this.morphTargets[name];
            mesh.morphTargetInfluences[index] = value;
        }
    }
    
    // Play animation
    playAnimation(animationName) {
        // Stop current animation
        if (this.currentAnimation && this.animations[this.currentAnimation]) {
            if (this.animations[this.currentAnimation].stop) {
                this.animations[this.currentAnimation].stop();
            }
        }
        
        // Play new animation
        if (this.animations[animationName]) {
            this.currentAnimation = animationName;
            
            // If it's a Three.js AnimationAction
            if (this.animations[animationName].play) {
                this.animations[animationName].reset().play();
            }
            // Otherwise it's a procedural animation function
            
            console.log('Playing animation:', animationName);
        }
    }
    
    // Set facial expression
    setExpression(emotion) {
        const expressions = {
            happy: {
                mouthSmile: 0.8,
                eyeSquintLeft: 0.3,
                eyeSquintRight: 0.3
            },
            sad: {
                mouthFrown: 0.6,
                eyesClosed: 0.2,
                browDownLeft: 0.4,
                browDownRight: 0.4
            },
            angry: {
                mouthFrown: 0.4,
                browDownLeft: 0.8,
                browDownRight: 0.8,
                eyeSquintLeft: 0.2,
                eyeSquintRight: 0.2
            },
            surprised: {
                mouthOpen: 0.6,
                eyeWideLeft: 0.8,
                eyeWideRight: 0.8,
                browUpLeft: 0.6,
                browUpRight: 0.6
            },
            thinking: {
                eyeLookUp: 0.5,
                browUpLeft: 0.3,
                mouthPucker: 0.2
            },
            neutral: {
                // Reset all expressions
            }
        };
        
        // Reset all morph targets
        Object.keys(this.morphTargets).forEach(key => {
            this.setMorphTarget(key, 0);
        });
        
        // Apply expression
        const expression = expressions[emotion] || expressions.neutral;
        Object.entries(expression).forEach(([target, value]) => {
            this.setMorphTarget(target, value);
        });
        
        // Also play corresponding animation
        const emotionAnimations = {
            happy: 'happy',
            sad: 'sad',
            excited: 'happy',
            thinking: 'thinking',
            neutral: 'idle'
        };
        
        const animation = emotionAnimations[emotion] || 'idle';
        this.playAnimation(animation);
    }
    
    // Lip sync for talking
    async lipSync(audioData) {
        // Basic lip sync - in production you'd use a proper lip sync library
        if (!this.morphTargets.mouthOpen) return;
        
        // Simulate lip movement
        const duration = audioData.duration || 3000;
        const startTime = Date.now();
        
        const lipSyncInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (elapsed > duration) {
                clearInterval(lipSyncInterval);
                this.setMorphTarget('mouthOpen', 0);
                return;
            }
            
            // Simple sine wave for mouth movement
            const value = Math.abs(Math.sin(elapsed * 0.01)) * 0.6;
            this.setMorphTarget('mouthOpen', value);
        }, 50);
    }
    
    // Update loading progress
    updateLoadingProgress(percent) {
        const loader = this.container.querySelector('.avatar-3d-loading');
        if (loader) {
            const text = loader.querySelector('.avatar-3d-loading-text');
            if (text) {
                text.textContent = `Loading avatar... ${percent.toFixed(0)}%`;
            }
        }
    }
    
    // Create simple avatar (fallback)
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
        
        // Store references for animations
        group.userData = {
            head,
            body,
            leftEye,
            rightEye
        };
        
        // Set as bones for procedural animation
        this.bones = {
            Head: head,
            Spine: body
        };
        
        return group;
    }
    
    // Rotate avatar
    rotate(degrees) {
        if (this.avatar) {
            this.targetRotationY = this.avatar.rotation.y + (degrees * Math.PI / 180);
        }
    }
    
    // Reset view
    resetView() {
        if (this.avatar) {
            this.targetRotationY = 0;
        }
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1, 0);
    }
    
    // Set quality
    setQuality(quality) {
        this.quality = quality;
        
        if (this.renderer) {
            this.renderer.antialias = quality === 'high';
            this.renderer.shadowMap.enabled = quality === 'high';
            
            // Update shadow quality
            if (this.scene) {
                this.scene.traverse((child) => {
                    if (child.isLight && child.shadow) {
                        child.castShadow = quality === 'high';
                    }
                });
            }
        }
    }
    
    // Animation loop
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const delta = this.clock.getDelta();
        
        // Update animations
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Update procedural animations
        if (this.currentAnimation && typeof this.animations[this.currentAnimation] === 'function') {
            this.animations[this.currentAnimation]();
        }
        
        // Smooth rotation
        if (this.avatar && this.targetRotationY !== undefined) {
            this.avatar.rotation.y += (this.targetRotationY - this.avatar.rotation.y) * 0.1;
        }
        
        // Render
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    // Window resize handler
    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    // Show loading indicator
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
    
    // Show error message
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
    
    // Cleanup
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
}