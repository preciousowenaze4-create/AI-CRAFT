import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface Head3DOverlayProps {
  active: boolean;
}

const MODEL_URL = '/psichedelic_abstract_geometry_loop_animation.glb';

export function Head3DOverlay({ active }: Head3DOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef(active);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let frameId = 0;

    // Detect software WebGL once cleanly without altering visual design
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param) || '');
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    THREE.Cache.enabled = true;

    const width = Math.max(container.clientWidth, 86);
    const height = Math.max(container.clientHeight, 86);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Studio IBL environment so the metallic dark-blue head catches crisp contour highlights
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // Warm/cool 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight(0xfff7ed, 0x1e293b, 1.35);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(2.2, 2.6, 3.2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xc7d2fe, 1.15);
    fillLight.position.set(-2.5, 0.8, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfde68a, 1.5);
    rimLight.position.set(0, 2.2, -3.0);
    scene.add(rimLight);

    const headPivot = new THREE.Group();
    scene.add(headPivot);

    let mixer: THREE.AnimationMixer | null = null;

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;

        const model = gltf.scene;
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetScale = 1.66 / maxDim;

        model.scale.setScalar(targetScale);
        model.position.set(
          -center.x * targetScale,
          -center.y * targetScale,
          -center.z * targetScale,
        );

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.frustumCulled = false;
            const mats = Array.isArray(child.material)
              ? child.material
              : [child.material];
            mats.forEach((mat) => {
              if (mat && 'envMapIntensity' in mat) {
                (mat as THREE.MeshStandardMaterial).envMapIntensity = 1.35;
              }
            });
          }
        });

        headPivot.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => {
            const action = mixer!.clipAction(clip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.play();
          });
        }

        if (!isSoftwareGl) {
          renderer.compile(scene, camera);
        }
        setLoaded(true);
      },
      undefined,
      (err) => {
        console.error('Failed to load 3D head GLB:', err);
      },
    );

    const handleResize = () => {
      if (disposed || !container) return;
      const w = Math.max(container.clientWidth, 86);
      const h = Math.max(container.clientHeight, 86);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext | null;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.1);

      if (activeRef.current) {
        if (mixer) {
          mixer.update(delta);
        }

        // Keep head strictly facing straight forward with zero spin/rotation
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();

      if (mixer) {
        mixer.stopAllAction();
      }

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m?.dispose());
        }
      });

      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Animated 3D blinking head"
      className={`w-full h-full pointer-events-none transition-opacity duration-300 ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
}
