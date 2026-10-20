'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { SCREEN, buildDesk } from '@/lib/desk/buildDesk';

const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? '';

// The iframe renders as a normal 1600x900 desktop page, then gets scaled onto the monitor.
const PAGE_W = 1600;
const PAGE_H = 900;

// Camera poses are expressed as "target + direction * distance" so the distance
// can change with the stage's aspect ratio (phones, split windows, rotation).
const HOME_TARGET = new THREE.Vector3(0, 0.3, -0.12);
const HOME_DIR = new THREE.Vector3(0.12, 0.14, 1.82).normalize();
const SCREEN_TARGET = new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z);
const SCREEN_DIR = new THREE.Vector3(0, 0.04, 1).normalize(); // almost head-on, so the page is not skewed
const HOME_HALF_WIDTH = 0.62; // world units that should always be visible left/right of the target
const SCREEN_MARGIN = 1.15; // breathing room around the monitor in "Use screen" mode

/** Vertical fov and the two camera distances that keep the scene / the monitor in frame. */
function layoutFor(aspect: number) {
  const vfov = aspect >= 1 ? 36 : Math.min(62, 36 + (1 - aspect) * 40);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(vfov / 2));
  const homeDist = THREE.MathUtils.clamp(HOME_HALF_WIDTH / (tanHalf * aspect), 1.83, 2.7);
  const screenDist = Math.max(
    ((SCREEN.height / 2) * SCREEN_MARGIN) / tanHalf,
    ((SCREEN.width / 2) * SCREEN_MARGIN) / (tanHalf * aspect),
  );
  return { vfov, homeDist, screenDist };
}

export default function DeskScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const resetRef = useRef<() => void>(() => {});
  const interactFnRef = useRef<(on: boolean) => void>(() => {});
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const stop = (e: Event) => e.stopPropagation();
    const events = ['pointerdown', 'wheel', 'contextmenu', 'touchstart'];
    events.forEach((t) => bar.addEventListener(t, stop, { passive: true }));
    return () => events.forEach((t) => bar.removeEventListener(t, stop));
  }, []);

  // The animation loop reads these refs; the buttons mirror them in state.
  const lampOnRef = useRef(true);
  const screenOnRef = useRef(true);
  const interactRef = useRef(false);
  const [lampOn, setLampOn] = useState(true);
  const [screenOn, setScreenOn] = useState(true);
  const [interactive, setInteractiveState] = useState(false);
  const [noWebGL, setNoWebGL] = useState(false);

  const toggleLamp = useCallback(() => {
    lampOnRef.current = !lampOnRef.current;
    setLampOn(lampOnRef.current);
  }, []);

  const toggleScreen = useCallback(() => {
    screenOnRef.current = !screenOnRef.current;
    setScreenOn(screenOnRef.current);
  }, []);

  const setInteractive = useCallback((on: boolean) => {
    interactRef.current = on;
    setInteractiveState(on);
    interactFnRef.current(on);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const live = PORTFOLIO_URL !== '';

    let renderer: THREE.WebGLRenderer;
    try {
      // alpha is needed in live mode so the CSS3D layer behind the canvas can show through the screen
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: live });
    } catch {
      setNoWebGL(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    // setSize(..., false) leaves the CSS size alone, so without this the canvas is
    // drawn at its backing-store size (css px * devicePixelRatio) and no longer
    // lines up with the CSS3D layer behind it.
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.zIndex = '1';
    canvas.style.pointerEvents = 'none'; // orbit controls listen on the stage instead
    stage.insertBefore(canvas, stage.firstChild);

    const scene = new THREE.Scene();
    if (!live) scene.background = new THREE.Color(0x120c08); // in live mode the stage colour shows through
    scene.fog = new THREE.Fog(0x120c08, 2.6, 6);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 20);
    camera.position.copy(HOME_TARGET).addScaledVector(HOME_DIR, 1.83);

    const controls = new OrbitControls(camera, stage);
    controls.target.copy(HOME_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 0.6;
    controls.maxDistance = 2.4;
    controls.minPolarAngle = 0.7;
    controls.maxPolarAngle = 1.6; // must allow the near head-on "Use screen" pose
    controls.minAzimuthAngle = -0.75;
    controls.maxAzimuthAngle = 0.75;
    controls.update();

    // true once the visitor has orbited/zoomed by hand; until then a resize re-frames the scene
    let userMoved = false;
    controls.addEventListener('start', () => {
      userMoved = true;
    });

    /* ---------- live portfolio on the monitor (CSS3D layer behind the canvas) ---------- */
    let cssRenderer: CSS3DRenderer | null = null;
    let screenObj: CSS3DObject | null = null;
    const cssScene = new THREE.Scene();

    if (live) {
      cssRenderer = new CSS3DRenderer();
      const layer = cssRenderer.domElement;
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.zIndex = '0';
      layer.style.pointerEvents = 'none';
      stage.insertBefore(layer, stage.firstChild);

      const wrap = document.createElement('div');
      wrap.style.width = `${PAGE_W}px`;
      wrap.style.height = `${PAGE_H}px`;
      wrap.style.background = '#fff';
      wrap.style.display = 'block';
      wrap.style.overflow = 'hidden';

      const frame = document.createElement('iframe');
      frame.src = PORTFOLIO_URL;
      frame.title = 'Portfolio';
      frame.allow = 'fullscreen';
      frame.width = String(PAGE_W);
      frame.height = String(PAGE_H);
      frame.style.cssText = `width:${PAGE_W}px;height:${PAGE_H}px;min-width:${PAGE_W}px;min-height:${PAGE_H}px;border:0;display:block;`;
      wrap.appendChild(frame);

      screenObj = new CSS3DObject(wrap);
      screenObj.position.set(SCREEN.x, SCREEN.y, SCREEN.z);
      screenObj.scale.setScalar(SCREEN.width / PAGE_W);
      screenObj.element.style.pointerEvents = 'none';
      cssScene.add(screenObj);
    }

    /* ---------- camera poses + fly-to (used by "Use screen" and "Reset view") ---------- */
    const homePos = new THREE.Vector3().copy(camera.position);
    const screenPos = new THREE.Vector3();

    const fly = {
      active: false,
      t: 0,
      fromPos: new THREE.Vector3(),
      fromTarget: new THREE.Vector3(),
      toPos: new THREE.Vector3(),
      toTarget: new THREE.Vector3(),
    };
    const flyTo = (pos: THREE.Vector3, target: THREE.Vector3) => {
      fly.active = true;
      fly.t = 0;
      fly.fromPos.copy(camera.position);
      fly.fromTarget.copy(controls.target);
      fly.toPos.copy(pos);
      fly.toTarget.copy(target);
      controls.enabled = false;
    };

    interactFnRef.current = (on) => {
      if (screenObj) screenObj.element.style.pointerEvents = on ? 'auto' : 'none';
      if (on) {
        flyTo(screenPos, SCREEN_TARGET);
      } else {
        userMoved = false;
        flyTo(homePos, HOME_TARGET);
      }
    };
    resetRef.current = () => {
      interactRef.current = false;
      setInteractiveState(false);
      interactFnRef.current(false);
    };

    // next/font emits hashed family names behind these CSS variables; the
    // canvas that paints the fallback screen needs the same names.
    const rootStyle = getComputedStyle(document.documentElement);
    const fonts = {
      serif: rootStyle.getPropertyValue('--font-serif').trim() || 'Georgia, serif',
      mono: rootStyle.getPropertyValue('--font-mono').trim() || 'ui-monospace, Menlo, monospace',
    };

    const desk = buildDesk(scene, renderer, fonts, { liveScreen: live });

    let disposed = false;
    if (!live && document.fonts?.load) {
      Promise.all([
        document.fonts.load(`900 100px ${fonts.serif}`),
        document.fonts.load(`700 40px ${fonts.serif}`),
        document.fonts.load(`italic 400 64px ${fonts.serif}`),
        document.fonts.load(`400 20px ${fonts.mono}`),
        document.fonts.load(`700 20px ${fonts.mono}`),
      ])
        .then(() => {
          if (!disposed) desk.redrawScreen();
        })
        .catch(() => {});
    }

    /* ---------- resize: keep canvas, CSS3D layer and camera framing in sync ---------- */
    let wasPortrait: boolean | null = null;
    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;

      // devicePixelRatio changes with browser zoom or when the window moves between displays
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      cssRenderer?.setSize(w, h);

      const aspect = w / h;
      const layout = layoutFor(aspect);
      camera.aspect = aspect;
      camera.fov = layout.vfov;
      camera.updateProjectionMatrix();

      homePos.copy(HOME_TARGET).addScaledVector(HOME_DIR, layout.homeDist);
      screenPos.copy(SCREEN_TARGET).addScaledVector(SCREEN_DIR, layout.screenDist);
      controls.maxDistance = Math.max(2.4, layout.homeDist + 0.4);

      const portrait = aspect < 1;
      const orientationChanged = wasPortrait !== null && portrait !== wasPortrait;
      const first = wasPortrait === null;
      wasPortrait = portrait;

      if (fly.active) {
        // retarget the animation that is already running
        fly.toPos.copy(interactRef.current ? screenPos : homePos);
      } else if (interactRef.current) {
        camera.position.copy(screenPos);
        controls.target.copy(SCREEN_TARGET);
      } else if (first || orientationChanged || !userMoved) {
        camera.position.copy(homePos);
        controls.target.copy(HOME_TARGET);
      }
      controls.update();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    window.addEventListener('resize', resize);
    resize();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') toggleLamp();
      if (e.key === 'Escape' && interactRef.current) setInteractive(false);
    };
    window.addEventListener('keydown', onKey);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = reduceMotion ? 1 : 0.12;
    const clock = new THREE.Clock();
    let lamp = 1;
    let screen = 1;
    let lastOpacity = '';

    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.1);

      lamp += ((lampOnRef.current ? 1 : 0) - lamp) * ease;
      screen += ((screenOnRef.current ? 1 : 0) - screen) * ease;
      desk.setLevels(lamp, screen);
      desk.update(reduceMotion ? 2.5 : clock.elapsedTime);

      if (fly.active) {
        fly.t = Math.min(1, fly.t + dt / (reduceMotion ? 0.01 : 0.9));
        const k = fly.t < 0.5 ? 2 * fly.t * fly.t : 1 - Math.pow(-2 * fly.t + 2, 2) / 2;
        camera.position.lerpVectors(fly.fromPos, fly.toPos, k);
        controls.target.lerpVectors(fly.fromTarget, fly.toTarget, k);
        if (fly.t >= 1) {
          fly.active = false;
          controls.enabled = !interactRef.current;
        }
      }
      controls.update();

      if (cssRenderer && screenObj) {
        // "Screen glow" dims the page the same way it dims the drawn screen
        const opacity = String(0.06 + 0.94 * screen);
        if (opacity !== lastOpacity) {
          screenObj.element.style.opacity = opacity;
          lastOpacity = opacity;
        }
        cssRenderer.render(cssScene, camera);
      }
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
      observer.disconnect();
      controls.dispose();
      desk.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      cssRenderer?.domElement.remove();
    };
  }, [toggleLamp, setInteractive]);

  return (
    <div className="stage" ref={stageRef}>
      {noWebGL && <div className="fallback">This scene needs WebGL, which is not available in this browser.</div>}
      <div className="bar" ref={barRef}>
        <h1 className="title">
          Archive Desk
          <small>
            {interactive ? 'Using the screen. Press Esc or Exit screen to go back.' : 'Drag to orbit, scroll or pinch to zoom'}
          </small>
        </h1>
        <div className="controls">
          {PORTFOLIO_URL && (
            <button type="button" aria-pressed={interactive} onClick={() => setInteractive(!interactive)}>
              {interactive ? 'Exit screen' : 'Use screen'}
            </button>
          )}
          <button type="button" aria-pressed={lampOn} onClick={toggleLamp}>
            Desk lamp
          </button>
          <button type="button" aria-pressed={screenOn} onClick={toggleScreen}>
            Screen glow
          </button>
          <button type="button" onClick={() => resetRef.current()}>
            Reset view
          </button>
        </div>
      </div>
    </div>
  );
}