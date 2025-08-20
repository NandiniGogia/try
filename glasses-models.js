class GlassesRenderer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.glassesModel = null;
        this.currentFrame = 'classic';
        this.scale = 1.0;
        this.width = 1.0;
        this.heightOffset = 0;
        this.isInitialized = false;
        this.gltfLoader = null;
        this.loadedModels = new Map();
        this.canvas = null;
        this.canvasWidth = 0;
        this.canvasHeight = 0;
    }

    init(canvas) {
        try {
            this.canvas = canvas;
            this.canvasWidth = canvas.width;
            this.canvasHeight = canvas.height;
            
            // Scene setup
            this.scene = new THREE.Scene();

            // Camera setup - orthographic for overlay effect
            const aspect = canvas.width / canvas.height;
            const frustumSize = 2;
            this.camera = new THREE.OrthographicCamera(
                -frustumSize * aspect / 2, frustumSize * aspect / 2,
                frustumSize / 2, -frustumSize / 2,
                0.1, 1000
            );
            this.camera.position.set(0, 0, 5);

            // Renderer setup
            this.renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });
            this.renderer.setSize(canvas.width, canvas.height);
            this.renderer.setClearColor(0x000000, 0);

            // GLTF Loader
            this.gltfLoader = new THREE.GLTFLoader();

            // Lighting
            this.setupLighting();

            // Load initial model
            this.loadGlassesModel(this.currentFrame);

            this.isInitialized = true;
            console.log("Glasses renderer initialized");

            // Start render loop
            this.animate();
        } catch (error) {
            console.error("Error initializing glasses renderer:", error);
        }
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);
    }

    async loadGlassesModel(frameType) {
        if (this.glassesModel) {
            this.scene.remove(this.glassesModel);
        }

        this.currentFrame = frameType;

        if (frameType === 'gltf' || frameType === 'realistic') {
            await this.loadGLTFModel();
        } else {
            this.glassesModel = this.createGlassesGeometry(frameType);
            this.scene.add(this.glassesModel);
        }
    }

    async loadGLTFModel() {
        return new Promise((resolve, reject) => {
            if (this.loadedModels.has("gltf")) {
                this.glassesModel = this.loadedModels.get("gltf").clone();
                this.scene.add(this.glassesModel);
                resolve();
                return;
            }

            this.gltfLoader.load(
                "scene.gltf",
                (gltf) => {
                    const model = gltf.scene;

                    // Center the model
                    const box = new THREE.Box3().setFromObject(model);
                    const center = box.getCenter(new THREE.Vector3());
                    model.position.sub(center);

                    // Scale appropriately for face overlay
                    model.scale.set(0.15, 0.15, 0.15);
                    model.position.set(0, 0, 0);

                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                child.material.needsUpdate = true;
                            }
                        }
                    });

                    this.loadedModels.set("gltf", model.clone());
                    this.glassesModel = model;
                    this.scene.add(this.glassesModel);

                    console.log("GLTF model loaded and positioned");
                    resolve();
                },
                undefined,
                (error) => {
                    console.error("Error loading GLTF model:", error);
                    // Fallback to geometric glasses
                    this.glassesModel = this.createGlassesGeometry('classic');
                    this.scene.add(this.glassesModel);
                    resolve();
                }
            );
        });
    }

    createGlassesGeometry(frameType) {
        const group = new THREE.Group();
        
        const frameMaterial = new THREE.MeshPhongMaterial({ 
            color: this.getFrameColor(frameType),
            shininess: 30
        });
        
        const lensMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.15,
            roughness: 0.1,
            metalness: 0.0
        });

        // Glasses dimensions (scaled for face overlay)
        const frameWidth = 0.25;
        const frameHeight = 0.15;
        const bridgeWidth = 0.05;

        // Left frame
        const leftFrameGeometry = new THREE.TorusGeometry(frameHeight * 0.5, 0.01, 8, 16);
        const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial);
        leftFrame.position.set(-frameWidth/2 - bridgeWidth/2, 0, 0);
        group.add(leftFrame);

        // Right frame
        const rightFrameGeometry = new THREE.TorusGeometry(frameHeight * 0.5, 0.01, 8, 16);
        const rightFrame = new THREE.Mesh(rightFrameGeometry, frameMaterial);
        rightFrame.position.set(frameWidth/2 + bridgeWidth/2, 0, 0);
        group.add(rightFrame);

        // Bridge
        const bridgeGeometry = new THREE.CylinderGeometry(0.005, 0.005, bridgeWidth, 8);
        const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
        bridge.rotation.z = Math.PI / 2;
        group.add(bridge);

        // Lenses
        const leftLensGeometry = new THREE.CircleGeometry(frameHeight * 0.4, 32);
        const leftLens = new THREE.Mesh(leftLensGeometry, lensMaterial);
        leftLens.position.set(-frameWidth/2 - bridgeWidth/2, 0, 0.01);
        group.add(leftLens);

        const rightLensGeometry = new THREE.CircleGeometry(frameHeight * 0.4, 32);
        const rightLens = new THREE.Mesh(rightLensGeometry, lensMaterial);
        rightLens.position.set(frameWidth/2 + bridgeWidth/2, 0, 0.01);
        group.add(rightLens);

        return group;
    }

    getFrameColor(frameType) {
        switch (frameType) {
            case 'classic': return 0x333333;
            case 'modern': return 0x000000;
            case 'vintage': return 0x8B4513;
            default: return 0x333333;
        }
    }

    // THIS IS THE KEY METHOD - positions glasses on face
    updateGlasses(landmarks, canvasWidth, canvasHeight) {
        if (!this.glassesModel || !landmarks) return;

        // Get eye landmarks (MediaPipe indices)
        const leftEye = landmarks[33];   // Left eye outer corner
        const rightEye = landmarks[263]; // Right eye outer corner
        const noseBridge = landmarks[9]; // Nose bridge

        if (!leftEye || !rightEye || !noseBridge) return;

        // Convert normalized coordinates to world coordinates
        const leftEyeWorld = this.normalizedToWorld(leftEye, canvasWidth, canvasHeight);
        const rightEyeWorld = this.normalizedToWorld(rightEye, canvasWidth, canvasHeight);
        const noseBridgeWorld = this.normalizedToWorld(noseBridge, canvasWidth, canvasHeight);

        // Calculate glasses position (center between eyes)
        const centerX = (leftEyeWorld.x + rightEyeWorld.x) / 2;
        const centerY = (leftEyeWorld.y + rightEyeWorld.y) / 2 + (this.heightOffset * 0.001);

        // Calculate scale based on eye distance
        const eyeDistance = Math.abs(rightEyeWorld.x - leftEyeWorld.x);
        const baseScale = eyeDistance * 0.8;
        const finalScale = baseScale * this.scale * this.width;

        // Calculate rotation based on eye alignment
        const angle = Math.atan2(rightEyeWorld.y - leftEyeWorld.y, rightEyeWorld.x - leftEyeWorld.x);

        // Apply transformations
        this.glassesModel.position.set(centerX, centerY, 0);
        this.glassesModel.rotation.z = angle;
        this.glassesModel.scale.set(finalScale, finalScale, finalScale);

        // Make sure the model is visible
        this.glassesModel.visible = true;
    }

    normalizedToWorld(landmark, canvasWidth, canvasHeight) {
        // Convert MediaPipe normalized coordinates to Three.js world coordinates
        const aspect = canvasWidth / canvasHeight;
        const frustumSize = 2;
        
        return {
            x: (landmark.x - 0.5) * frustumSize * aspect,
            y: -(landmark.y - 0.5) * frustumSize, // Flip Y axis
            z: landmark.z || 0
        };
    }

    changeFrame(frameType) {
        this.loadGlassesModel(frameType);
    }

    updateScale(scale) {
        this.scale = scale;
    }

    updateWidth(width) {
        this.width = width;
    }

    updateHeightOffset(offset) {
        this.heightOffset = offset;
    }

    resize(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        
        if (this.camera && this.renderer) {
            const aspect = width / height;
            const frustumSize = 2;
            
            this.camera.left = -frustumSize * aspect / 2;
            this.camera.right = frustumSize * aspect / 2;
            this.camera.top = frustumSize / 2;
            this.camera.bottom = -frustumSize / 2;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(width, height);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}