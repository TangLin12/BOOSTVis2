/**
 * Created by Derek Xiao on 2016/12/8.
 */

(function (console) {

    console.save = function (data, filename) {

        if (!data) {
            console.error('Console.save: No data');
            return;
        }

        if (!filename) filename = 'console.json';

        if (typeof data === "object") {
            data = JSON.stringify(data, undefined, '\t')
        }

        var blob = new Blob([data], {type: 'text/json'}),
            e = document.createEvent('MouseEvents'),
            a = document.createElement('a');

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e)
    }
})(console);

function triggerDownload(imgURI, iteration, class_) {
    var evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
    });

    var a = document.createElement('a');
    a.setAttribute('download', 'tree-' + iteration + "-" + class_ + '.png');
    a.setAttribute('href', imgURI);
    a.setAttribute('target', '_blank');

    a.dispatchEvent(evt);
}


function save_tree2local(iteration, class_) {
    var ele = document.getElementById("#tree-svg");
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var data = (new XMLSerializer()).serializeToString(ele);
    var DOMURL = window.URL || window.webkitURL || window;

    var img = new Image();
    var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    var url = DOMURL.createObjectURL(svgBlob);

    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        DOMURL.revokeObjectURL(url);

        var imgURI = canvas
            .toDataURL('image/png')
            .replace('image/png', 'image/octet-stream');

        triggerDownload(imgURI, iteration, class_);
    };

    img.src = url;
}

function save_svg(id, filename) {
    console.save(d3.select("#" + id).attr("version", "1.1")
        .attr("xmlns", "http://www.w3.org/2000/svg").node().outerHTML, filename);
}

function svg_to_png(container) {
    var wrapper = document.getElementById(container);
    var svg = wrapper.querySelector("svg");

    if (typeof window.XMLSerializer != "undefined") {
        var svgData = (new XMLSerializer()).serializeToString(svg);
    } else if (typeof svg.xml != "undefined") {
        var svgData = svg.xml;
    }

    var canvas = document.createElement("canvas");
    var svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    var ctx = canvas.getContext("2d");

    var img = document.createElement("img");
    img.setAttribute("src", "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData))));

    img.onload = function () {
        ctx.drawImage(img, 0, 0);
        var imgsrc = canvas.toDataURL("image/png");

        var a = document.createElement("a");
        a.download = container + ".png";
        a.href = imgsrc;
        a.click();
    };
}

function svgToPng(svg, filename) {
    var serializer = new XMLSerializer();
    var node = svg.node();
    svg.selectAll("path").attr("fill", "none");
    svg.selectAll("rect").attr("fill", "none")
        .attr("stroke", "#616161");
    var bbox = node.getBoundingClientRect();
    var source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(node);
    var image = new Image;
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    var canvas = document.createElement("canvas");
    canvas.width = bbox.width;
    canvas.height = bbox.height;
    console.log(bbox.width, bbox.height);
    function dlCanvas() {
        var dt = canvas.toDataURL('image/png');
        /* Change MIME type to trick the browser to downlaod the file instead of displaying it */
        dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');

        /* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
        dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename=Canvas.png');

        this.href = dt;
    }

    var link = document.createElement("a");
    link.download = filename ? filename : "download.png";
    link.addEventListener('click', dlCanvas, false);
    var context = canvas.getContext("2d");
    context.fillStyle = '#fff';//���ñ�����PNG �ǰ�ɫ��
    context.fillRect(0, 0, 10000, 10000);
    context.drawImage(image, 0, 0);
    link.click();
    //return canvas.toDataURL("image/png");
}

var saveTrees = function (from, to, class_) {
    tree_inspector.draw_tree(from, class_);
    function save() {
        svgToPng(d3.select("#tree-svg"), tree_inspector.iteration + "-1.png");
        if (tree_inspector.iteration > to) return;
        tree_inspector.draw_tree(tree_inspector.iteration + 1, class_);
        setTimeout(save, 1000);
    }

    save();
};

//saveTrees(0, 5, 1);

var step = function () {
    d3.selectAll(".restLink").attr("fill", "none");
    d3.selectAll(".nodeRect").attr("fill", "none").attr("stroke", "#616161");
    svg_to_png("tree-inspector", tree_inspector.iteration, tree_inspector.class_);
    tree_inspector.draw_tree(tree_inspector.iteration + 1, tree_inspector.class_);
};

var histogram = function (values, bin_count, range) {
    var max_v = _.max(values);
    var min_v = _.min(values);
    var range;
    if (typeof range === "undefined") {
        range = max_v == min_v ? [0, 1] : [max_v - min_v];
    }
    if (typeof bin_count === "undefined") {
        bin_count = 10;
    } else {
        bin_count = bin_count <= 0 ? 10 : bin_count;
    }
    var bin_width = (range[1] - range[0]) / bin_count;
    var histo = [];
    for (var i = 0; i < bin_count; i++) {
        histo.push(0);
    }
    for (var i = 0; i < values.length; i++) {
        var bin_index = Math.floor((values[i] - range[0]) / bin_width);
        histo[bin_index]++;
    }
    // console.log(histo);
    return histo;
};

var tostring = function (list, with_index) {
    var str = "";
    for (var i = 0; i < list.length; i++) {
        str += ((with_index ? (i + "\t") : "") + list[i] + "\n");
    }
    return str;
};

var sum = function (values) {
    return _.reduce(values, function (memo, num) {
        return memo + num;
    }, 0);
};

var parse_matrix = function (data) {
    var lines = data.split("\n");
    var matrix = [];
    var i = 0;
    for (; i < lines.length; i++) {
        var line = lines[i];
        if (line.length == 0) continue;
        var row = line.split(/ +/g);
        matrix.push(row.filter(function (e) {
            return e.length != 0;
        }).map(function (e) {
            return e - 0;
        }));
    }
    matrix.shape = [i - 1, matrix[0].length];
    return matrix;
};

var array_extent = function (array) {
    var max_value = -Infinity;
    var min_value = Infinity;
    var e;
    for (var i = 0; i < array.length; i ++) {
        e = array[i];
        max_value = Math.max(max_value, e);
        min_value = Math.min(min_value, e);
    }
    return [min_value, max_value];
};

var matrix_extent = function (point_mat) {
    var x_max = -Infinity;
    var y_max = -Infinity;
    var x_min = Infinity;
    var y_min = Infinity;
    for (var i = 0; i < point_mat.length; i++) {
        var l = point_mat[i];
        for (var j = 0; j < l.length; j++) {
            var p = l[j];
            for (var k = 0; k < p.length; k++) {
                var e = p[k];
                x_max = Math.max(e, x_max);
                x_min = Math.min(e, x_min);
                y_max = Math.max(e, y_max);
                y_min = Math.min(e, y_min);
            }
        }
    }
    return [[x_min, x_max], [y_min, y_max]];
};


function hexToRGB(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
        return "rgb(" + r + ", " + g + ", " + b + ")";
    }
}

function changeColorLightness(hex, ratio) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);

    r = Math.floor(r * ratio);
    g = Math.floor(g * ratio);
    b = Math.floor(b * ratio);

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return "rgb(" + r + ", " + g + ", " + b + ")";
}

function manhattan_length(l) {
    var s_x = 0;
    var s_y = 0;
    for (var i = 1; i < l.length; i++) {
        s_x += Math.abs(l[i][0] - l[0][0]);
        s_y += Math.abs(l[i][1] - l[0][1]);
    }
    return s_x + s_y;
}

function array_add(a, b) {
    return _.map(a, function (e, i) {
        return (e || 0) + (b[i] || 0);
    });
}

function dot_multiple(a, s) {
    return _.map(a, function (e) {
        return e * s;
    });
}

function request_queue(task_list, callback, result) {
    if (task_list.length == 0) {
        callback(result);
    } else {
        var task = task_list.shift();
        console.log(task);
        d3.json(task, function (data) {
            result.push(data);
            request_queue(task_list, callback, result);
        })
    }
}


function request_text(url, mime_type, callback) {
    var oReq = new XMLHttpRequest();
    oReq.open("GET", url, true);
    oReq.responseType = mime_type;
    oReq.setRequestHeader("cache-control", "no-cache");

    oReq.onload = function (oEvent) {
        var data = oReq.response; // Note: not oReq.responseText
        if (data) {
            callback(data);
        }
    };
    oReq.send(null);
}

function request_binary(task, callback) {
    var oReq = new XMLHttpRequest();
    oReq.open("GET", task, true);
    oReq.responseType = "arraybuffer";
    oReq.setRequestHeader("cache-control", "no-cache");

    oReq.onload = function (oEvent) {
        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
            var byteArray = new Float32Array(arrayBuffer);

            callback(byteArray);
        }
    };

    oReq.send(null);
}


function request_queue_binary(task_list, callback, result) {
    if (task_list.length == 0) {
        callback(result);
    } else {
        var task = task_list.shift();
        console.log(task);
        var oReq = new XMLHttpRequest();
        oReq.open("GET", task, true);
        oReq.responseType = "arraybuffer";
        oReq.setRequestHeader("cache-control", "no-cache");

        oReq.onload = function (oEvent) {
            var arrayBuffer = oReq.response; // Note: not oReq.responseText
            if (arrayBuffer) {
                var byteArray = new Float32Array(arrayBuffer);

                result.push(byteArray);
                request_queue_binary(task_list, callback, result);
            }
        };

        oReq.send(null);
    }
}

function windowToCanvas(canvas, x, y) {
    var bbox = canvas.getBoundingClientRect();

    return {
        x: (x - bbox.left) * (canvas.width / bbox.width),
        y: (y - bbox.top) * (canvas.height / bbox.height)
    };
}

function transpose_matrix(mat) {
    return _.zip.apply(_, mat);
}

d3.selection.prototype.first = function () {
    return d3.select(this[0][0]);
};
d3.selection.prototype.last = function () {
    var last = this.size() - 1;
    return d3.select(this[0][last]);
};

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}

function binaryIndexOf(arr, target) {
    'use strict';

    var minIndex = 0;
    var maxIndex = arr.length - 1;
    var currentIndex;
    var currentElement;

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = arr[currentIndex];

        if (currentElement < target) {
            minIndex = currentIndex + 1;
        }
        else if (currentElement > target) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }
    return -1;
}

var init_tree_level = function (root, level) {
    if (root) {
        root.level = level;
        root.splits = [];

        if (root["C"]) {
            var max = root.level;
            for (var i = 0; i < root["C"].length; i++) {
                var l = init_tree_level(root["C"][i], level + 1);
                max = Math.max(max, l);
            }
            return max;
        } else {
            return root.level;
        }
    } else {
        return -1;
    }
};

function print_canvas(canvas, filename) {
    var a = document.createElement('a');
    a.href = canvas.toDataURL("image/png");
    a.download = filename;
    a.click()
}

function save_cluster_result_all() {
    var cluster_result_all = [];
    for (var i = 0; i < CLASS_COUNT; i++) {
        confidence_lines.perform_advanced_clustering_on_trees(i);
        cluster_result_all.push(jQuery.extend(true, {}, CLASSIFIER_CLUSTERING_RES));
        console.log(i);
    }
    console.save(cluster_result_all, "cluster_result_all.json");
}

function save_instance_cluster_result_all () {
    var all = [];
    for (var i = 0; i < CLASS_COUNT; i ++) {
        all.push(confidence_lines.perform_clustering_on_instances(i));
    }
    console.save(all, "confidence-lines-cluster-result-" + SETNAME + ".json");
}

function get_precision_values (square_matrix) {
    var sum_columns = [];
    for (var i = 0; i < square_matrix.length; i ++) {
        sum_columns.push(0);
        for (var j = 0; j < square_matrix.length; j ++) {
            sum_columns[i] += square_matrix[j][i];
        }
    }

    return sum_columns.map(function (r, i) {
        return square_matrix[i][i] / Math.max(r, 1e-6);
    });
}

function save_canvas(id) {
    var canvas = document.getElementById(id);
    var image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");  // here is the most important part because if you dont replace you will get a DOM 18 exception.
    window.location.href=image; // it will save locally
}