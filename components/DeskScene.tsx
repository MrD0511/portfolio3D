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

const HOME_POS = new THREE.Vector3(0.12, 0.44, 1.7);
const HOME_TARGET = new THREE.Vector3(0, 0.3, -0.12);
const SCREEN_POS = new THREE.Vector3(0, 0.46, 0.7);
const SCREEN_TARGET = new THREE.Vector3(SCREEN.x, SCREEN.y, SCREEN.z);

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
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.zIndex = '1';
    renderer.domElement.style.pointerEvents = 'none'; // orbit controls listen on the stage instead
    stage.insertBefore(renderer.domElement, stage.firstChild);

    const scene = new THREE.Scene();
    if (!live) scene.background = new THREE.Color(0x120c08); // in live mode the stage colour shows through
    scene.fog = new THREE.Fog(0x120c08, 2.4, 5);

    const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 20);
    camera.position.copy(HOME_POS);

    const controls = new OrbitControls(camera, stage);
    controls.target.copy(HOME_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.minDistance = 0.6;
    controls.maxDistance = 2.4;
    controls.minPolarAngle = 0.7;
    controls.maxPolarAngle = 1.5;
    controls.minAzimuthAngle = -0.75;
    controls.maxAzimuthAngle = 0.75;
    controls.update();

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

    /* ---------- camera fly-to (used by "Use screen" and "Reset view") ---------- */
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
      if (on) flyTo(SCREEN_POS, SCREEN_TARGET);
      else flyTo(HOME_POS, HOME_TARGET);
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

    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      cssRenderer?.setSize(w, h);
      camera.aspect = w / h;
      // widen the view on portrait screens so the lamp and monitor stay in frame
      camera.fov = w / h < 1 ? 36 + (1 - w / h) * 34 : 36;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
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