/**
 * Modified by Junlin Liu on 17/6/4.
 */

function FlowingConfusionMatrix(container) {
    var that = this;

    that.container = container;
    that.set_element_style();
    that.set_element_size();
    that.set_canvas_context();

    that.loading = add_loading_circle(d3.select("#block-1-4"));
}

FlowingConfusionMatrix.prototype.set_element_style = function () {
    var that = this;

    d3.select(".class-level-header").style("opacity", 0);
    d3.select("#block-1-4").style("opacity", 0);

    that.container.style("z-index", 0);
    that.container.attr("data-hint", "click one strip to investigate the class")
        .attr("data-position", "right");
    that.container.select("div").remove();
    that.container.select("canvas").remove();

    that.title_holder = that.container.append("div")
        .attr("width", that.width)
        .attr("height", that.height * 0.07)
        .append("text")
        .attr("id", "cm-title")
        .text("Temporal Confusion Matrix")
        .style("font-size", 11 + "px");
};

FlowingConfusionMatrix.prototype.set_element_size = function () {
    var that = this;

    var bbox = that.container.node().getBoundingClientRect();
    that.width = bbox.width;
    that.height = bbox.height;
};

FlowingConfusionMatrix.prototype.set_canvas_context = function () {
    var that = this;

    that.canvas = that.container.append("canvas")
        .attr("width", that.width)
        .attr("height", that.height * 0.93)
        .attr("id", "conf-mat-canvas")
        .node();
    that.canvas.parent = that;
    that.context = that.canvas.getContext('2d');

    that.canvas.top_gap = 1;
    that.canvas.bottom_gap =15;
};

FlowingConfusionMatrix.prototype.set_matrix_data = function (matrices, ranking) {
    var that = this;

    that.matrices = matrices;
    this.ranking = ranking;
    this.reverse_ranking = {};
    for (var i = 0; i < ranking.length; i ++) {
        this.reverse_ranking[ranking[i]] = i;
    }
};

FlowingConfusionMatrix.prototype.set_selected_classes = function (selected_classes) {
    var that = this;

    that.selected_classes = selected_classes;

    that.set_selected_matrices();
};

FlowingConfusionMatrix.prototype.set_selected_matrices = function () {
    var that = this;

    that.selected_matrices = [];

    for (var t = 0; t < that.matrices.length; t++) {
        var mat = that.matrices[t];
        var selected_mat = [];

        that.selected_classes.forEach(function (c) {
            var row = [];
            that.selected_classes.forEach(function (c1) {
                row.push(mat[c][c1]);
            });
            selected_mat.push(row);
        });

        that.selected_matrices.push(selected_mat);
    }
};

FlowingConfusionMatrix.prototype.set_segment_count = function (T) {
    var that = this;

    that.T = T;
};

FlowingConfusionMatrix.prototype.set_endpoints_data = function (endpoints) {
    var that = this;
    that.endpoints = endpoints;
};

FlowingConfusionMatrix.prototype.refresh_canvas = function () {
    var that = this;

    that.render_flowing_matrix();
};

FlowingConfusionMatrix.prototype.get_class_color = function (class_label) {
    return color_manager.get_color(this.ranking[class_label]);
};

FlowingConfusionMatrix.prototype.resize = function () {
    var that = this;
    var bbox = that.container.node().getBoundingClientRect();
    that.width = bbox.width;
    that.height = bbox.height;

    that.canvas.width = that.width;
    that.canvas.height = that.height * 0.93;

    that.refresh_canvas();
};

FlowingConfusionMatrix.prototype.render_view = function () {
    var that = this;

    if (that.endpoints == null) {
        that.get_initial_segmentation();
    }

    that.render_flowing_matrix();
    that.register_mouse_events();

    d3.select("#block-1-4").style("opacity", 1);
    d3.select(".class-level-header").style("opacity", 1);
    d3.select(that.loading).remove();
};

FlowingConfusionMatrix.prototype.render_flowing_matrix = function () {
    var that = this;

    that.calculate_layout();
    that.draw_false_positive_matrix_flow();
    that.draw_background_diagonals();
    that.draw_true_positive_matrix_flow();
    that.refill_blanks();
    that.draw_dashed_lines();
    that.draw_iteration_text();

    //print_canvas(that.canvas, 'confusion_matrix.png');
};

FlowingConfusionMatrix.prototype.calculate_layout = function () {
    var that = this;

    var M = that.selected_classes.length;
    var T = that.T;

    var sampled_matrices = [], sampled_sum = [];
    for (var t = 0; t < T; t++) {
        sampled_matrices.push(that.selected_matrices[that.endpoints[t]]);
    }

    for (t = 0; t < T; t++) {
        var mat = sampled_matrices[t];
        var mat_sum = 0;
        for (var i = 0; i < M; i++) {
            for (var j = 0; j < M; j++) {
                var i1 = this.ranking[i];
                var j1 = this.ranking[j];
                mat_sum += Math.pow(mat[i1][j1], 0.6);
            }
        }
        sampled_sum.push(mat_sum);
    }

    var max_sum = _.max(sampled_sum);

    var xl = [], xr = [], yt = [], yb = [];

    var canvas_height = that.canvas.height;
    var canvas_width = that.canvas.width;
    var top_gap = that.canvas.top_gap;
    var bottom_gap = that.canvas.bottom_gap;
    var default_inter_class_gap = 8;

    var is_normalize = true;

    for (t = 0; t < T; t++) {
        mat = sampled_matrices[t];
        var ratio = sampled_sum[t] / max_sum;
        var inter_class_gap = default_inter_class_gap;
        var normalizor = (sampled_sum[t] + (CLASS_COUNT - 1) * inter_class_gap) / (max_sum + (CLASS_COUNT - 1) * inter_class_gap);
        var ytop = 0;
        if (is_normalize) {
            ytop = top_gap;
        } else {
            ytop = Math.round((canvas_height - top_gap - bottom_gap - inter_class_gap * (M - 1)) * (1.0 - ratio) * 0.5 + top_gap);
        }
        var xleft = Math.round((canvas_width) / T * t);
        var xright = Math.round((canvas_width) / T * (t + 1));

        var xlm = [], xrm = [], ytm = [], ybm = [];
        for (j = 0; j < M; j++) {
            var j1 = this.ranking[j];
            var xlv = [], xrv = [], ytv = [], ybv = [];
            for (i = 0; i < M; i++) {
                var i1 = this.ranking[i];
                var ybottom = 0;
                if (is_normalize) {
                    ybottom = Math.pow(mat[i1][j1], 0.6) / sampled_sum[t] * (canvas_height - top_gap - bottom_gap - inter_class_gap * (M - 1)) + ytop;
                } else {
                    ybottom = Math.round(Math.pow(mat[i1][j1], 0.6) / max_sum * (canvas_height - top_gap - bottom_gap - inter_class_gap * (M - 1)) + ytop);
                }

                xlv.push(xleft);
                xrv.push(xright);
                ytv.push(ytop);
                ybv.push(ybottom);

                ytop = ybottom;
            }

            ytop += inter_class_gap;

            xlm.push(xlv);
            xrm.push(xrv);
            ytm.push(ytv);
            ybm.push(ybv);
        }

        xl.push(xlm);
        xr.push(xrm);
        yt.push(ytm);
        yb.push(ybm);
    }

    that.layout = {
        'xl' : xl,
        'xr' : xr,
        'yt' : yt,
        'yb' : yb
    };
    that.context.clearRect(0, 0, canvas_width, canvas_height);
};

FlowingConfusionMatrix.prototype.draw_false_positive_matrix_flow = function () {
    var that = this;

    var T = that.T;
    var M = that.selected_classes.length;

    var alpha = 0.5;
    var darkerFactor = 0.8;

    var xl = that.layout['xl'];
    var xr = that.layout['xr'];
    var yt = that.layout['yt'];
    var yb = that.layout['yb'];

    for (var i = 0; i < M; i++) {
        for (var j = 0; j < M; j++) {
            if (i == j) {
                continue;
            }

            that.context.beginPath();

            that.context.moveTo((xl[0][i][j] + xr[0][i][j]) / 2, yb[0][i][j]);
            that.context.lineTo(xl[0][i][j], yb[0][i][j]);
            that.context.lineTo(xl[0][i][j], yt[0][i][j]);
            that.context.lineTo((xl[0][i][j] + xr[0][i][j]) / 2, yt[0][i][j]);

            for (var t = 1; t < T; t++) {
                that.context.lineTo((xl[t][i][j] + xr[t][i][j]) / 2, yt[t][i][j]);
            }

            that.context.lineTo(xr[T - 1][i][j], yt[T - 1][i][j]);
            that.context.lineTo(xr[T - 1][i][j], yb[T - 1][i][j]);
            that.context.lineTo((xl[T - 1][i][j] + xr[T - 1][i][j]) / 2, yb[T - 1][i][j]);

            for (t = T - 2; t >= 0; t--) {
                that.context.lineTo((xl[t][i][j] + xr[t][i][j]) / 2, yb[t][i][j]);
            }

            var c = that.get_class_color(that.selected_classes[j]);

            if (that.highlight_class != null && that.highlight_class == i) {
                that.context.fillStyle = changeColorLightness(c, darkerFactor);
                that.context.strokeStyle = changeColorLightness(c, darkerFactor);
            }
            else{
                that.context.fillStyle = hexToRGB(c, alpha);
                that.context.strokeStyle = hexToRGB(c, alpha);
            }

            that.context.stroke();
            that.context.fill();
        }
    }
};

FlowingConfusionMatrix.prototype.draw_background_diagonals = function () {
    var that = this;

    var canvas_width = that.canvas.width;
    var canvas_height = that.canvas.height;

    var max_k = Math.floor(canvas_height) + Math.floor(canvas_width);

    for (var k = 1; k <= max_k; k += 10) {
        that.context.beginPath();

        if (k > canvas_width) {
            that.context.moveTo(canvas_width, k - canvas_width);
        } else {
            that.context.moveTo(k, 0);
        }

        if (k > canvas_height) {
            that.context.lineTo(k - canvas_height, canvas_height);
        } else {
            that.context.lineTo(0, k);
        }

        that.context.strokeStyle = 'gray';
        that.context.stroke();
    }
};

FlowingConfusionMatrix.prototype.draw_true_positive_matrix_flow = function () {
    var that = this;

    var T = that.T;
    var M = that.selected_classes.length;

    var alpha = 1.0;
    var darkerFactor = 0.8;

    var xl = that.layout['xl'];
    var xr = that.layout['xr'];
    var yt = that.layout['yt'];
    var yb = that.layout['yb'];

    for (var i = 0; i < M; i++) {
        for (var j = 0; j < M; j++) {
            if (i != j) {
                continue;
            }

            that.context.beginPath();

            that.context.moveTo((xl[0][i][j] + xr[0][i][j]) / 2, yb[0][i][j]);
            that.context.lineTo(xl[0][i][j], yb[0][i][j]);
            that.context.lineTo(xl[0][i][j], yt[0][i][j]);
            that.context.lineTo((xl[0][i][j] + xr[0][i][j]) / 2, yt[0][i][j]);

            for (var t = 1; t < T; t++) {
                that.context.lineTo((xl[t][i][j] + xr[t][i][j]) / 2, yt[t][i][j]);
            }

            that.context.lineTo(xr[T - 1][i][j], yt[T - 1][i][j]);
            that.context.lineTo(xr[T - 1][i][j], yb[T - 1][i][j]);
            that.context.lineTo((xl[T - 1][i][j] + xr[T - 1][i][j]) / 2, yb[T - 1][i][j]);

            for (t = T - 2; t >= 0; t--) {
                that.context.lineTo((xl[t][i][j] + xr[t][i][j]) / 2, yb[t][i][j]);
            }

            var c = that.get_class_color(that.selected_classes[j]);

            if (that.highlight_class != null && that.highlight_class == i) {
                that.context.fillStyle = changeColorLightness(c, darkerFactor);
                that.context.strokeStyle = changeColorLightness(c, darkerFactor);
            } else {
                that.context.fillStyle = hexToRGB(c, alpha);
                that.context.strokeStyle = hexToRGB(c, alpha);
            }

            that.context.stroke();
            that.context.fill();
        }
    }
};

FlowingConfusionMatrix.prototype.refill_blanks = function () {
    var that = this;

    var T = that.T;
    var M = that.selected_classes.length;

    var canvas_width = that.canvas.width;
    var canvas_height = that.canvas.height;

    var xl = that.layout['xl'];
    var xr = that.layout['xr'];
    var yt = that.layout['yt'];
    var yb = that.layout['yb'];

    that.context.beginPath();
    that.context.moveTo(xl[0][0][0], yt[0][0][0]);
    that.context.lineTo((xl[0][0][0] + xr[0][0][0]) / 2, yt[0][0][0]);
    for (var t = 1; t < T; t++) {
        that.context.lineTo((xl[t][0][0] + xr[t][0][0]) / 2, yt[t][0][0]);
    }
    that.context.lineTo(xr[T - 1][0][0], yt[T - 1][0][0]);
    that.context.lineTo(xr[T - 1][0][0], 0);
    that.context.lineTo(0, 0);
    that.context.lineTo(xl[0][0][0], yt[0][0][0]);
    that.context.fillStyle = 'white';
    that.context.fill();

    for (var i = 0; i < M - 1; i++) {
        that.context.beginPath();
        that.context.moveTo(xl[0][i][M - 1], yb[0][i][M - 1]);
        that.context.lineTo((xl[0][i][M - 1] + xr[0][i][M - 1]) / 2, yb[0][i][M - 1]);
        for (t = 1; t < T; t++) {
            that.context.lineTo((xl[t][i][M - 1] + xr[t][i][M - 1]) / 2, yb[t][i][M - 1]);
        }
        that.context.lineTo(xr[T - 1][i][M - 1], yb[T - 1][i][M - 1]);
        that.context.lineTo(xr[T - 1][i + 1][0], yt[T - 1][i + 1][0]);
        that.context.lineTo((xl[T - 1][i + 1][0] + xr[T - 1][i + 1][0]) / 2, yt[T - 1][i + 1][0]);
        for (t = T - 2; t >= 0; t--) {
            that.context.lineTo((xl[t][i + 1][0] + xr[t][i + 1][0]) / 2, yt[t][i + 1][0]);
        }
        that.context.lineTo(xl[0][i + 1][0], yt[0][i + 1][0]);
        that.context.lineTo(xl[0][i][M - 1], yb[0][i][M - 1]);
        that.context.fillStyle = 'white';
        that.context.fill();
    }

    that.context.beginPath();
    that.context.moveTo(xl[0][M - 1][M - 1], yb[0][M - 1][M - 1]);
    that.context.lineTo((xl[0][M - 1][M - 1] + xr[0][M - 1][M - 1]) / 2, yb[0][M - 1][M - 1]);
    for (t = 1; t < T; t++) {
        that.context.lineTo((xl[t][M - 1][M - 1] + xr[t][M - 1][M - 1]) / 2, yb[t][M - 1][M - 1]);
    }
    that.context.lineTo(xr[T - 1][M - 1][M - 1], yb[T - 1][M - 1][M - 1]);
    that.context.lineTo(xr[T - 1][M - 1][M - 1], canvas_height);
    that.context.lineTo(xl[0][M - 1][M - 1], canvas_height);
    that.context.lineTo(xl[0][M - 1][M - 1], yb[0][M - 1][M - 1]);
    that.context.fillStyle = 'white';
    that.context.fill();
};

FlowingConfusionMatrix.prototype.draw_matrix_flow = function () {
    var that = this;

    var T = that.T;
    var M = that.selected_classes.length;

    var xl = that.layout['xl'];
    var xr = that.layout['xr'];
    var yt = that.layout['yt'];
    var yb = that.layout['yb'];

    for (var i = 0; i < M; i++) {
        for (var j = 0; j < M; j++) {
            that.context.beginPath();
            that.context.moveTo((xl[0][i][j] + xr[0][i][j]) / 2, yb[0][i][j]);
            that.context.lineTo(xl[0][i][j], yb[0][i][j]);
            that.context.lineTo(xl[0][i][j], yt[0][i][j]);
            that.context.lineTo((xl[0][i][j] + xr[0][i][j]) / 2, yt[0][i][j]);
            for (var t = 1; t < T; t++) {
                that.context.lineTo((xl[t][i][j] + xr[t][i][j]) / 2, yt[t][i][j]);
            }
            that.context.lineTo(xr[T - 1][i][j], yt[T - 1][i][j]);
            that.context.lineTo(xr[T - 1][i][j], yb[T - 1][i][j]);
            that.context.lineTo((xl[T - 1][i][j] + xr[T - 1][i][j]) / 2, yb[T - 1][i][j]);
            for (t = T - 2; t >= 0; t--) {
                that.context.lineTo((xl[t][i][j] + xr[t][i][j]) / 2, yb[t][i][j]);
            }

            var c = that.get_class_color(that.selected_classes[j]);

            if (i == j) {
                that.context.fillStyle = hexToRGB(c, 0.9);
                that.context.strokeStyle = hexToRGB(c, 0.9);
            } else {
                that.context.fillStyle = hexToRGB(c, 0.5);
                that.context.strokeStyle = hexToRGB(c, 0.5);
            }

            that.context.stroke();
            that.context.fill();
        }
    }
};

FlowingConfusionMatrix.prototype.draw_iteration_text = function () {
    var that = this;

    var T = that.T;

    var canvas_width = that.canvas.width;
    var canvas_height = that.canvas.height;
    var bottom_gap = that.canvas.bottom_gap;

    that.context.font = '15px Arial';
    that.context.textAlign = 'center';
    that.context.textBaseline = 'top';
    that.context.fillStyle = 'gray';

    for (var t = 0; t < T; t++) {
        var xleft = Math.round((canvas_width) / T * t);
        var xright = Math.round((canvas_width) / T * (t + 1));
        that.context.fillText(that.endpoints[t] + 1, (xleft + xright) / 2, canvas_height - bottom_gap);
    }
};

FlowingConfusionMatrix.prototype.draw_dashed_lines = function () {
    var that = this;

    var T = that.T;

    var canvas_width = that.canvas.width;
    var canvas_height = that.canvas.height;
    var top_gap = that.canvas.top_gap;
    var bottom_gap = that.canvas.bottom_gap;

    that.context.setLineDash([2, 3]);
    that.context.strokeStyle = 'gray';

    for (var t = 0; t < T; t++) {
        var xleft = Math.round((canvas_width) / T * t);
        var xright = Math.round((canvas_width) / T * (t + 1));

        that.context.beginPath();
        that.context.moveTo((xleft + xright) / 2, top_gap);
        that.context.lineTo((xleft + xright) / 2, canvas_height - bottom_gap);
        that.context.stroke();

        if (t == that.pointed_segment) {
            that.context.fillStyle = hexToRGB('#CCCCCC', 0.5);
            that.context.fillRect(xleft, top_gap, xright - xleft, canvas_height - top_gap - bottom_gap);
        }
    }

    that.context.setLineDash([]);
};

FlowingConfusionMatrix.prototype.get_initial_segmentation = function () {
    var that = this;

    //console.log('Begin segmenting confusion matrix...');

    that.endpoints = that.segment_time_series(that.selected_matrices);
    that.endpoints.reverse();
    that.endpoints[0] = 0;

    //console.log('Segmented confusion matrix.');
};

FlowingConfusionMatrix.prototype.segment_time_series = function (matrices) {
    var that = this;

    var nSegment = that.T;
    var nIteration = matrices.length;
    var vectors = matrixToVector(matrices);

    var f = init2dArray(nIteration, nSegment),
        g = init2dArray(nIteration, nSegment),
        cost = init2dArray(nIteration, nIteration);

    var i, j, k;

    for (i = 0; i < nIteration; i++) {
        cost[i][i] = 0;
        for (j = i + 1; j < nIteration; j++) {
            cost[i][j] = that.get_segment_cost(vectors, i, j);
        }
    }

    for (i = 0; i < nIteration; i++) {
        f[i][1] = cost[0][i];
        g[i][1] = -1;
    }

    for (j = 2; j <= nSegment; j++) {
        for (i = j - 1; i < nIteration; i++) {
            f[i][j] = Number.MAX_VALUE;
            for (k = j - 2; k < i; k++ ) {
                if (f[k][j - 1] + cost[k + 1][i] < f[i][j]) {
                    f[i][j] = f[k][j - 1] + cost[k + 1][i];
                    g[i][j] = k;
                }
            }
        }
    }

    var endpoints = [];
    i = nIteration - 1;
    j = nSegment;
    while (i != -1) {
        endpoints.push(i);
        i = g[i][j];
        j = j - 1;
    }

    return endpoints;
};

FlowingConfusionMatrix.prototype.get_segment_cost = function (vectors, L, R) {
    var avg_vec = new Float32Array(vectors[L].length);

    for (var i = L; i <= R; i++) {
        for (var k = 0; k < vectors[i].length; k++) {
            avg_vec[k] += vectors[i][k];
        }
    }
    for (i = 0; i < avg_vec.length; i++) {
        avg_vec[i] /= (R - L + 1);
    }

    var cost = 0;
    for (i = L; i <= R; i++) {
        var delta = [];
        for (k = 0; k < vectors[i].length; k++) {
            delta[k] = vectors[i][k] - avg_vec[k];
        }
        cost += squareLength(delta);
    }

    return cost;
};

function squareLength(vec) {
    var res = 0;
    for (var i = 0; i < vec.length; i++) {
        res += vec[i] * vec[i];
    }
    return res;
}

function matrixToVector(matrices) {
    var L = matrices.length;
    var n = matrices[0].length, m = matrices[0][0].length;
    var vector_collection = [];

    for (var t = 0; t < L; t++) {
        var vector = [];

        for (var i = 0; i < n; i++) {
            for (var j = 0; j < m; j++) {
                vector.push(matrices[t][i][j]);
            }
        }
        vector_collection.push(vector);
    }

    return vector_collection;
}

function init2dArray(n, m) {
    var f = [];
    for (var i = 0; i < n; i++) {
        var g = [];
        for (var j = 0; j < m; j++) {
            g.push(0);
        }
        f.push(g);
    }
    return f;
}

FlowingConfusionMatrix.prototype.register_mouse_events = function () {
    var that = this;

    that.canvas.onmousedown = that.canvas_mouse_down_new;
    that.canvas.onmouseover = that.canvas_mouse_over_new;
    that.canvas.onmousemove = that.canvas_mouse_move_new;
    that.canvas.onmouseout = that.canvas_mouse_out_new;
};

FlowingConfusionMatrix.prototype.canvas_mouse_out_new = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);

    e.preventDefault();

    var parent = this.parent;

    parent.pointed_segment = null;
    parent.highlight_class = null;
    parent.refresh_canvas();

    document.getElementsByTagName("html").item(0).style.cursor = "";
};

FlowingConfusionMatrix.prototype.canvas_mouse_over_new = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);

    e.preventDefault();

    var parent = this.parent;
    var canvas_width = this.width;
    var T = parent.T;

    for (var t = 0; t < T; t++) {
        var xleft = Math.round(canvas_width / T * t);
        var xright = Math.round(canvas_width / T * (t + 1));
        if (loc.x > xleft && loc.x < xright) {
            parent.pointed_segment = t;
            parent.refresh_canvas();
        }
    }
};

FlowingConfusionMatrix.prototype.canvas_mouse_move_new = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);

    e.preventDefault();

    var parent = this.parent;
    var canvas_width = this.width;
    var T = parent.T;
    var M = parent.selected_classes.length;
    var flag = 0;

    for (var t = 0; t < T; t++) {
        var xleft = Math.round(canvas_width / T * t);
        var xright = Math.round(canvas_width / T * (t + 1));
        if (loc.x > xleft && loc.x < xright) {
            for (var i = 0; i < M; i++) {
                if (loc.y > parent.layout['yt'][t][i][0] && loc.y < parent.layout['yb'][t][i][M - 1]) {
                    flag = 1;
                    parent.highlight_class = i;
                    this.style.cursor="pointer";
                    break;
                }
            }

            if (flag == 0) {
                parent.highlight_class = null;
                this.style.cursor="";
            }

            parent.pointed_segment = t;
            parent.refresh_canvas();
            break;
        }
    }
};

FlowingConfusionMatrix.prototype.canvas_mouse_down_new = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);

    e.preventDefault();

    var parent = this.parent;
    var canvas_width = this.width;
    var T = parent.T;
    var M = parent.selected_classes.length;

    for (var t = 0; t < T; t++) {
        var xleft = Math.round(canvas_width / T * t);
        var xright = Math.round(canvas_width / T * (t + 1));
        if (loc.x > xleft && loc.x < xright) {
            for (var i = 0; i < M; i++) {
                if (loc.y > parent.layout['yt'][t][i][0] && loc.y < parent.layout['yb'][t][i][M - 1]) {
                    click_class(confusion_matrix.ranking[parent.selected_classes[i]]);
                    break;
                }
            }
        }
    }
};
