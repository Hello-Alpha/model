//=============================================================
//可以更改的部分
label = "bud";
id = "bud_3*3";
const center = [
    [0.0, -1.0, 0.0],
    [0.0, -1.0, -1.0],
    [0.0, 0.0, -1.0],
    [0.0, -1.0, 1.0],
    [0.0, 1.0, -1.0],
    [0.0, 0.0, 0.0],
    [0.0, 0.0, 1.0],
    [0.0, 1.0, 0.0],
    [0.0, 1.0, 1.0]
];
const size = [
    1.0,    //length
    0.7,    //width
    1.0     //height
];
argument = [
    [-7, -4, 4],   //far: [a,b), 10
    [-0.7, -0.3, 5],   //phi
    [0.3, 0.5, 5]  //theta
];
var phi_vis_right = -0.6;   // 当phi小于这个数的时候右边看得见
var phi_vis_left = -0.41;   // 当phi大于这个数的时候左边看得见
var theta_vis_top = 0.4;   // 当theta小于这个数的时候顶上看得见
//=============================================================

var cubeRotation = 1.0;
var en_rotate = 0;
var dist = -5;
var phi = -0.5;
var theta = 0.5;
var bbox = [];  // bounding box: x, y, 宽， 高
var target = [0, 0, 0];
var up = [0, 2, 0];
var eye = [0, 0, 6];

function loadSkybox(gl, urls) {
    const texture = gl.createTexture(); //1.创建一个GL纹理对象
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture); //2.新创建的纹理对象绑定到 gl.TEXTURE_CUBE 来让它成为当前操作纹理。

    // 初始化纹理
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // 深蓝色

    //天空盒六面信息
    const faceInfos = [
        //右
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
            url: urls[0],
        },
        //左
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
            url: urls[1],
        },
        //上
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
            url: urls[2],
        },
        //下
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
            url: urls[3],
        },
        //后
        {
            target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
            url: urls[4],
        },
        //前
        {
            target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            url: urls[5],
        },
    ];
    faceInfos.forEach((faceInfo) => {
        const { target, url } = faceInfo;

        // 初始化为深蓝色
        gl.texImage2D(target, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

        // 异步加载图片
        const image = new Image();
        image.src = url;
        image.onload = function () {
            //纹理加载完毕后将其绑定至对应cube map的面
            gl.texImage2D(target, level, internalFormat, srcFormat, srcType, image);
            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                // Yes, it's a power of 2. Generate mips.
                gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
            }
            else {
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            }
        };
    });
    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

show();
//雾天天空盒的绘制部分，其纹理坐标与世界坐标是对应的，所以只需要绑定纹理坐标和index信息
function drawSkybox(gl, sky_programInfo, buffer, skybox, viewMatrix, projectionMatrix) {
    {
        const numComponents = 3;//每次取出3个数值
        const type = gl.FLOAT;//取出数据为浮点数类型
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.textureCoord);
        gl.vertexAttribPointer(
            sky_programInfo.attribLocations.textureCoord,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            sky_programInfo.attribLocations.textureCoord);
    }
    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.index);
    //webGL使用此程序进行绘制
    gl.useProgram(sky_programInfo.program);
    // gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skybox);
    // Tell the shader we bound the texture to texture unit 0
    gl.uniform1i(sky_programInfo.uniformLocations.uSampler, 0);
    gl.uniformMatrix4fv(
        sky_programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        sky_programInfo.uniformLocations.viewMatrix,
        false,
        viewMatrix);
    {
        const offset = 0;
        const type = gl.UNSIGNED_SHORT;
        const vertexCount = 36;
        //按连续的三角形方式以此按点绘制
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}
//天空盒buffer，因为纹理坐标与世界坐标是对应的，使用原点到立方体的向量所采样的点即可实现映射，只需要positions信息即可
function initSkybox(gl) {
    var scale = 8;
    const positions = [
        // positions          
        -1.0 * scale, 1.0 * scale, -1.0 * scale,
        -1.0 * scale, -1.0 * scale, -1.0 * scale,
        1.0 * scale, -1.0 * scale, -1.0 * scale,
        1.0 * scale, -1.0 * scale, -1.0 * scale,
        1.0 * scale, 1.0 * scale, -1.0 * scale,
        -1.0 * scale, 1.0 * scale, -1.0 * scale,

        -1.0 * scale, -1.0 * scale, 1.0 * scale,
        -1.0 * scale, -1.0 * scale, -1.0 * scale,
        -1.0 * scale, 1.0 * scale, -1.0 * scale,
        -1.0 * scale, 1.0 * scale, -1.0 * scale,
        -1.0 * scale, 1.0 * scale, 1.0 * scale,
        -1.0 * scale, -1.0 * scale, 1.0 * scale,

        1.0 * scale, -1.0 * scale, -1.0 * scale,
        1.0 * scale, -1.0 * scale, 1.0 * scale,
        1.0 * scale, 1.0 * scale, 1.0 * scale,
        1.0 * scale, 1.0 * scale, 1.0 * scale,
        1.0 * scale, 1.0 * scale, -1.0 * scale,
        1.0 * scale, -1.0 * scale, -1.0 * scale,

        -1.0 * scale, -1.0 * scale, 1.0 * scale,
        -1.0 * scale, 1.0 * scale, 1.0 * scale,
        1.0 * scale, 1.0 * scale, 1.0 * scale,
        1.0 * scale, 1.0 * scale, 1.0 * scale,
        1.0 * scale, -1.0 * scale, 1.0 * scale,
        -1.0 * scale, -1.0 * scale, 1.0 * scale,

        -1.0 * scale, 1.0 * scale, -1.0 * scale,
        1.0 * scale, 1.0 * scale, -1.0 * scale,
        1.0 * scale, 1.0 * scale, 1.0 * scale,
        1.0 * scale, 1.0 * scale, 1.0 * scale,
        -1.0 * scale, 1.0 * scale, 1.0 * scale,
        -1.0 * scale, 1.0 * scale, -1.0 * scale,

        -1.0 * scale, -1.0 * scale, -1.0 * scale,
        -1.0 * scale, -1.0 * scale, 1.0 * scale,
        1.0 * scale, -1.0 * scale, -1.0 * scale,
        1.0 * scale, -1.0 * scale, -1.0 * scale,
        -1.0 * scale, -1.0 * scale, 1.0 * scale,
        1.0 * scale, -1.0 * scale, 1.0 * scale
    ];

    //在positions中所有点信息已经列齐，index只需按序对应即可
    var indices = new Array();
    for (var i = 0; i < 36; i++)
        indices.push(i);

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        textureCoord: textureCoordBuffer,
        index: indexBuffer,
    }

}


function setProjectionMatrix(gl) {
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 1000.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);
    return projectionMatrix;
}

function setViewMatrix() {
    //设置view坐标系
    const ViewMatrix = mat4.create();
    mat4.lookAt(ViewMatrix, eye, target, up);
    return ViewMatrix;
}
//
// Start here
//
function show() {
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

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
    //定义天空盒顶点着色器
    const sky_vsSource = `
    attribute vec4 aTextureCoord;   //纹理坐标

    uniform mat4 uProjectionMatrix;  //投影矩阵，用于定位投影
    uniform mat4 uViewMatrix;  //视角矩阵，用于定位观察位置

    varying highp vec3 vTextureCoord;
    
    void main() {
      vec4 pos = uProjectionMatrix * uViewMatrix * aTextureCoord;  //点坐标位置
      gl_Position = pos.xyww; //使其深度始终是w/w = 1,欺骗深度检测使天空盒在深处
      vTextureCoord = aTextureCoord.xyz;
    }
  `;
    //定义天空盒片段着色器
    const sky_fsSource = `
    varying highp vec3 vTextureCoord;
    precision mediump float;
    uniform samplerCube uSampler;

    void main() {
        vec4 color=textureCube(uSampler, normalize(vTextureCoord));
        
      gl_FragColor = color;
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
    const sky_shaderProgram = initShaderProgram(gl, sky_vsSource, sky_fsSource);

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
    const sky_programInfo = {
        program: sky_shaderProgram,
        attribLocations: {
            textureCoord: gl.getAttribLocation(sky_shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(sky_shaderProgram, 'uProjectionMatrix'),
            viewMatrix: gl.getUniformLocation(sky_shaderProgram, 'uViewMatrix'),
            uSampler: gl.getUniformLocation(sky_shaderProgram, 'uSampler'),
        },
    };
    var skybox_urls = [
        "background.jpg",
        "background.jpg",
        "background.jpg",
        "background.jpg",
        "background.jpg",
        "background.jpg",
    ];
    var skybox = loadSkybox(gl, skybox_urls);
    // 天空盒
    const skyboxbuffer = initSkybox(gl);
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

    var argument_list = [];
    var argument_id = 0;


    for (let i = argument[0][0]; i < argument[0][1] + 0.001; i += (argument[0][1] - argument[0][0]) / (argument[0][2] - 1)) {
        for (let j = argument[1][0]; j < argument[1][1] + 0.001; j += (argument[1][1] - argument[1][0]) / (argument[1][2] - 1)) {
            for (let k = argument[2][0]; k < argument[2][1] + 0.001; k += (argument[2][1] - argument[2][0]) / (argument[2][2] - 1)) {
                argument_list.push([i, j, k]);
            }
        }
    }


    const projectionMatrix = setProjectionMatrix(gl);
    const viewMatrix = setViewMatrix();
    var then = 0.0;
    // Draw the scene repeatedly
    function render(now) {

        gl.clearColor(0.5, 0.5, 0.5, 1.0);  // Clear to black, fully opaque
        gl.clearDepth(1.0);                 // Clear everything
        gl.enable(gl.DEPTH_TEST);           // Enable depth testing
        gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

        // Clear the canvas before we start drawing on it.

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);



        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;

        drawSkybox(gl, sky_programInfo, skyboxbuffer, skybox, viewMatrix, projectionMatrix);

        bbox = [];
        for (var cube_index = 0; cube_index < center.length; cube_index++) {
            drawOneCube(gl, programInfo, center[cube_index], size, texture, deltaTime);
        }

        if (deltaTime >= val / 1000 && en_rotate == 1) {
            //更新参数
            then = now;

            dist = en_rotate * argument_list[argument_id][0];
            phi = en_rotate * argument_list[argument_id][1];
            theta = en_rotate * argument_list[argument_id][2];
            argument_id++;
            if (argument_id > argument_list.length) {
                save_file_flag = false;
            }
            if (save_file_flag == true) {
                download_finish = false;
                saveFile();
                while (download_finish == false) {
                    ;   //阻塞saveFile函数
                }
            }
        }
        if (save_file_flag == true) {
            en_rotate = 1;
        }
        else {
            en_rotate = 0;
        }


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


function createMatrix(gl) {
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
        [-0.0, 0.0, dist]);  // amount to translate
    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        theta * Math.PI,// amount to rotate in radians
        [-1, 0, 0]);       // axis to rotate around (Y)
    mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        phi * Math.PI,// amount to rotate in radians
        [0, 0, 1]);       // axis to rotate around (X)

    return {
        projectionMatrix: projectionMatrix,
        modelViewMatrix: modelViewMatrix,
    };
}
//
// Draw the scene.
//
function drawOneCube(gl, programInfo, center, size, texture, deltaTime) {
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

    matrix = createMatrix(gl);
    projectionMatrix = matrix.projectionMatrix;
    modelViewMatrix = matrix.modelViewMatrix;


    for (let face_index = 0; face_index < 6; face_index++) {
        positions = [];
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 3; j++) {
                positions.push(vertex[indices[face_index * 4 + i] * 3 + j]);
            }
        }
        index = [
            0, 1, 2, 0, 2, 3
        ];
        buffers = initBuffers(gl, positions, textureCoordinates, index);
        drawOneFace(gl, programInfo, buffers, texture[face_index], projectionMatrix, modelViewMatrix);
    }

    //计算顶点坐标
    calVertexPos(gl, programInfo, vertex, projectionMatrix, modelViewMatrix);

}

function findv(sort, vertexs) {
    var max = [-100, -100];
    var min = [100, 100];
    if (sort == "max") {
        for (var i = 0; i < vertexs.length; i++) {
            if (vertexs[i][0] > max[0])
                max[0] = vertexs[i][0];
            if (vertexs[i][1] > max[1])
                max[1] = vertexs[i][1];
        }
        return max;
    }
    if (sort == "min") {
        for (var i = 0; i < vertexs.length; i++) {
            if (vertexs[i][0] < min[0])
                min[0] = vertexs[i][0];
            if (vertexs[i][1] < min[1])
                min[1] = vertexs[i][1];
        }
        return min;
    }
}

function calVertexPos(gl, programInfo, vertex, projectionMatrix, modelViewMatrix) {
    const width = gl.canvas.clientWidth;
    const height = gl.canvas.clientHeight;
    var position = [];  //点的集合
    var vert_pos = [];  //点
    var visible = [];   //点是否可见
    var flag;
    var left, right, up, down;
    var VertexPosition = vec3.create();
    var gl_Position = vec3.create();
    var out = mat4.create();

    var x_min = -size[1] / 2;
    var z_min, z_max;
    var y_min, y_max;
    for (let index = 0; index < center.length; index++) {
        const element = center[index];
        if (index == 0) {
            z_min = z_max = element[2];
            y_min = y_max = element[1];
        }
        else {
            if (element[2] > z_max) z_max = element[2];
            if (element[2] < z_min) z_min = element[2];
            if (element[1] > y_max) y_max = element[1];
            if (element[1] < y_min) y_min = element[1];
        }
    }
    z_max = z_max * size[2] + size[2] / 2;
    z_min = z_min * size[2] - size[2] / 2;
    y_max = y_max * size[0] + size[0] / 2;
    y_min = y_min * size[0] - size[0] / 2;

    var invisible = [];     //不可见的点的集合
    var invis_right = [];   //右边的点
    var invis_left = [];    //左边的点
    var invis_top = [];     //上面的点

    for (let y = y_min; y < y_max + 0.001; y += size[0]) {
        if (Math.abs(y - y_min) < 0.001) {
            // y = y_min
            for (let z = z_min; z < z_max - 0.001; z += size[2]) {
                invis_left.push([x_min, y, z]);
            }
        }
        else if (Math.abs(y - y_max) < 0.001) {
            // y = y_max;
            for (let z = z_min; z < z_max - 0.001; z += size[2]) {
                invis_right.push([x_min, y, z]);
            }
        }
        else {
            for (let z = z_min; z < z_max - 0.001; z += size[2]) {
                invisible.push([x_min, y, z]);
            }
            invis_top.push([x_min, y, z_max]);
        }
    }
    if (theta >= theta_vis_top) {
        invisible = invisible.concat(invis_top);
    }
    if (phi >= phi_vis_left) {
        //左边的点看得见，右边的点不可见
        invisible = invisible.concat(invis_right);
    }
    else if (phi <= phi_vis_right) {
        //右边的点看得见，左边的点不可见
        invisible = invisible.concat(invis_left);
    }
    else {
        invisible = invisible.concat(invis_left);
        invisible = invisible.concat(invis_right);
    }

    for (let vertex_num = 0; vertex_num < vertex.length / 3; vertex_num++) {
        flag = 1;   //默认可见
        for (let temp = 0; temp < invisible.length; temp++) {
            if ((invisible[temp][0] == vertex[vertex_num * 3]) && (invisible[temp][1] == vertex[vertex_num * 3 + 1]) && (invisible[temp][2] == vertex[vertex_num * 3 + 2])) {
                flag = 0;
                break;
            }
        }
        VertexPosition = vec3.set(VertexPosition, vertex[vertex_num * 3], vertex[vertex_num * 3 + 1], vertex[vertex_num * 3 + 2]);
        out = mat4.multiply(out, projectionMatrix, modelViewMatrix)
        gl_Position = vec3.transformMat4(gl_Position, VertexPosition, out);
        vert_pos = [gl_Position[0] * width * 0.5 + width * 0.5, gl_Position[1] * height * 0.5 + height * 0.5];
        //console.log("Position: x = ", vert_pos[0], " y = ", vert_pos[1]);
        position.push(vert_pos);
        visible.push(flag)
        // var ver = [gl_Position[0], gl_Position[1]];
        // Vertexs_mat.push(ver);
    }

    for (let box_num = 0; box_num < position.length / 8; box_num++) {
        left = width;
        right = 0;
        up = 0;
        down = height;
        for (let vertex_num = box_num * 8; vertex_num < box_num * 8 + 8; vertex_num++) {
            if (visible[vertex_num] == 0)
                continue;
            if (position[vertex_num][0] < left) left = position[vertex_num][0];
            if (position[vertex_num][0] > right) right = position[vertex_num][0];
            if (position[vertex_num][1] > up) up = position[vertex_num][1];
            if (position[vertex_num][1] < down) down = position[vertex_num][1];
        }
        down = height - down;
        up = height - up;
        if (left < 0) left = 0;
        if (up < 0) up = 0;
        if (right > height) right = height;
        if (down > width) down = width;
        bbox.push(left, up, right, down);
    }




    // var minvertex = findv("min", Vertexs_mat);
    // var maxvertex = findv("max", Vertexs_mat);

    // positions.push(minvertex[0], minvertex[1], maxvertex[0], minvertex[1], maxvertex[0], maxvertex[1], minvertex[0], maxvertex[1], minvertex[0], minvertex[1]);

    // //    positions = [-1, -1, -1, 1, 1, 1, 1, -1, -1, -1];
    // var colors = [1, 0, 0, 1,
    //     1, 0, 0, 1,
    //     1, 0, 0, 1,
    //     1, 0, 0, 1,
    //     1, 0, 0, 1];
    // var is2d = 1;
    // var box_buffers = initBoxBuffers(gl, positions, colors, is2d);
    // var matrix = mat4.fromValues(1, 0, 0, 0,
    //     0, 1, 0, 0,
    //     0, 0, 1, 0,
    //     0, 0, 0, 1);
    // //drawOneBox(gl, programInfo, box_buffers, matrix, matrix);

}

function drawOneFace(gl, programInfo, buffers, texture, projectionMatrix, modelViewMatrix) {
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

// function sign(index, axis) {
//     if (axis == 0) {
//         if (index % 2 == 0) return 1;
//         else return -1;
//     }
//     else if (axis == 1) {
//         if ((index / 2) % 2 == 0) return 1;
//         else return -1;
//     }
//     else if (axis == 2) {
//         if ((index / 4) % 2 == 0) return 1;
//         else return -1;
//     }
//     return 0;
// }

function change_dist() {
    dist = document.getElementById('far').value;
    document.getElementById('dist_value').innerHTML = dist;
}

function change_phi() {
    phi = document.getElementById('phi').value;
    document.getElementById('phi_value').innerHTML = phi;
}

function change_theta() {
    theta = document.getElementById('theta').value;
    document.getElementById('theta_value').innerHTML = theta;
}