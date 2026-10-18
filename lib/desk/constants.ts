/**
 * Light intensities. three.js r155+ uses physically based light units, so
 * these are candela-style values with inverse-square falloff. Tweak here to
 * change the mood of the room.
 */
export const LIGHTS = {
  ambient: 1.1, // lower than before so the lamp reads as the main light
  hemisphere: 0.7,
  lampSpot: 3.2, // focused cone, casts shadows
  lampWash: 0.9, // wide soft cone, no shadows, fills the area around the pool
  lampFill: 0.15,
  led: 0.35,
  screen: 0.3,
};

/** Position and size of the monitor panel in world units. The CSS3D layer uses the same numbers. */
export const SCREEN = { x: 0, y: 0.35, z: -0.2 + 0.0067, width: 0.84, height: 0.4725 };

/** Wall decor placement (world units). Move these around if the camera crops them. */
export const WALL = {
  z: -0.75,
  motivation: { x: -1.0, y: 0.7, w: 0.36, h: 0.5 },
  code: { x: 1.05, y: 0.7, w: 0.28, h: 0.38 },
};
