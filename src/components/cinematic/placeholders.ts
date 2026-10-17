import type { SceneMedia } from "./cinematic-scene";

/**
 * TEMPORARY hero images for the sub-pages, one per page title, chosen to match the headline.
 * They are free-licence photographs hotlinked from Unsplash (https://unsplash.com/license) and are
 * placeholders only: each is to be replaced with St Hugh's own photography through the CMS media
 * library. Nothing here depicts St Hugh's students, staff or premises.
 */
const unsplash = (id: string, position = "50% 50%"): SceneMedia => ({
  poster: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=75`,
  position,
});

export const PAGE_IMAGES = {
  programmes: unsplash("1524178232363-1fb2b075b655", "50% 45%"), // lecture room
  pathways: unsplash("1436491865332-7a61a109cc05", "50% 55%"), // aircraft wing above clouds
  destinations: unsplash("1488646953014-85cb44e25828", "50% 50%"), // map, passport, camera
  universities: unsplash("1562774053-701939374585", "50% 60%"), // university quad
  "student-life": unsplash("1517486808906-6ca8b3f04846", "50% 35%"), // students together outdoors
  campus: unsplash("1498243691581-b145c3f54a5a", "50% 50%"), // library aisle
  about: unsplash("1529156069898-49953e39b3ac", "50% 40%"), // friends looking to the horizon
  careers: unsplash("1600880292203-757bb62b4baf", "50% 40%"), // colleagues celebrating
  admissions: unsplash("1434030216411-0b793f4b4173", "50% 55%"), // writing an application
  "international-students": unsplash("1541339907198-e08756dedf3f", "50% 45%"), // graduates, city skyline
  "why-st-hughs": unsplash("1571260899304-425eee4c7efc", "50% 40%"), // students and teacher in class
  news: unsplash("1552664730-d307ca884978", "50% 45%"), // team planning board
  "student-stories": unsplash("1543269865-cbf427effbad", "50% 40%"), // students laughing together
  resources: unsplash("1427504494785-3a9ca7044f45", "50% 50%"), // library shelves
  faqs: unsplash("1517245386807-bb43f82c33c4", "50% 50%"), // explaining at a laptop
  contact: unsplash("1517048676732-d65bc937f952", "50% 50%"), // conversation at a table
  consultation: unsplash("1557804506-669a67965ba0", "50% 45%"), // advising session
  enquire: unsplash("1454165804606-c3d57bc86b40", "50% 50%"), // notes and laptop
  compare: unsplash("1519389950473-47ba0277781c", "50% 50%"), // desks with laptops
  "pathway-explorer": unsplash("1521295121783-8a321d551ad2", "50% 50%"), // globe
  "pathway-finder": unsplash("1511632765486-a01980e01a18", "50% 45%"), // friends at sunset
  "for/students": unsplash("1522202176988-66273c2fd55f", "50% 40%"), // students studying together
  "for/parents": unsplash("1531545514256-b1400bc00f31", "50% 40%"), // family at a laptop
  "for/partners": unsplash("1521737604893-d14cc237f11d", "50% 50%"), // partner meeting
  "for/employers": unsplash("1504384308090-c894fdcc538d", "50% 50%"), // open-plan office
} satisfies Record<string, SceneMedia>;

export type PageImageKey = keyof typeof PAGE_IMAGES;
