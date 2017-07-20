/**
 * Modified by Junlin Liu on 17/3/27.
 */

function TreesizeBarchart(container) {
    var that = this;
    that.container = container;
    var bbox = that.container.node().getBoundingClientRect();

    that.width = bbox.width;
    that.height = bbox.height;

    //if (that.container.children) {
    //    that.container.children.remove();
    //}
    that.container.select("div").remove();
    that.container.select("canvas").remove();

    that.container
        .transition()
        .duration(500)
        .style("opacity", 0);

    that.container.append("div")
        .append("text")
        .style("font-size", 11 + "px")
        .style("padding-left", "0.3%")
        .text("Tree Size");

    var canvas_d3 = that.container.append("canvas")
        .attr("width", that.width)
        .attr("height", that.height);

    that.canvas = canvas_d3.node();
    that.context = that.canvas.getContext('2d');

    that.canvas.onmouseover = that.canvas_mouse_over;
    that.canvas.onmousemove = that.canvas_mouse_move;
    that.canvas.onmouseout = that.canvas_mouse_out;
    that.canvas.onmousedown = that.canvas_mouse_down;

    that.tree_gap = 2;
    that.pointed_bar = -1;

    that.currentFrame = 0;
    that.totalFrames = 40;

    //canvas_d3.on("click", function (d) {
    //    var pos = d3.mouse(this);
    //    var iteration = Math.floor(pos[0] * ITERATION_COUNT / that.width);
    //    show_tree_classifier(iteration);
    //});
}

TreesizeBarchart.prototype.canvas_mouse_down = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);

    e.preventDefault();

    show_tree_classifier(treesize_barchart.pointed_bar * treesize_barchart.tree_gap - 1);
};

TreesizeBarchart.prototype.canvas_mouse_over = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);

    e.preventDefault();

    var canvas_width = this.width;

    var gap = treesize_barchart.tree_gap;
    var tree_num = Math.floor(ITERATION_COUNT / gap);

    for (var t = 0; t < tree_num; t++) {
        var xleft = canvas_width / tree_num * t;
        var xright = canvas_width / tree_num * (t + 1);
        if (xleft < loc.x && loc.x < xright) {
            treesize_barchart.pointed_bar = t;
            treesize_barchart.refresh_canvas();
            break;
        }
    }
};

TreesizeBarchart.prototype.canvas_mouse_move = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);

    e.preventDefault();

    var canvas_width = this.width;

    var gap = treesize_barchart.tree_gap;
    var tree_num = Math.floor(ITERATION_COUNT / gap);

    for (var t = 0; t < tree_num; t++) {
        var xleft = canvas_width / tree_num * t;
        var xright = canvas_width / tree_num * (t + 1);
        if (xleft < loc.x && loc.x < xright) {
            treesize_barchart.pointed_bar = t;
            treesize_barchart.refresh_canvas();
            break;
        }
    }
};

TreesizeBarchart.prototype.canvas_mouse_out = function (e) {
    var loc = windowToCanvas(this, e.clientX, e.clientY);

    e.preventDefault();

    treesize_barchart.pointed_bar = -1;
    treesize_barchart.refresh_canvas();
};

TreesizeBarchart.prototype.refresh_canvas = function () {
    var that = this;

    if (that.canvas.type == 1) {
        that.render_tree_size_bar_chart_one_time(that.focused_class);
    } else if (that.canvas.type == 2) {
        that.render_tree_size_bar_chart_with_highlights_one_time(that.focused_class, that.medoid_id);
    } else if (that.canvas.type == 3) {
        that.render_feature_contribution_bar_chart(that.focused_class);
    }
};

TreesizeBarchart.prototype.render_tree_size_bar_chart_one_time = function (focused_class) {
    var that = this;
    that.currentFrame = that.totalFrames - 1;
    window.requestAnimationFrame(that.render_tree_size_bar_chart_partially);
};

TreesizeBarchart.prototype.render_tree_size_bar_chart = function (focused_class) {
    var that = this;
    that.container
        .transition()
        .duration(500)
        .style("opacity", 1);
    var that = this;
    that.currentFrame = 0;
    window.requestAnimationFrame(that.render_tree_size_bar_chart_partially);
};

TreesizeBarchart.prototype.render_tree_size_bar_chart_partially = function () {
    var that = treesize_barchart;

    that.currentFrame++;
    var canvas_width = that.canvas.width;
    var canvas_height = that.canvas.height;

    var focused_class = get_current_focused_class();
    that.focused_class = focused_class;
    that.canvas.type = 1;
    that.context.clearRect(0, 0, canvas_width, canvas_height);

    var max_size = 0;
    for (var i = 0; i < ITERATION_COUNT; i++) {
        //if (TREE_INFO_LIGHTGBM[i][focused_class]['num_internals'] > max_size) {
        //    max_size = TREE_INFO_LIGHTGBM[i][focused_class]['num_internals'];
        //}
        if (TREE_SIZE[focused_class][i] > max_size) {
            max_size = TREE_SIZE[focused_class][i];
        }
    }

    var gap = that.tree_gap;
    var tree_num = Math.floor(ITERATION_COUNT / gap);
    //if (canvas_width / tree_num > 10) {
    //    gap = 5;
    //}
    var padding = 1;
    if (canvas_width / tree_num < 3) {
        padding = 0;
    }
    //console.log(canvas_width / tree_num);

    for (var t = 0; t < tree_num; t++) {
        var xleft = canvas_width / tree_num * t;
        var xright = canvas_width / tree_num * (t + 1);
        var iteration =  t * gap;
        //var tree_size = t ? TREE_INFO_LIGHTGBM[iteration][focused_class]['num_internals']
        //    : TREE_INFO_LIGHTGBM[iteration + 1][focused_class]['num_internals'];
        var tree_size = t ? TREE_SIZE[focused_class][iteration] : TREE_SIZE[focused_class][iteration + 1];
        var tree_height = canvas_height * (tree_size / max_size);
        tree_height = tree_height * (that.currentFrame / that.totalFrames);

        that.context.fillStyle = hexToRGB(color_manager.get_color(focused_class));

        if (t == that.pointed_bar) {
            that.context.fillRect(xleft - 2, canvas_height - tree_height, xright - xleft + 4, tree_height);
            that.context.strokeStyle = 'black';
            that.context.strokeRect(xleft - 2, canvas_height - tree_height, xright - xleft + 4, tree_height);
        } else {
            that.context.fillRect(xleft, canvas_height - tree_height, xright - xleft - padding, tree_height);
        }
    }

    if (that.currentFrame < that.totalFrames) {
        window.requestAnimationFrame(that.render_tree_size_bar_chart_partially);
    }
};

TreesizeBarchart.prototype.render_tree_size_bar_chart_with_highlights_one_time = function (focused_class, tree_id) {
    var that = this;
    that.medoid_id = tree_id;
    that.currentFrame = that.totalFrames - 1;
    window.requestAnimationFrame(that.render_tree_size_bar_chart_with_highlights_partially);
};

TreesizeBarchart.prototype.render_tree_size_bar_chart_with_highlights = function (focused_class, tree_id) {
    var that = this;
    that.medoid_id = tree_id;
    that.currentFrame = 0;
    window.requestAnimationFrame(that.render_tree_size_bar_chart_with_highlights_partially);
};

TreesizeBarchart.prototype.render_tree_size_bar_chart_with_highlights_partially = function () {
    var that = treesize_barchart;

    that.currentFrame++;

    var canvas_width = that.canvas.width;
    var canvas_height = that.canvas.height;

    var focused_class = get_current_focused_class();

    that.canvas.type = 2;
    that.context.clearRect(0, 0, canvas_width, canvas_height);

    var max_size = 0;
    for (var i = 0; i < ITERATION_COUNT; i++) {
        //if (TREE_INFO_LIGHTGBM[i][focused_class]['num_internals'] > max_size) {
        //    max_size = TREE_INFO_LIGHTGBM[i][focused_class]['num_internals'];
        //}
        if (TREE_SIZE[focused_class][i] > max_size) {
            max_size = TREE_SIZE[focused_class][i];
        }
    }

    var gap = that.tree_gap;
    var tree_num = Math.floor(ITERATION_COUNT / gap);

    var cluster_id = CLASSIFIER_CLUSTERING_RES['medoids'].indexOf(that.medoid_id);

    for (var t = 0; t < tree_num; t++) {
        var xleft = canvas_width / tree_num * t;
        var xright = canvas_width / tree_num * (t + 1);
        var iteration =  t * gap;
        //var tree_size = TREE_INFO_LIGHTGBM[iteration][focused_class]['num_internals'];
        var tree_size = TREE_SIZE[focused_class][iteration];
        var tree_height = canvas_height * (tree_size / max_size);
        tree_height = tree_height * (that.currentFrame / that.totalFrames);

        if (CLASSIFIER_CLUSTERING_RES['inst_cluster_label'][t] != cluster_id) {
            that.context.fillStyle = color_manager.get_noob_color();
            //that.context.fillStyle = "#aaaaaa";
        } else {
            that.context.fillStyle = color_manager.get_color(focused_class);
        }

        if (t == that.pointed_bar) {
            that.context.fillRect(xleft - 2, canvas_height - tree_height, xright - xleft + 4, tree_height);
            that.context.strokeStyle = 'black';
            that.context.strokeRect(xleft - 2, canvas_height - tree_height, xright - xleft + 4, tree_height);
        } else {
            that.context.fillRect(xleft, canvas_height - tree_height, xright - xleft, tree_height);
        }
    }

    if (that.currentFrame < that.totalFrames) {
        window.requestAnimationFrame(that.render_tree_size_bar_chart_with_highlights_partially);
    }
};

TreesizeBarchart.prototype.render_feature_contribution_bar_chart = function (focused_class) {
    var that = this;
    var canvas_width = that.canvas.width;
    var canvas_height = that.canvas.height;

    that.focused_class = focused_class;
    that.canvas.type = 3;
    that.context.clearRect(0, 0, canvas_width, canvas_height);

    var gap = that.tree_gap;
    var tree_num = Math.floor(ITERATION_COUNT / gap);

    var top_ratio = [];
    for (var t = 0; t < tree_num; t++) {
        var iteration = t * gap;
        var tree_size = TREE_INFO_LIGHTGBM[iteration][focused_class]['num_internals'];

        var feature_contribution = [];
        for (var k = 0; k < FEATURE_COUNT; k++) {
            feature_contribution[k] = 0;
        }
        for (var i = 0; i < tree_size; i++) {
            var feature_id = TREE_INFO_LIGHTGBM[iteration][focused_class]['split_feature'][i];
            var split_gain = TREE_INFO_LIGHTGBM[iteration][focused_class]['split_gain'][i];
            feature_contribution[feature_id] += split_gain;
        }

        top_ratio[t] = (_.max(feature_contribution) / sum(feature_contribution));
    }

    var max_raio = _.max(top_ratio);

    for (t = 0; t < tree_num; t++) {
        var xleft = canvas_width / tree_num * t;
        var xright = canvas_width / tree_num * (t + 1);

        var tree_height = canvas_height * (top_ratio[t] / max_ratio);

        that.context.fillStyle = hexToRGB(color_manager.get_color(focused_class));

        if (t == that.pointed_bar) {
            that.context.fillRect(xleft - 2, canvas_height - tree_height, xright - xleft + 4, tree_height);
            that.context.strokeStyle = 'black';
            that.context.strokeRect(xleft - 2, canvas_height - tree_height, xright - xleft + 4, tree_height);
        } else {
            that.context.fillRect(xleft, canvas_height - tree_height, xright - xleft, tree_height);
        }
    }
};
