const VERTEX = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

/** A lamp cone from above the page, with fbm smoke drifting through it and chalk dust caught in the light. */
const FRAGMENT = `
precision highp float;
uniform vec2 uResolution;
uniform vec2 uLamp;
uniform float uTime;
uniform vec3 uLight;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(11.3, 7.1);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  vec2 fromLamp = uv - vec2(uResolution.x / uResolution.y * 0.5 + uLamp.x, 1.12 + uLamp.y);
  float below = -fromLamp.y;
  float cone = smoothstep(1.0, 0.15, abs(fromLamp.x) / (0.2 + below * 0.62)) * smoothstep(1.35, 0.1, below);

  vec2 drift = uv + vec2(0.0, uLamp.y * 2.0);
  vec2 warp = vec2(fbm(drift * 2.2 + vec2(0.0, -uTime * 0.03)), fbm(drift * 2.2 + vec2(5.2, uTime * 0.025)));
  float smoke = smoothstep(0.35, 0.85, fbm(drift * 3.0 + warp * 2.2 + vec2(uTime * 0.02, -uTime * 0.05)));

  vec2 cell = uv * 22.0 + vec2(uTime * 0.06, -uTime * 0.12);
  float seed = hash(floor(cell));
  float dust = step(0.965, seed) * smoothstep(0.14, 0.0, length(fract(cell) - 0.5)) * (0.5 + 0.5 * sin(uTime * 1.5 + seed * 90.0));

  float light = cone * (0.08 + 0.7 * smoke + 0.6 * dust) + 0.08 * smoke;
  gl_FragColor = vec4(uLight * light, light) * 0.34;
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.trim().slice(1), 16);
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/** Draws the smoke with raw WebGL, so every page gets it without loading three. */
export class SmokeRenderer {
  private readonly resolution: WebGLUniformLocation | null;
  private readonly lamp: WebGLUniformLocation | null;
  private readonly time: WebGLUniformLocation | null;

  private constructor(
    private readonly gl: WebGLRenderingContext,
    program: WebGLProgram,
    lightHex: string,
  ) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    this.resolution = gl.getUniformLocation(program, "uResolution");
    this.lamp = gl.getUniformLocation(program, "uLamp");
    this.time = gl.getUniformLocation(program, "uTime");
    gl.uniform3fv(gl.getUniformLocation(program, "uLight"), hexToRgb(lightHex));
  }

  /** Null without WebGL or on a shader failure; the page then keeps its CSS lamp gradient. */
  static create(canvas: HTMLCanvasElement, lightHex: string): SmokeRenderer | null {
    const gl = canvas.getContext("webgl", { antialias: false, depth: false, powerPreference: "low-power" });
    if (!gl) return null;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    return new SmokeRenderer(gl, program, lightHex);
  }

  resize(width: number, height: number) {
    this.gl.viewport(0, 0, width, height);
    this.gl.uniform2f(this.resolution, width, height);
  }

  draw(seconds: number, lampX: number, lampY: number) {
    this.gl.uniform1f(this.time, seconds);
    this.gl.uniform2f(this.lamp, lampX, lampY);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }
}
