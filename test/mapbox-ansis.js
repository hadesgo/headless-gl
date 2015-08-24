var width = 1;
var height = 1;

var web = typeof process === 'undefined';

if (web) {
    var canvas = document.getElementById("can");
    canvas.width = width;
    canvas.height = height;
    var gl = canvas.getContext("experimental-webgl");
} else {
    var gl = require('../index')(width, height);
}

web = true

var vertexSource = (web ? "precision mediump float;\n" : "") +
"uniform float u_z;\n" +
"attribute vec2 a_position;\n" +
"void main() {\n" +
"   gl_Position = vec4(a_position, u_z, 1);\n" +
"}";

var fragmentSource = (web ? "precision mediump float;\n" : "") +
"uniform vec4 u_color;\n" +
"void main() {\n" +
"      gl_FragColor = u_color;  // green\n" +
"}";

var vertex = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertex, vertexSource);
gl.compileShader(vertex);
var fragment = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragment, fragmentSource);
gl.compileShader(fragment);
var program = gl.createProgram();
gl.attachShader(program, vertex);
gl.attachShader(program, fragment);
gl.linkProgram(program);
if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(vertex));
}
if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(fragment));
}

gl.useProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
}

// Attribute and uniform locations
var aPosition = gl.getAttribLocation(program, "a_position");
var uColor = gl.getUniformLocation(program, "u_color");
var uZ = gl.getUniformLocation(program, "u_z");

// Set up framebuffer
gl.renderbuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, gl.renderbuffer);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, width, height);

gl.DEPTH_STENCIL = 0x84F9;
gl.DEPTH_STENCIL_ATTACHMENT = 0x821A;
gl.depthStencilBuffer = gl.createRenderbuffer();
gl.bindRenderbuffer(gl.RENDERBUFFER, gl.depthStencilBuffer);
gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, gl.drawingBufferWidth, gl.drawingBufferHeight);

var fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, gl.renderbuffer);
gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, gl.depthStencilBuffer);

// Clear screen to red
gl.clearColor(1.0, 0.0, 0.0, 0.5);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.colorMask(true, true, true, true);

// Clear the depth buffer to 1
gl.clearDepth(1);
gl.depthMask(true);
gl.clear(gl.DEPTH_BUFFER_BIT);

// Create a buffer and put a single clipspace rectangle in
// it (2 triangles)
var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
        gl.ARRAY_BUFFER,
        new Int16Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0]),
        gl.STATIC_DRAW);

gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 2, gl.SHORT, false, 4, 0);

gl.viewport(0, 0, width, height);
gl.disable(gl.STENCIL_TEST);
gl.enable(gl.DEPTH_TEST);


gl.depthFunc(gl.LEQUAL);

// Draw green rectangle.
// 0.5 mapped to 0..0.1 is <= than the cleared depth value 1 so this should get drawn
gl.uniform1f(uZ, 0.5);
gl.uniform4fv(uColor, [0, 1, 0, 1]);
gl.depthRange(0, 0.1);
gl.drawArrays(gl.TRIANGLES, 0, 6);

// Draw blue rectangle
// 0.5 mapped to 0.9..1 > the green rectangle's z value so it shouldn't get written
gl.uniform1f(uZ, 0.5);
gl.uniform4fv(uColor, [0, 0, 1, 1]);
gl.depthRange(0.9, 1);
gl.drawArrays(gl.TRIANGLES, 0, 6);


// But it looks like depthRange isn't having any effect.
// The blue rectangle gets drawn because 0.5 <= 0.5


//Write output
var pixels = new Uint8Array(width * height * 4);
gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
for(var i = 0; i < pixels.length; ++i) {
    console.log(pixels[i]);
}

// check whether the blue rectangle got clipped as expected.
console.log(pixels[1] === 255);

//gl.destroy();
