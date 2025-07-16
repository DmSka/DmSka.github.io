// Import THREE.js and necessary modules
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { MeshToonMaterial } from "https://cdn.skypack.dev/three@0.129.0";

// Create scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(120, 70, -120); // Example: higher and more centered view


// Renderer
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("container3D").appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickableObjects = [];
const meshToModelMap = new Map();  // key: mesh, value: modelName

let originalCameraPos = camera.position.clone();
let originalControlsTarget = controls.target.clone();


// Lighting Setup
const keyLight = new THREE.DirectionalLight(0xffddaa, 1);
keyLight.position.set(50, 100, 100);
keyLight.castShadow = true;
scene.add(keyLight);

keyLight.shadow.mapSize.width = 2048; // Higher res = sharper shadows
keyLight.shadow.mapSize.height = 2048;

keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 200;

keyLight.shadow.camera.left = -100;
keyLight.shadow.camera.right = 100;
keyLight.shadow.camera.top = 100;
keyLight.shadow.camera.bottom = -100;

keyLight.shadow.bias = -0.0005;

const rimLight = new THREE.DirectionalLight(0xccddff, 1.0);
rimLight.position.set(-50, 80, -100);
scene.add(rimLight);

const ambientLight = new THREE.AmbientLight(0x334455, 0.7);
ambientLight.position.set(-50, 80, -100);
scene.add(ambientLight);

// Ground Plane for shadows
const planeGeometry = new THREE.PlaneGeometry(500, 500);
const shadowMat = new THREE.ShadowMaterial({ opacity: 0.3 });
const ground = new THREE.Mesh(planeGeometry, shadowMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
ground.receiveShadow = true;
scene.add(ground);

const modelInfo = {
  'Office': {
    title: "",
    description: `
      <h1>Work Experience</h1>
      <h2>Junior Developer</h2>
      <h3>BIWorldwide Detroit</h3>
      <p>Constructed and deployed HTML emails. Used VS Code IDE to program and populate emails for Metro-Detroit car dealerships employee incentive.</p>
    `
  },
  'Computer': {
    title: "Computer Model",
    description: `
      
    `
  },
  // add more models as needed
};

let currentHovered = null;

window.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const hoveredMesh = intersects[0].object;

    if (currentHovered !== hoveredMesh) {
      if (currentHovered) {
        // Restore old color
        gsap.to(currentHovered.material.color, {
          r: currentHovered.userData.originalColor.r,
          g: currentHovered.userData.originalColor.g,
          b: currentHovered.userData.originalColor.b,
          duration: 0.5,
        });
        gsap.to(currentHovered.position, {
          y: currentHovered.userData.originalY ?? 0, // restore to original
          duration: 0.3,
          ease: "power2.out"
        });
      }

      // Save the hovered mesh and its original color
      currentHovered = hoveredMesh;

      if (!currentHovered.userData.originalColor) {
        currentHovered.userData.originalColor = currentHovered.material.color.clone();
      }
      if (!currentHovered.userData.originalY) {
        currentHovered.userData.originalY = currentHovered.position.y;
      }

      // Animate to highlight color (e.g., yellow)
      gsap.to(currentHovered.material.color, {
        r: 0.2,
        g: 0.2,
        b: 0.2,
        duration: 0.5,
      });

      gsap.to(currentHovered.position, {
        y: currentHovered.userData.originalY + 1.0, // lift by 1 unit
        duration: 0.3,
        ease: "power2.out"
      });
    }

    document.body.style.cursor = 'pointer';
  } else {
    // Reset color if nothing is hovered
    if (currentHovered) {
      gsap.to(currentHovered.material.color, {
        r: currentHovered.userData.originalColor.r,
        g: currentHovered.userData.originalColor.g,
        b: currentHovered.userData.originalColor.b,
        duration: 0.5,
      });
      gsap.to(currentHovered.position, {
        y: currentHovered.userData.originalY ?? 0,
        duration: 0.3,
        ease: "power2.out"
      });
      currentHovered = null;
    }

    document.body.style.cursor = 'default';
  }
}

// Function to load models
const loadedModels = new Map(); // modelName → modelGroup

  function loadModel(modelName, position = { x: 0, y: 0, z: 0 }, color = 0xff7755, scale = 1) {
    const loader = new GLTFLoader();
    loader.load(
      `./models/${modelName}/scene.gltf`,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(position.x, position.y, position.z);
        model.scale.set(scale, scale, scale);

        // 🔁 Rotate Arcade model 90 degrees around Y
        if (modelName === 'Arcade') {
          model.rotation.y = Math.PI / 2;
        }
        if (modelName === 'School') {
          model.rotation.y = Math.PI *3 / 2;
        }

        model.traverse((node) => {
          if (node.isMesh) {
            node.material = new MeshToonMaterial({ color });
            node.castShadow = true;
            node.receiveShadow = true;

            clickableObjects.push(node);
            meshToModelMap.set(node, modelName);
          }
        });

        scene.add(model);
        loadedModels.set(modelName, model);  // Save the whole model group
      },
      undefined,
      (error) => {
        console.error(`Error loading ${modelName}:`, error);
      }
    );
  }


function zoomToModel(modelName) {
  const model = loadedModels.get(modelName);
  if (!model) {
    console.warn(`Model ${modelName} not found.`);
    return;
  }

  // Compute bounding box and center
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  // Calculate the max size (to fit)
  const maxSize = Math.max(size.x, size.y, size.z);

  // Get current camera forward direction (normalized)
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);

  // Calculate the distance the camera should be from center to fit the object
  // Use camera's FOV and aspect ratio:
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const aspect = camera.aspect;

  // Distance required to fit object height in view:
  const distanceForHeight = maxSize / (2 * Math.tan(fov / 2));
  // Distance required to fit object width in view:
  const distanceForWidth = distanceForHeight / aspect;
  // Use the larger distance
  const requiredDistance = Math.max(distanceForHeight, distanceForWidth);

  // Calculate new camera position along its forward vector
  // We'll move camera to: center - cameraDirection * requiredDistance
  const newCameraPosition = center.clone().add(cameraDirection.clone().multiplyScalar(-requiredDistance));

  // Animate camera position (no rotation or controls.target change)
  const duration = 1000;
  const startTime = performance.now();

  const startPos = camera.position.clone();

  function animateCamera(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);

    camera.position.lerpVectors(startPos, newCameraPosition, t);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(animateCamera);
    }
  }

  requestAnimationFrame(animateCamera);
}


function resetCamera() {
  const duration = 1000;
  const startTime = performance.now();
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();

  function animateReset(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);

    camera.position.lerpVectors(startPos, originalCameraPos, t);
    controls.target.lerpVectors(startTarget, originalControlsTarget, t);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(animateReset);
    }
  }

  requestAnimationFrame(animateReset);
}



// Models to load
const modelsToLoad = [
  { name: 'Office', position: { x: 0, y: -1, z: 0 }, color: 0x8c5b11, scale: 2.7 },
  { name: 'Computer', position: { x: 0, y: -1, z: -30 }, color: 0x8c5b11, scale: 1.7 },
  { name: 'Arcade', position: { x: 17 , y: -1.5, z: -5 }, color: 0x8c5b11, scale: 3.4 },
  { name: 'School', position: { x: 20 , y: -1.5, z: 15 }, color: 0x8c5b11, scale: .9 },
];

// Load all models
modelsToLoad.forEach((model) => {
  loadModel(model.name, model.position, model.color, model.scale);
});

// Handle window resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('click', onClick, false);

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const modelName = meshToModelMap.get(clickedMesh);
    console.log(`Clicked mesh belongs to model: ${modelName}`);

    // Zoom camera
    zoomToModel(modelName);

    // Show info panel
    const infoPanel = document.getElementById('infoPanel');
    const title = document.getElementById('infoTitle');
    const desc = document.getElementById('infoDescription');

    if (modelInfo[modelName]) {
      title.textContent = modelInfo[modelName].title;
      desc.innerHTML = modelInfo[modelName].description;

    } else {
      title.textContent = modelName;
      desc.textContent = "No description available.";
    }

    infoPanel.style.display = 'block';
  }
}

document.getElementById('closeInfo').addEventListener('click', () => {
  document.getElementById('infoPanel').style.display = 'none';
});

document.getElementById('closeInfo').addEventListener('click', () => {
  document.getElementById('infoPanel').style.display = 'none';
  resetCamera(); // 👈 Go back to original view
});


// Animate and render loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();