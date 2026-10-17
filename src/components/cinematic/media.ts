import type { SceneMedia } from "./cinematic-scene";

/**
 * Cinematic backdrops. One hero still (generated once) was the visual reference for every clip, so
 * the look is identical across the page. Clips are silent, 8 s, loop, and are only requested when
 * their scene is near the viewport; each has a poster taken from its own first frame.
 *
 * `world` and `campus` are stills (no clip): two different crops of the hero still (the sky with the
 * route line; the lit building and terrace). A clip can be added later by giving them a `src`.
 */
export const CINEMATIC = {
  still: "/media/cinematic/hero-still.jpg",
  origin: { src: "/media/cinematic/origin.mp4", poster: "/media/cinematic/poster-origin.jpg" },
  learning: { src: "/media/cinematic/learning.mp4", poster: "/media/cinematic/poster-learning.jpg" },
  world: { poster: "/media/cinematic/poster-world.jpg", position: "50% 18%" },
  campus: { poster: "/media/cinematic/poster-world.jpg", position: "12% 62%" },
  finale: { src: "/media/cinematic/finale.mp4", poster: "/media/cinematic/poster-finale.jpg" },
} satisfies Record<string, SceneMedia | string>;
