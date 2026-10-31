import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { createLiveOrb } from "@/components/common/live-orb";

afterEach(() => vi.unstubAllGlobals());

function failureContext(
  failure: "fragment" | "program" | "link" | "buffer" | "none",
) {
  const shaders = new Set<object>();
  const programs = new Set<object>();
  const buffers = new Set<object>();
  let shaderCalls = 0;
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    BLEND: 8,
    createShader: () => {
      if (++shaderCalls === 2 && failure === "fragment") return null;
      const shader = {};
      shaders.add(shader);
      return shader;
    },
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    createProgram: () => {
      if (failure === "program") return null;
      const program = {};
      programs.add(program);
      return program;
    },
    attachShader() {},
    linkProgram() {},
    getProgramParameter: () => failure !== "link",
    getProgramInfoLog: () => "Fixture link failure",
    useProgram() {},
    createBuffer: () => {
      if (failure === "buffer") return null;
      const buffer = {};
      buffers.add(buffer);
      return buffer;
    },
    bindBuffer() {},
    bufferData() {},
    getAttribLocation: () => 0,
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    getUniformLocation: () => ({}),
    enable() {},
    blendFunc() {},
    viewport() {},
    clearColor() {},
    clear() {},
    uniform2f() {},
    uniform1f() {},
    uniform3f() {},
    drawArrays() {},
    deleteShader: (shader: object) => shaders.delete(shader),
    deleteProgram: (program: object) => programs.delete(program),
    deleteBuffer: (buffer: object) => buffers.delete(buffer),
    isContextLost: () => false,
  };
  return { gl, shaders, programs, buffers };
}

describe("Live Orb partial resource allocation", () => {
  it.each(["fragment", "program", "link", "buffer"] as const)(
    "releases partial allocations after %s failure",
    (failure) => {
      const context = failureContext(failure);
      const canvas = {
        getContext: () => context.gl,
        addEventListener() {},
        removeEventListener() {},
      } as unknown as HTMLCanvasElement;
      const media = {
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      };
      vi.stubGlobal("window", {
        matchMedia: () => media,
        addEventListener() {},
        removeEventListener() {},
      });
      vi.stubGlobal("document", {
        documentElement: {},
        addEventListener() {},
        removeEventListener() {},
      });
      const observer = class {
        observe() {}
        disconnect() {}
      };
      vi.stubGlobal("MutationObserver", observer);
      vi.stubGlobal("ResizeObserver", observer);
      vi.stubGlobal("IntersectionObserver", observer);
      vi.stubGlobal("requestAnimationFrame", () => 1);
      const ready = vi.fn();
      const log = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const orb = createLiveOrb(canvas, { theme: "dark", onHasGl: ready });
        expect(orb).toBeNull();
        expect(ready).not.toHaveBeenCalledWith(true);
        expect(context.shaders.size).toBe(0);
        expect(context.programs.size).toBe(0);
        expect(context.buffers.size).toBe(0);
      } finally {
        log.mockRestore();
      }
    },
  );
});

function activeOrb() {
  const { gl, shaders, programs, buffers } = failureContext("none");
  const draw = vi.spyOn(gl, "drawArrays");
  const viewport = vi.spyOn(gl, "viewport");
  Object.assign(gl, { getExtension: () => null });
  let contextLost = false;
  gl.isContextLost = () => contextLost;
  const media = Object.assign(new EventTarget(), { matches: false });
  const win = Object.assign(new EventTarget(), {
    matchMedia: () => media,
    devicePixelRatio: 1,
  });
  const doc = Object.assign(new EventTarget(), {
    hasFocus: () => true,
    visibilityState: "visible",
    documentElement: {},
  });
  const records: {
    callback: (entries: unknown[]) => void;
    disconnected: boolean;
  }[] = [];
  class Observer {
    record;
    constructor(callback: (entries: unknown[]) => void) {
      this.record = { callback, disconnected: false };
      records.push(this.record);
    }
    observe() {}
    disconnect() {
      this.record.disconnected = true;
    }
  }
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("MutationObserver", Observer);
  vi.stubGlobal("ResizeObserver", Observer);
  vi.stubGlobal("IntersectionObserver", Observer);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (frame: number) =>
    frames.delete(frame),
  );
  const parent = { clientWidth: 96, clientHeight: 96 };
  const canvas = Object.assign(new EventTarget(), {
    getContext: () => gl,
    parentElement: parent,
    width: 96,
    height: 96,
    style: {} as Record<string, string>,
    isConnected: true,
  });
  const ready = vi.fn();
  const orb = createLiveOrb(canvas as unknown as HTMLCanvasElement, {
    theme: "dark",
    onHasGl: ready,
  });
  assert.exists(orb);
  return {
    orb,
    gl,
    shaders,
    programs,
    buffers,
    frames,
    draw,
    viewport,
    canvas,
    doc,
    win,
    media,
    ready,
    records,
    parent,
    setLost: (lost: boolean) => {
      contextLost = lost;
    },
    flush(now = 1000) {
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback(now);
    },
  };
}

describe("Live Orb active lifecycle", () => {
  it("stops immediately on blur and resumes one loop on focus", () => {
    const state = activeOrb();
    state.flush();
    state.win.dispatchEvent(new Event("blur"));
    expect(state.frames.size).toBe(0);
    const drawn = state.draw.mock.calls.length;
    state.win.dispatchEvent(new Event("pointermove"));
    expect(state.frames.size).toBe(0);
    expect(state.draw).toHaveBeenCalledTimes(drawn);
    state.win.dispatchEvent(new Event("focus"));
    state.win.dispatchEvent(new Event("focus"));
    expect(state.frames.size).toBe(1);
    state.orb.destroy();
  });
  it("stops on hidden and offscreen transitions", () => {
    const state = activeOrb();
    state.flush();
    state.doc.visibilityState = "hidden";
    state.doc.dispatchEvent(new Event("visibilitychange"));
    expect(state.frames.size).toBe(0);
    state.doc.visibilityState = "visible";
    state.doc.dispatchEvent(new Event("visibilitychange"));
    expect(state.frames.size).toBe(1);
    state.records[1].callback([{ isIntersecting: false }]);
    expect(state.frames.size).toBe(0);
    state.records[1].callback([{ isIntersecting: true }]);
    expect(state.frames.size).toBe(1);
    state.orb.destroy();
  });
  it("ignores stale frame and observer callbacks after destroy", () => {
    const state = activeOrb();
    const pending = [...state.frames.values()][0];
    state.orb.destroy();
    state.orb.destroy();
    const drawn = state.draw.mock.calls.length;
    const viewed = state.viewport.mock.calls.length;
    pending(1000);
    state.parent.clientWidth = 128;
    state.records[0].callback([]);
    expect(state.draw).toHaveBeenCalledTimes(drawn);
    expect(state.viewport).toHaveBeenCalledTimes(viewed);
    expect(state.frames.size).toBe(0);
    expect(state.records.every((record) => record.disconnected)).toBe(true);
    expect(
      state.ready.mock.calls.filter(([ready]) => ready === false),
    ).toHaveLength(1);
  });
  it("does not touch GL on resize during context loss and rebuilds once", () => {
    const state = activeOrb();
    state.flush();
    state.setLost(true);
    const lost = new Event("webglcontextlost", { cancelable: true });
    state.canvas.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(state.frames.size).toBe(0);
    expect(state.canvas.style.visibility).toBe("hidden");
    const viewed = state.viewport.mock.calls.length;
    state.parent.clientWidth = 128;
    state.records[0].callback([]);
    expect(state.viewport).toHaveBeenCalledTimes(viewed);
    state.setLost(false);
    state.canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(state.frames.size).toBe(1);
    expect(state.canvas.style.visibility).toBe("");
    expect(state.ready.mock.calls.map(([ready]) => ready)).toEqual([
      true,
      false,
      true,
    ]);
    state.orb.destroy();
  });
  it("cleans a failed restore and permits a later rebuild", () => {
    const state = activeOrb();
    state.setLost(true);
    state.canvas.dispatchEvent(
      new Event("webglcontextlost", { cancelable: true }),
    );
    state.shaders.clear();
    state.programs.clear();
    state.buffers.clear();
    const allocate = vi
      .spyOn(state.gl, "createBuffer")
      .mockReturnValueOnce(null);
    state.setLost(false);
    state.canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(state.canvas.style.visibility).toBe("hidden");
    expect(state.frames.size).toBe(0);
    expect(state.shaders.size + state.programs.size + state.buffers.size).toBe(
      0,
    );
    state.canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(state.canvas.style.visibility).toBe("");
    expect(state.frames.size).toBe(1);
    state.orb.destroy();
    allocate.mockRestore();
  });
  it("reduced motion holds one frame and redraws options without a loop", () => {
    const state = activeOrb();
    state.flush();
    state.media.matches = true;
    state.media.dispatchEvent(new Event("change"));
    expect(state.frames.size).toBe(0);
    const drawn = state.draw.mock.calls.length;
    state.orb.setOptions({ theme: "light" });
    state.flush();
    expect(state.draw).toHaveBeenCalledTimes(drawn + 1);
    expect(state.frames.size).toBe(0);
    state.orb.destroy();
  });
  it("restores a still frame while blurred without resuming animation", () => {
    const state = activeOrb();
    state.flush();
    state.win.dispatchEvent(new Event("blur"));
    state.setLost(true);
    state.canvas.dispatchEvent(
      new Event("webglcontextlost", { cancelable: true }),
    );
    const drawn = state.draw.mock.calls.length;
    state.setLost(false);
    state.canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(state.draw).toHaveBeenCalledTimes(drawn + 1);
    expect(state.frames.size).toBe(0);
    state.orb.destroy();
  });
});
