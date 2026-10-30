const background = document.querySelector('#three-background');
const progressBar = document.querySelector('#progress-bar');
const menuToggle = document.querySelector('#menu-toggle');
const siteNav = document.querySelector('#site-nav');

const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;


// ==========================================
// 1. MOBILE NAVIGATION
// ==========================================

menuToggle?.addEventListener('click', () => {
  const isOpen =
    menuToggle.getAttribute('aria-expanded') === 'true';

  menuToggle.setAttribute('aria-expanded', String(!isOpen));

  menuToggle.setAttribute(
    'aria-label',
    isOpen ? 'Open navigation' : 'Close navigation'
  );

  siteNav?.classList.toggle('is-open', !isOpen);
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('is-open');

    menuToggle?.setAttribute('aria-expanded', 'false');

    menuToggle?.setAttribute(
      'aria-label',
      'Open navigation'
    );
  });
});


// ==========================================
// 2. SCROLL REVEAL ANIMATIONS
// ==========================================

const revealItems = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window && !reducedMotion) {

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add('is-visible');

          observer.unobserve(entry.target);

        }

      });

    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -35px 0px'
    }
  );

  revealItems.forEach((item) => {
    revealObserver.observe(item);
  });

} else {

  revealItems.forEach((item) => {
    item.classList.add('is-visible');
  });

}


// ==========================================
// 3. SCROLL PROGRESS BAR
// ==========================================

let scrollProgress = 0;
let scrollTicking = false;

function updateScrollProgress() {

  const scrollable =
    document.documentElement.scrollHeight -
    window.innerHeight;

  scrollProgress =
    scrollable > 0
      ? window.scrollY / scrollable
      : 0;

  if (progressBar) {

    progressBar.style.width =
      `${Math.min(100, Math.max(0, scrollProgress * 100))}%`;

  }

  scrollTicking = false;

}

window.addEventListener(
  'scroll',
  () => {

    if (!scrollTicking) {

      window.requestAnimationFrame(updateScrollProgress);

      scrollTicking = true;

    }

  },
  { passive: true }
);

updateScrollProgress();


// ==========================================
// 4. THREE.JS ANIMATED BACKGROUND
// ==========================================

async function initThreeBackground() {

  if (!background) return;

  let THREE;

  try {

    THREE = await import('three');

  } catch (error) {

    console.warn(
      'Three.js could not be loaded. CSS background will remain visible.',
      error
    );

    return;

  }


  // Create WebGL renderer

  let renderer;

  try {

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

  } catch (error) {

    console.warn(
      'WebGL is unavailable. CSS background will remain visible.',
      error
    );

    return;

  }


  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 1.7)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

  renderer.setClearColor(0x000000, 0);

  background.appendChild(renderer.domElement);


  // ==========================================
  // 5. SCENE AND CAMERA
  // ==========================================

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.1,
    120
  );

  camera.position.set(0, -15, 23);

  const world = new THREE.Group();

  scene.add(world);


  // ==========================================
  // 6. PARTICLE SYSTEM
  // ==========================================

  const isSmallScreen = window.innerWidth < 700;

  const particleCount = isSmallScreen ? 520 : 1050;

  const positions = new Float32Array(
    particleCount * 3
  );

  const pointObjects = [];

  for (let i = 0; i < particleCount; i++) {

    const x = (Math.random() - 0.5) * 38;

    const y = (Math.random() - 0.5) * 58;

    const z = (Math.random() - 0.5) * 15 - 3;

    positions[i * 3] = x;

    positions[i * 3 + 1] = y;

    positions[i * 3 + 2] = z;

    pointObjects.push({

      x,
      y,
      z,

      phase: Math.random() * Math.PI * 2,

      speed: 0.25 + Math.random() * 0.55

    });

  }


  // Particle geometry

  const particleGeometry = new THREE.BufferGeometry();

  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );


  // Particle appearance

  const particleMaterial = new THREE.PointsMaterial({

    color: 0x9af2ce,

    size: isSmallScreen ? 0.055 : 0.065,

    transparent: true,

    opacity: 0.68,

    sizeAttenuation: true,

    depthWrite: false

  });

  const particles = new THREE.Points(
    particleGeometry,
    particleMaterial
  );

  world.add(particles);


  // ==========================================
  // 7. PARTICLE CONNECTION NETWORK
  // ==========================================

  const linePositions = [];

  const linkLimit = isSmallScreen ? 115 : 245;

  for (let i = 0; i < linkLimit; i++) {

    const a =
      pointObjects[
        Math.floor(Math.random() * pointObjects.length)
      ];

    const b =
      pointObjects[
        Math.floor(Math.random() * pointObjects.length)
      ];

    const dx = a.x - b.x;

    const dy = a.y - b.y;

    const dz = a.z - b.z;

    if ((dx * dx + dy * dy + dz * dz) < 48) {

      linePositions.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z
      );

    }

  }


  const networkGeometry = new THREE.BufferGeometry();

  networkGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(linePositions, 3)
  );

  const networkMaterial = new THREE.LineBasicMaterial({

    color: 0x67b9a5,

    transparent: true,

    opacity: 0.13,

    depthWrite: false

  });

  world.add(
    new THREE.LineSegments(
      networkGeometry,
      networkMaterial
    )
  );


  // ==========================================
  // 8. FLOATING 3D OBJECTS
  // ==========================================

  const accentMaterial = new THREE.MeshBasicMaterial({

    color: 0x8de5c4,

    wireframe: true,

    transparent: true,

    opacity: 0.13

  });

  const blueMaterial = new THREE.MeshBasicMaterial({

    color: 0x7baed0,

    wireframe: true,

    transparent: true,

    opacity: 0.12

  });


  // Icosahedron

  const orbA = new THREE.Mesh(

    new THREE.IcosahedronGeometry(3.1, 1),

    accentMaterial

  );

  orbA.position.set(7.4, -12, -2.5);

  world.add(orbA);


  // Torus knot

  const orbB = new THREE.Mesh(

    new THREE.TorusKnotGeometry(
      2.35,
      0.012,
      120,
      8,
      2,
      3
    ),

    blueMaterial

  );

  orbB.position.set(-7.5, 5, -4);

  orbB.rotation.set(0.8, 0.3, 0.2);

  world.add(orbB);


  // Octahedron

  const orbC = new THREE.Mesh(

    new THREE.OctahedronGeometry(3.2, 1),

    accentMaterial.clone()

  );

  orbC.material.opacity = 0.1;

  orbC.position.set(7.1, 21, -3.5);

  world.add(orbC);


  // Floating ring

  const orbD = new THREE.Mesh(

    new THREE.TorusGeometry(
      2.8,
      0.012,
      8,
      90
    ),

    blueMaterial.clone()

  );

  orbD.position.set(-7.6, 33, -3.5);

  orbD.rotation.set(1.15, 0.35, 0.1);

  world.add(orbD);


  // ==========================================
  // 9. MOUSE MOVEMENT
  // ==========================================

  const pointer = {
    x: 0,
    y: 0
  };

  const pointerTarget = {
    x: 0,
    y: 0
  };

  let targetScroll = 0;

  let currentScroll = 0;

  let frameId = 0;

  const clock = new THREE.Clock();


  window.addEventListener(
    'pointermove',
    (event) => {

      pointerTarget.x =
        (event.clientX / window.innerWidth - 0.5) * 2;

      pointerTarget.y =
        (event.clientY / window.innerHeight - 0.5) * 2;

    },
    { passive: true }
  );


  // ==========================================
  // 10. SCROLL PARALLAX
  // ==========================================

  window.addEventListener(
    'scroll',
    () => {

      const maxScroll =
        document.documentElement.scrollHeight -
        window.innerHeight;

      targetScroll =
        maxScroll > 0
          ? window.scrollY / maxScroll
          : 0;

    },
    { passive: true }
  );


  // ==========================================
  // 11. RESPONSIVE RESIZE
  // ==========================================

  function resize() {

    camera.aspect =
      window.innerWidth / window.innerHeight;

    camera.fov =
      window.innerWidth < 700 ? 57 : 48;

    camera.updateProjectionMatrix();

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 1.7)
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  }

  window.addEventListener(
    'resize',
    resize,
    { passive: true }
  );


  // ==========================================
  // 12. MAIN ANIMATION LOOP
  // ==========================================

  function animate() {

    frameId = window.requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    const damping = reducedMotion ? 0.025 : 0.035;


    // Smooth mouse movement

    pointer.x +=
      (pointerTarget.x - pointer.x) * damping;

    pointer.y +=
      (pointerTarget.y - pointer.y) * damping;


    // Smooth scrolling movement

    currentScroll +=
      (targetScroll - currentScroll) * 0.045;


    // Camera movement through the 3D scene

    camera.position.y =
      -15 + currentScroll * 36 + pointer.y * 0.65;

    camera.position.x =
      pointer.x * 0.85;

    camera.position.z =
      23 + Math.abs(pointer.x) * 0.35;

    camera.lookAt(
      pointer.x * 1.15,
      camera.position.y + pointer.y * 0.5,
      -2.5
    );


    // ==========================================
    // 13. OBJECT ROTATIONS
    // ==========================================

    const motion = reducedMotion ? 0 : 1;

    world.rotation.y =
      pointer.x * 0.055 * motion +
      Math.sin(elapsed * 0.12) * 0.025 * motion;

    world.rotation.x =
      pointer.y * 0.025 * motion;


    orbA.rotation.x = elapsed * 0.08 * motion;

    orbA.rotation.y = elapsed * 0.1 * motion;

    orbB.rotation.z = elapsed * 0.045 * motion;

    orbC.rotation.y = -elapsed * 0.08 * motion;

    orbD.rotation.z = elapsed * 0.05 * motion;


    // ==========================================
    // 14. PARTICLE SHIMMER
    // ==========================================

    if (!reducedMotion) {

      const positionAttribute =
        particleGeometry.attributes.position;

      for (let i = 0; i < particleCount; i++) {

        const point = pointObjects[i];

        positionAttribute.array[i * 3 + 1] =
          point.y +
          Math.sin(
            elapsed * point.speed + point.phase
          ) * 0.12;

      }

      positionAttribute.needsUpdate = true;

    }


    // Render scene

    renderer.render(scene, camera);

  }


  // Start animation

  animate();


  // ==========================================
  // 15. CLEANUP
  // ==========================================

  window.addEventListener(
    'pagehide',
    () => {

      window.cancelAnimationFrame(frameId);

      renderer.dispose();

      particleGeometry.dispose();

      particleMaterial.dispose();

      networkGeometry.dispose();

      networkMaterial.dispose();

    },
    { once: true }
  );

}


// ==========================================
// INITIALIZE THREE.JS
// ==========================================

initThreeBackground();