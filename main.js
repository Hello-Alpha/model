num = 0;


function saveFile() {
    if (num > 50)
        return;
    var data = '';

    // 创建一个超链接元素，用来下载保存数据的文件
    var link1 = document.createElement('a');
    var link2 = document.createElement('a');
    let urlObject = window.URL || window.webkitURL || window;

    // 通过超链接herf属性，设置要保存到文件中的数据，保存图像
    const canvas = document.querySelector('#glcanvas');
    link1.href = canvas.toDataURL("image/jpeg");
    link1.download = num + '.jpg'; //下载文件名

    //保存文本
    data += "<annotation>\n";
    data += "\t<filename>" + num + ".jpg</filename>\n";
    data += "\t<size>\n\t\t<width>1000</width>\n";
    data += "\t\t<height>1000</height>\n";
    data += "\t\t<depth>3</depth>\n\t</size>\n";
    data += "\t<segmented>0</segmented>\n";
    for (let index = 0; index < bbox.length / 4; index++) {
        data += "\t<object>\n\t\t<name>vita</name>\n\t\t<pose>Unspecified</pose>\n";
        data += "\t\t<truncated>0</truncated>\n\t\t<difficult>0</difficult>\n\t\t<bndbox>\n"
        for (let box = index * 4; box < index * 4 + 4; box++) {
            let pos = parseInt(bbox[box]);
            switch (box % 4) {
                case 0:
                    data += "\t\t\t<xmin>";
                    data += pos.toString();
                    data += '</xmin>\n';
                    break;
                case 1:
                    data += "\t\t\t<ymin>";
                    data += pos.toString();
                    data += '</ymin>\n';
                    break;
                case 2:
                    data += "\t\t\t<xmax>";
                    data += pos.toString();
                    data += '</xmax>\n';
                    break;
                case 3:
                    data += "\t\t\t<ymax>";
                    data += pos.toString();
                    data += '</ymax>\n';
                    break;
                default:
                    break;
            }

        }
        data += "\t\t</bndbox>\n";
        data += "\t</object>\n";
    }
    data += "</annotation>\n";

    let export_blob = new Blob([data], { type: "text/plain" });
    link2.href = urlObject.createObjectURL(export_blob);
    link2.download = num + '.txt'; //下载文件名

    num++;
    link1.click(); //js代码触发超链接元素a的鼠标点击事件，开始下载文件到本地
    link2.click(); //js代码触发超链接元素a的鼠标点击事件，开始下载文件到本地
}
