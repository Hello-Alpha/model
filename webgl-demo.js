var cubeRotation = 1.0;
var en_rotate = true;


show();

//
// Start here
//
function show() {
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});

    // If we don't have a GL context, give up now

    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }

    // 顶点着色器
    const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
  `;

    // 片段着色器
    const fsSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

    // Initialize a shader program; this is where all the lighting
    // for the vertices and so forth is established.
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    // Look up which attributes our shader program is using
    // for aVertexPosition, aTextureCoord and also
    // look up uniform locations.
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        }
    };

    // Here's where we call the routine that builds all the
    // objects we'll be drawing.
    const texture = [
        loadTexture(gl, "front.png"),    //front
        loadTexture(gl, "back.png"),    //back
        loadTexture(gl, "top.png"),    //top
        loadTexture(gl, "bottom.png"),    //bottom
        loadTexture(gl, "right.png"),    //right
        loadTexture(gl, "left.png")     //left
    ];
    const center = [
        [0.0, 0.0, 0.0],
        [0.0, 1.2, 0.0]
    ];
    const size = [
        1.0,    //length
        0.8,    //width
        0.6     //height
    ]


    var then = 0.0;
    // Draw the scene repeatedly
    function render(now) {

            gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        for (var cube_index = 0; cube_index < center.length; cube_index++) {
            drawOneCube(gl, programInfo, center[cube_index], size, texture, deltaTime);
        }
        cubeRotation += en_rotate * deltaTime;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

//初始化一个面的buffer
function initBuffers(gl, positions, textureCoordinates, indices) {
    // 1.顶点缓冲区
    // Create a buffer for the cube's vertex positions.
    const positionBuffer = gl.createBuffer();
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


    // 2.创建纹理坐标到立方体各个面的顶点的映射关系
    const textureCoordBuffer = gl.createBuffer();   //创建一个GL缓存区保存每个面的纹理坐标信息
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer); //把这个缓存区绑定到GL
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
        gl.STATIC_DRAW);    //把这个数组里的数据都写到GL缓存区

    // 3.索引缓冲区
    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each face's vertices.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    // Now send the element array to GL
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer,
    };
}

// 初始化纹理并加载
function loadTexture(gl, url) {
    const texture = gl.createTexture(); //1.创建一个GL纹理对象
    gl.bindTexture(gl.TEXTURE_2D, texture); //2.新创建的纹理对象绑定到 gl.TEXTURE_2D 来让它成为当前操作纹理。

    // 初始化纹理
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // 深蓝色
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel); //3.通过调用 texImage2D() 把已经加载的图片图形数据写到纹理

    const image = new Image();  //创建了一个 Image 对象
    //需要当作纹理使用的图形文件加载了进来。当图片加载完成后回调函数就会执行。
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;

    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

//
// Draw the scene.
//
function drawOneCube(gl, programInfo, center, size, texture,deltaTime) {
    var vertex = [];
    {
        vertex.push(center[0] + size[1] / 2); vertex.push(center[1] + size[0] / 2); vertex.push(center[2] + size[2] / 2);
        vertex.push(center[0] - size[1] / 2); vertex.push(center[1] + size[0] / 2); vertex.push(center[2] + size[2] / 2);
        vertex.push(center[0] + size[1] / 2); vertex.push(center[1] - size[0] / 2); vertex.push(center[2] + size[2] / 2);
        vertex.push(center[0] - size[1] / 2); vertex.push(center[1] - size[0] / 2); vertex.push(center[2] + size[2] / 2);
        vertex.push(center[0] + size[1] / 2); vertex.push(center[1] + size[0] / 2); vertex.push(center[2] - size[2] / 2);
        vertex.push(center[0] - size[1] / 2); vertex.push(center[1] + size[0] / 2); vertex.push(center[2] - size[2] / 2);
        vertex.push(center[0] + size[1] / 2); vertex.push(center[1] - size[0] / 2); vertex.push(center[2] - size[2] / 2);
        vertex.push(center[0] - size[1] / 2); vertex.push(center[1] - size[0] / 2); vertex.push(center[2] - size[2] / 2);
    }
    const indices = [
        2, 0, 4, 6,    // front
        1, 3, 7, 5,    // back
        3, 1, 0, 2,   // top
        6, 4, 5, 7,   // bottom
        0, 1, 5, 4,   // right
        3, 2, 6, 7   // left
    ];

    const textureCoordinates = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ];
    var buffers;
    var positions;
    var index;

    for (let face_index = 0; face_index < 6; face_index++){
        positions = [];
        for (var i = 0; i < 4; i++){
            for (var j = 0; j < 3; j++){
                positions.push(vertex[indices[face_index * 4 + i] * 3 + j]);
            }
        }
        index = [
            0, 1, 2, 0, 2, 3
        ];
        buffers = initBuffers(gl, positions, textureCoordinates, index);
        drawOneFace(gl, programInfo, buffers, texture[face_index]);
    }
}


function drawOneFace(gl, programInfo, buffers, texture,deltaTime) {
    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.

    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [-0.0, 0.0, -6.0]);  // amount to translate
    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        cubeRotation,     // amount to rotate in radians
        [0, 0, 1]);       // axis to rotate around (Z)
    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        cubeRotation * .7,// amount to rotate in radians
        [0, 1, 0]);       // axis to rotate around (X)

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the texture coordinates from
    // the texture coordinate buffer into the textureCoord attribute.
    {
        const numComponents = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.textureCoord);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    //使用纹理
    // Tell WebGL we want to affect texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture to texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    {
        const vertexCount = 6;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function sign(index, axis) {
    if (axis == 0){
        if (index % 2 == 0) return 1;
        else return -1;
    }
    else if (axis == 1) {
        if ((index / 2) % 2 == 0) return 1;
        else return -1;
    }
    else if (axis == 2) {
        if ((index / 4) % 2 == 0) return 1;
        else return -1;
    }
    return 0;
}