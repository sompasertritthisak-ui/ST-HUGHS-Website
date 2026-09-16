/**
 * Shared geography helpers for the globe and its SVG fallback.
 * Pure functions, no three.js import, so the fallback stays light.
 */

export type GlobeDestination = {
  slug: string;
  country: string;
  isoCode: string;
  lat: number;
  lng: number;
  verified: boolean;
  /** Number of published routes to this destination (shown on hover). */
  routes: number;
};

/** St Hugh's College Vientiane — the single origin node. */
export const ORIGIN = { lat: 17.9757, lng: 102.6331, label: "Vientiane", isoCode: "LA" } as const;

const DEG = Math.PI / 180;

/** Lat/lng → unit-sphere cartesian (y up, z toward camera at lng ≈ -90°). */
export function latLngToXYZ(lat: number, lng: number, r = 1): [number, number, number] {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

/** Group rotation (radians, about Y) that brings a longitude to face the camera. */
export function rotationToFace(lng: number) {
  return (-90 - lng) * DEG;
}

/** Great-circle angular distance in radians. */
export function angularDistance(aLat: number, aLng: number, bLat: number, bLng: number) {
  const a = latLngToXYZ(aLat, aLng);
  const b = latLngToXYZ(bLat, bLng);
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

/** Equirectangular projection for the SVG fallback. */
export function project(lat: number, lng: number, width: number, height: number): [number, number] {
  return [((lng + 180) / 360) * width, ((90 - lat) / 180) * height];
}
