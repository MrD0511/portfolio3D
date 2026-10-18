import * as THREE from 'three';
import type { DeskCtx } from './context';
import { LIGHTS } from './constants';

/* ====================================================================== */
/*  Lights, lamp beam and dust                                            */
/* ====================================================================== */

export function buildLights(ctx: DeskCtx, lamp: { shade: THREE.Group; bulb: THREE.Mesh }) {
  const { scene, rl, bulbTex } = ctx;
  const { shade, bulb } = lamp;

  scene.add(new THREE.AmbientLight(0x6b4a34, LIGHTS.ambient));
  scene.add(new THREE.HemisphereLight(0x8a6a4a, 0x1a120c, LIGHTS.hemisphere));

  // Aim along the shade's own axis (its local -Y), and find where that ray hits the desk (y = 0).
  shade.updateMatrixWorld(true);
  const bulbWorld = new THREE.Vector3();
  bulb.getWorldPosition(bulbWorld);
  const aim = new THREE.Vector3(0, -1, 0).transformDirection(shade.matrixWorld);
  const hitDist = bulbWorld.y / -aim.y;
  const hit = bulbWorld.clone().addScaledVector(aim, hitDist);

  // Main cone: warm (about 2700K), focused, casts shadows.
  const lampSpot = new THREE.SpotLight(0xffb36b, LIGHTS.lampSpot, 0, 0.55, 0.9, 2);
  lampSpot.position.copy(bulbWorld);
  lampSpot.target.position.copy(hit);
  lampSpot.castShadow = true;
  lampSpot.shadow.mapSize.set(2048, 2048);
  lampSpot.shadow.camera.near = 0.05;
  lampSpot.shadow.camera.far = 3;
  lampSpot.shadow.bias = -0.0003;
  lampSpot.shadow.normalBias = 0.01;
  scene.add(lampSpot, lampSpot.target);

  // Wide, softer cone with no shadows. This stands in for light bouncing around the desk.
  const lampWash = new THREE.SpotLight(0xff9a50, LIGHTS.lampWash, 0, 1.15, 1, 2);
  lampWash.position.copy(bulbWorld);
  lampWash.target.position.copy(hit);
  scene.add(lampWash, lampWash.target);

  const lampFill = new THREE.PointLight(0xffb870, LIGHTS.lampFill, 0, 2);
  lampFill.position.copy(bulbWorld);
  scene.add(lampFill);

  // Glowing pool of light on the desk, stretched along the beam direction.
  const poolGroup = new THREE.Group();
  poolGroup.position.set(hit.x, 0.0015, hit.z);
  poolGroup.rotation.y = Math.atan2(aim.x, aim.z);
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(0.55, 0.9),
    new THREE.MeshBasicMaterial({
      map: bulbTex,
      color: 0xffa860,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.22,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  poolGroup.add(pool);
  scene.add(poolGroup);

  // Faint visible beam from the bulb to the desk. Edges fade out and it is strongest near the bulb.
  const beamGeo = new THREE.CylinderGeometry(0.012, Math.tan(0.42) * hitDist, hitDist, 48, 1, true);
  beamGeo.translate(0, -hitDist / 2, 0); // top of the cone sits at the bulb
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: new THREE.Color(0xffb066) },
      uStrength: { value: 0.16 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
        float along = pow(clamp(vUv.y, 0.0, 1.0), 1.4);
        gl_FragColor = vec4(uColor, edge * along * uStrength);
      }
    `,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.copy(bulbWorld);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim);
  beam.renderOrder = 1;
  scene.add(beam);

  // Dust motes floating inside the beam.
  const DUST = 70;
  const dustBase = new Float32Array(DUST * 3);
  const dustPos = new Float32Array(DUST * 3);
  const dustPhase = new Float32Array(DUST);
  const tangent = new THREE.Vector3()
    .crossVectors(aim, Math.abs(aim.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0))
    .normalize();
  const bitangent = new THREE.Vector3().crossVectors(aim, tangent);
  const coneR = Math.tan(0.42) * hitDist;
  for (let i = 0; i < DUST; i++) {
    const u = 0.12 + rl() * 0.88;
    const ang = rl() * Math.PI * 2;
    const r = Math.sqrt(rl()) * coneR * u * 0.85;
    const p = bulbWorld
      .clone()
      .addScaledVector(aim, u * hitDist)
      .addScaledVector(tangent, Math.cos(ang) * r)
      .addScaledVector(bitangent, Math.sin(ang) * r);
    p.y = Math.max(p.y, 0.03);
    dustBase.set([p.x, p.y, p.z], i * 3);
    dustPhase[i] = rl() * 6.28;
  }
  dustPos.set(dustBase);
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    map: bulbTex,
    color: 0xffd9a0,
    size: 0.012,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  scene.add(dust);

  const updateDust = (t: number) => {
    for (let i = 0; i < DUST; i++) {
      const ph = dustPhase[i];
      dustPos[i * 3] = dustBase[i * 3] + Math.sin(t * 0.25 + ph) * 0.012;
      dustPos[i * 3 + 1] = Math.max(0.02, dustBase[i * 3 + 1] + Math.sin(t * 0.18 + ph * 1.7) * 0.02);
      dustPos[i * 3 + 2] = dustBase[i * 3 + 2] + Math.cos(t * 0.22 + ph * 1.3) * 0.012;
    }
    dustGeo.attributes.position.needsUpdate = true;
  };

  const ledA = new THREE.PointLight(0xff9440, LIGHTS.led, 0, 2);
  ledA.position.set(-0.55, 0.3, -0.5);
  const ledB = new THREE.PointLight(0xff9440, LIGHTS.led, 0, 2);
  ledB.position.set(0.55, 0.3, -0.5);
  scene.add(ledA, ledB);

  const screenLight = new THREE.PointLight(0xe6f2cf, LIGHTS.screen, 0, 2);
  screenLight.position.set(0, 0.33, 0.14);
  scene.add(screenLight);

  return { lampSpot, lampWash, lampFill, pool, beamMat, dustMat, updateDust, screenLight };
}
