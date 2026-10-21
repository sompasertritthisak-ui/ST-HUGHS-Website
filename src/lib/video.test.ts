// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseVideo } from "./video";

describe("parseVideo", () => {
  it("reads every common YouTube form", () => {
    for (const url of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3", "https://youtu.be/dQw4w9WgXcQ", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://m.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ"]) {
      const v = parseVideo(url);
      expect(v?.kind).toBe("youtube");
      expect(v && v.kind === "youtube" ? v.id : null).toBe("dQw4w9WgXcQ");
    }
  });
  it("reads Vimeo, uploaded files and falls back to a plain link", () => {
    expect(parseVideo("https://vimeo.com/123456789")).toMatchObject({ kind: "vimeo", id: "123456789" });
    expect(parseVideo("/media/alumni/story.mp4")).toEqual({ kind: "file", src: "/media/alumni/story.mp4" });
    expect(parseVideo("https://media.sthughs.edu.la/a/b.webm")).toMatchObject({ kind: "file" });
    expect(parseVideo("https://www.facebook.com/watch/?v=1")).toMatchObject({ kind: "link" });
  });
  it("rejects empty, malformed and unsafe values", () => {
    expect(parseVideo("")).toBeNull();
    expect(parseVideo(null)).toBeNull();
    expect(parseVideo("not a url")).toBeNull();
    expect(parseVideo("javascript:alert(1)")).toBeNull();
  });
});
