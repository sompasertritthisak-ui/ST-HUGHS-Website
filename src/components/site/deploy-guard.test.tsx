import { describe, it, expect, beforeEach } from "vitest";
import { CHUNK_ERROR, hasUnsavedTyping, noteTyping } from "./deploy-guard";

describe("DeployGuard helpers", () => {
  it("recognises chunk-load failures from Chrome, Firefox and Safari, and nothing else", () => {
    for (const m of ["ChunkLoadError: Loading chunk 123 failed.", "Loading CSS chunk app-layout failed", "TypeError: Failed to fetch dynamically imported module: /_next/x.js", "TypeError: Importing a module script failed.", "error loading dynamically imported module"]) {
      expect(CHUNK_ERROR.test(m)).toBe(true);
    }
    for (const m of ["TypeError: Cannot read properties of undefined", "NetworkError when attempting to fetch resource.", "ReferenceError: x is not defined"]) {
      expect(CHUNK_ERROR.test(m)).toBe(false);
    }
  });

  beforeEach(() => {
    document.body.innerHTML = `<form><input name="n" value="" /><textarea name="m"></textarea><input type="checkbox" name="c" /><select name="s"><option selected>A</option><option>B</option></select><input type="search" name="q" /></form>`;
  });

  it("is false for an untouched form and ignores the search box", () => {
    expect(hasUnsavedTyping()).toBe(false);
    (document.querySelector('[name="q"]') as HTMLInputElement).value = "fees";
    expect(hasUnsavedTyping()).toBe(false);
  });

  it("is true once anything is typed, ticked or chosen", () => {
    (document.querySelector('[name="n"]') as HTMLInputElement).value = "Noy";
    expect(hasUnsavedTyping()).toBe(true);
    document.body.innerHTML = `<textarea></textarea>`;
    (document.querySelector("textarea") as HTMLTextAreaElement).value = "Hello";
    expect(hasUnsavedTyping()).toBe(true);
    document.body.innerHTML = `<input type="checkbox" />`;
    (document.querySelector("input") as HTMLInputElement).checked = true;
    expect(hasUnsavedTyping()).toBe(true);
    document.body.innerHTML = `<select><option selected>A</option><option>B</option></select>`;
    (document.querySelector("select") as HTMLSelectElement).selectedIndex = 1;
    expect(hasUnsavedTyping()).toBe(true);
  });

  it("remembers typing in React-controlled fields, but not in the search box", () => {
    document.body.innerHTML = `<input type="search" id="q" /><input id="n" />`;
    noteTyping(new Event("input", { bubbles: true }) as Event & { target: EventTarget });
    const search = document.getElementById("q")!;
    search.addEventListener("input", noteTyping);
    search.dispatchEvent(new Event("input"));
    expect(hasUnsavedTyping()).toBe(false);
    const name = document.getElementById("n")!;
    name.addEventListener("input", noteTyping);
    name.dispatchEvent(new Event("input"));
    expect(hasUnsavedTyping()).toBe(true); // value === defaultValue here, as with React-controlled inputs
  });
});
