function saveFile() {
    // 创建一个超链接元素，用来下载保存数据的文件
    var link = document.createElement('a');
    // 通过超链接herf属性，设置要保存到文件中的数据
    const canvas = document.querySelector('#glcanvas');
    link.href = canvas.toDataURL("image/png");
    link.download = 'threejs.png'; //下载文件名
    link.click(); //js代码触发超链接元素a的鼠标点击事件，开始下载文件到本地
}