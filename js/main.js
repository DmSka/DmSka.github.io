/* ================================================================
   main.js — 3D Portfolio Homepage Logic
   Dominic Saksa
   ================================================================ */

import * as THREE from "three";
import { OrbitControls } from "https://unpkg.com/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://unpkg.com/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { MeshToonMaterial } from "three";

const scene = new THREE.Scene();
const container3D = document.getElementById("container3D");

function getContainerSize() {
  const rect = container3D.getBoundingClientRect();
  return {
    width: rect.width || window.innerWidth,
    height: rect.height || window.innerHeight
  };
}

const initialSize = getContainerSize();
const camera = new THREE.PerspectiveCamera(20, initialSize.width / initialSize.height, 0.1, 1000);
camera.position.set(120, 70, -120);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(initialSize.width, initialSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container3D.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();
controls.enableDamping = true;
controls.dampingFactor = 0.08;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clickableObjects = [];
const meshToModelMap = new Map();
const loadedModels = new Map();

let originalCameraPos = camera.position.clone();
let originalControlsTarget = controls.target.clone();

const keyLight = new THREE.DirectionalLight(0xffddaa, 1);
keyLight.position.set(50, 100, 100);
keyLight.castShadow = true;
scene.add(keyLight);

keyLight.shadow.mapSize.width = 2048;
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

const planeGeometry = new THREE.PlaneGeometry(500, 500);
const shadowMat = new THREE.ShadowMaterial({ opacity: 0.3 });
const ground = new THREE.Mesh(planeGeometry, shadowMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
ground.receiveShadow = true;
scene.add(ground);

const modelsToLoad = [
  { name: 'Office', position: { x: -10, y: -1, z: 17 }, color: 0x8c5b11, scale: 2.7 },
  { name: 'Computer', position: { x: -19, y: -1, z: -5 }, color: 0x8c5b11, scale: 1.5 },
  { name: 'Arcade', position: { x: 6, y: -1.5, z: 15 }, color: 0x8c5b11, scale: 3.4 },
  { name: 'School', position: { x: 20, y: -1.5, z: 15 }, color: 0x8c5b11, scale: .9 },
  { name: 'Park', position: { x: -15, y: -1, z: -33 }, color: 0x8c5b11, scale: 2.2 },
];

modelsToLoad.forEach((model) => {
  loadModel(model.name, model.position, model.color, model.scale);
});

function loadModelInfoFromHTML() {
  const container = document.getElementById('modelData');
  if (!container) return {};

  const info = {};
  const modelDivs = container.children;

  for (let i = 0; i < modelDivs.length; i++) {
    const div = modelDivs[i];
    const id = div.id;
    const title = div.dataset.title || id;
    const description = div.innerHTML;
    info[id] = { title, description };
  }

  return info;
}

const modelInfo = loadModelInfoFromHTML();

function loadModel(modelName, position = { x: 0, y: 0, z: 0 }, color = 0xff7755, scale = 1) {
    const loader = new GLTFLoader();
    loader.load(
      `./models/${modelName}/scene.gltf`,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(position.x, position.y, position.z);
        model.scale.set(scale, scale, scale);

        if (modelName === 'Arcade') {
          model.rotation.y = Math.PI / 2;
        }
        if (modelName === 'School') {
          model.rotation.y = Math.PI * 3 / 2;
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
        loadedModels.set(modelName, model);
      },
      undefined,
      (error) => {
        console.error(`Error loading ${modelName}:`, error);
      }
    );
}

const birdFlock = new THREE.Group();
scene.add(birdFlock);

const birdLoader = new GLTFLoader();

birdLoader.load('models/Bird/scene.gltf', (gltf) => {
  const originalBird = gltf.scene;

  for (let i = 0; i < 5; i++) {
    const bird = originalBird.clone(true);
    bird.scale.set(0.5, 0.5, 0.5);
    bird.rotation.y = Math.PI * 3 / 2;
    bird.position.set(
      -50 - i * 5,
      30 + Math.random() * 5,
      -20 + Math.random() * 20
    );
    birdFlock.add(bird);
  }

  birdFlock.visible = false;
});

function flyBirds() {
  if (birdFlock.children.length === 0) return;

  birdFlock.visible = true;
  birdFlock.position.set(0, 0, 0);

  gsap.to(birdFlock.position, {
    x: 120,
    duration: 15,
    ease: "linear",
    onComplete: () => {
      birdFlock.visible = false;
    },
  });
}

setInterval(() => {
  flyBirds();
}, 30000);

const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

const cloudLoader = new GLTFLoader();
cloudLoader.load('models/Clouds/scene.gltf', (gltf) => {
  const originalCloud = gltf.scene;
  originalCloud.traverse((node) => {
    if (node.isMesh) {
      node.material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 1,
        metalness: 0,
      });
    }
  });

  for (let i = 0; i < 2; i++) {
    const cloud = originalCloud.clone(true);
    cloud.scale.setScalar(5 + Math.random());
    cloud.position.set(
      -70 - Math.random() * 5,
      30 + Math.random() * 5,
      80
    );
    cloud.rotation.y = Math.random() * Math.PI * 2;
    cloud.rotation.x = (Math.random() - 0.5) * 0.2;
    cloud.rotation.z = (Math.random() - 0.5) * 0.2;
    cloudGroup.add(cloud);
    animateCloud(cloud);
  }
});

function animateCloud(cloud) {
  const startX = cloud.position.x;
  const endX = 150;
  const duration = 60 + Math.random() * 30;

  gsap.to(cloud.position, {
    x: endX,
    duration: duration,
    ease: "none",
    onComplete: () => {
      cloud.position.x = -100 - Math.random() * 50;
      cloud.position.y = 40 + Math.random() * 20;
      animateCloud(cloud);
    }
  });
}

let currentlyClicked = null;
let currentHovered = null;

window.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(event) {
  if (currentlyClicked == true) {
    return;
  }

  const canvas = renderer.domElement;
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const hoveredMesh = intersects[0].object;

    label.style.display = 'block';
    label.textContent = modelInfo[meshToModelMap.get(hoveredMesh)]?.title || 'Unknown';
    label.style.left = `${event.clientX + 10}px`;
    label.style.top = `${event.clientY + 10}px`;

    if (currentHovered !== hoveredMesh) {
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
      }

      currentHovered = hoveredMesh;

      if (!currentHovered.userData.originalColor) {
        currentHovered.userData.originalColor = currentHovered.material.color.clone();
      }
      if (!currentHovered.userData.originalY) {
        currentHovered.userData.originalY = currentHovered.position.y;
      }

      gsap.to(currentHovered.material.color, {
        r: 0.2,
        g: 0.2,
        b: 0.2,
        duration: 0.5,
      });

      gsap.to(currentHovered.position, {
        y: currentHovered.userData.originalY + 1.0,
        duration: 0.3,
        ease: "power2.out"
      });
    }

    document.body.style.cursor = 'pointer';
  } else {
    label.style.display = 'none';
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

function handleModelSelection(modelName) {
  zoomToModel(modelName);

  switch (modelName) {
      case "Arcade":
        window.location.href = "arcade/index.html";
        break;
      case "School":
        window.location.href = "education/index.html";
        break;
      case "Computer":
        window.location.href = "computer/index.html";
        break;
      case "Office":
        window.location.href = "work/index.html";
        break;
      case "Park":
        window.location.href = "themepark/index.html";
        break;
      default:
        return;
  }
}

camera.fov = 90;
camera.updateProjectionMatrix();

gsap.to(camera, {
  fov: 30,
  duration: 2.5,
  ease: "power2.out",
  onUpdate: () => camera.updateProjectionMatrix()
});

function zoomToModel(modelName) {
  const model = loadedModels.get(modelName);
  if (!model) {
    return;
  }

  let newCameraPosition;
  let newCameraTarget;
  switch (modelName) {
    case "Arcade":
      newCameraPosition = new THREE.Vector3(40.30, 24.00, -19.71);
      newCameraTarget = new THREE.Vector3(8.67, 5.55, 11.91);
      break;
    case "School":
      newCameraPosition = new THREE.Vector3(80.93, 29.41, -32.02);
      newCameraTarget = new THREE.Vector3(25.34, -3.02, 23.58);
      break;
    case "Computer":
      newCameraPosition = new THREE.Vector3(30.98, 30.30, -57.32);
      newCameraTarget = new THREE.Vector3(-14.31, 3.88, -12.04);
      break;
    case "Office":
      newCameraPosition = new THREE.Vector3(35.14, 29.13, -29.87);
      newCameraTarget = new THREE.Vector3(0.10, 8.69, 5.17);
      break;
    case "Park":
      newCameraPosition = new THREE.Vector3(37.64, 33.64, -86.90);
      newCameraTarget = new THREE.Vector3(-23.96, -2.29, -25.30);
      break;
    default:
      return;
  }

  const duration = 1000;
  const startTime = performance.now();
  const startPos = camera.position.clone();

  function animateCamera(time) {
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);

    camera.position.lerpVectors(startPos, newCameraPosition, t);
    controls.target.lerpVectors(originalControlsTarget, newCameraTarget, t);
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
    } else {
      currentlyClicked = false;
    }
  }

  requestAnimationFrame(animateReset);
}

window.addEventListener("resize", () => {
  const size = getContainerSize();
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

window.addEventListener('click', onClick, false);

window.addEventListener('touchend', (event) => {
  const touch = event.changedTouches[0];
  const canvas = renderer.domElement;
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const modelName = meshToModelMap.get(clickedMesh);
    handleModelSelection(modelName);
  }
}, false);

const label = document.getElementById('hoverLabel');

function onClick(event) {
  if (currentlyClicked == true) {
    return;
  }

  const canvas = renderer.domElement;
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    const modelName = meshToModelMap.get(clickedMesh);
    handleModelSelection(modelName);
  }
}

document.getElementById('closeInfo').addEventListener('click', () => {
  document.getElementById('infoPanel').style.display = 'none';
  controls.enabled = true;
  resetCamera();
});

document.querySelectorAll('#infoNav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const modelName = link.getAttribute('data-model');
    handleModelSelection(modelName);
  });
});

const navLinks = document.querySelectorAll('#infoNav a');
const sections = Array.from(document.querySelectorAll('#infoDescription section'));

function updateActiveLink() {
  let currentSection = sections[0];

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 150 && rect.bottom >= 150) {
      currentSection = section;
      break;
    }
  }

  navLinks.forEach(link => {
    const modelName = link.getAttribute('data-model');
    if (modelName === currentSection.id) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

const infoDesc = document.getElementById('infoDescription');
if (infoDesc) {
  infoDesc.addEventListener('scroll', updateActiveLink);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
