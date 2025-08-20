const videoElement = document.getElementById('video');
const overlay = document.getElementById('overlay');
const overlayCtx = overlay.getContext('2d');

overlay.width = window.innerWidth;
overlay.height = window.innerHeight;

// THREE.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, overlay.width / overlay.height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: overlay, alpha: true });
renderer.setSize(overlay.width, overlay.height);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

let specs3D = null;

// Load 3D Glasses Model (.gltf file saved locally)
const loader = new THREE.GLTFLoader();
loader.load("specmodel.gltf", (gltf) => {
  specs3D = gltf.scene;
  specs3D.scale.set(0.3, 0.3, 0.3);
  scene.add(specs3D);
});

// Mediapipe FaceMesh
const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});
faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(onResults);

// Start camera
const cam = new Camera(videoElement, {
  onFrame: async () => {
    await faceMesh.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
cam.start();

function onResults(results) {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

  const landmarks = results.multiFaceLandmarks[0];

  // Left & right eye positions
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];

  // Convert to screen coordinates
  const lx = leftEye.x * overlay.width;
  const ly = leftEye.y * overlay.height;
  const rx = rightEye.x * overlay.width;
  const ry = rightEye.y * overlay.height;

  // Center point between eyes
  const cx = (lx + rx) / 2;
  const cy = (ly + ry) / 2;

  // Distance between eyes = scale factor
  const eyeDist = Math.hypot(rx - lx, ry - ly);

  if (specs3D) {
    // Position the specs in 3D
    specs3D.position.set(0, 0, -2); // in front of camera

    // Scale relative to eye distance
    const scale = eyeDist / 200;
    specs3D.scale.set(scale, scale, scale);

    // Rotate so it aligns with eyes
    const angle = Math.atan2(ry - ly, rx - lx);
    specs3D.rotation.set(0, 0, -angle);
  }

  renderScene();
}

function renderScene() {
  renderer.render(scene, camera);
}
