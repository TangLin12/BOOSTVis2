/**
 * Modified by Junlin Liu on 17/3/30.
 */

function FeatureMatrix(container) {
    var that = this;
    this.container = container;
    var bbox = that.container.node().getBoundingClientRect();

    that.width = bbox.width;
    that.height = bbox.height;

    //if (that.container.children) {
    //    that.container.children.remove();
    //}
    that.container.select("canvas").remove();
    //that.container
    //    .transition()
    //    .duration(500)
    //    .style("opacity", 0);
    that.scale = 1;
    this.fh_canvas = this.container.append("canvas")
        .attr("width", that.width * that.scale)
        .attr("height", that.height * that.scale)
        .node();
    this.fh_context = this.fh_canvas.getContext('2d');

    that.fh_canvas.top_gap = 30 * that.scale;
    that.fh_canvas.left_gap = 1;
    that.fh_canvas.right_gap = 1;

    that.feature_mat = [];
    that.sorted_features = [];
    that.Nfeature = 0;
    that.nRow = 35;

    that.nFeaturePerPage = 20;
    that.featureStart = 0;

    that.mode = null;
    that.importanceMode = 1;
    that.separationMode = 2;

    that.currentFrame = 0;
    that.totalFrames = 40;

    add_page_turn_events();
}

function add_page_turn_events () {
    $("#feature-up").click(function() {
        feature_matrix.features_page_up();
    });
    $("#feature-down").click(function() {
        feature_matrix.features_page_down();
    });
}

FeatureMatrix.prototype.clear_canvas = function () {
    this.fh_context.clearRect(0, 0, this.fh_canvas.width, this.fh_canvas.height);
};

FeatureMatrix.prototype.features_page_up = function () {
    var that = this;

    if (that.featureStart < that.nFeaturePerPage) {
        return;
    }

    that.featureStart -= that.nFeaturePerPage;
    that.refresh_canvas();
};

FeatureMatrix.prototype.features_page_down = function () {
    var that = this;

    if (that.featureStart + that.nFeaturePerPage >= FEATURE_COUNT) {
        return;
    }

    that.featureStart += that.nFeaturePerPage;
    that.refresh_canvas();
};

FeatureMatrix.prototype.refresh_canvas = function () {
    var that = this;

    if (is_instance_mode() == true) {
        that.render_feature_ranking_with_one_instance();
    } else if (confidence_lines.cluster_label_set.length > 0) {
        if (that.mode == that.importanceMode) {
            that.render_feature_ranking_for_clusters();
        } else {
            that.render_separation_features_for_clusters();
        }
    } else {
        that.render_feature_ranking();
    }
};

FeatureMatrix.prototype.switch_ranking_rule = function () {
    var that = this;

    if (confidence_lines.mode == confidence_lines.instanceMode) {
        return;
    }

    if (that.mode == that.importanceMode) {
        if (confidence_lines.cluster_label_set.length > 1) {
            $('#ranking-hint').text('Ranked by Separability');
            that.render_separation_features_for_clusters();
        }
    } else {
        $('#ranking-hint').text('Ranked by Importance');
        that.render_feature_ranking_for_clusters();
    }
};

FeatureMatrix.prototype.get_used_features = function () {
    return tree_inspector.resultTree.get_drawn_node_features();
};

// add by Shouxing, 2017 / 7 / 20
FeatureMatrix.prototype.update_bin_format_for_cluster = function () {
    $.getJSON('/api/feature_matrix_for_cluster', {
            cluster_ids: JSON.stringify(confidence_lines.cluster_id_set),
            cluster_classes: JSON.stringify(confidence_lines.cluster_label_set),
            features: JSON.stringify(feature_matrix.features)
        }, function(data) {
            console.log(data);
            feature_matrix.binMatrix = data.feature_matrix;
            feature_matrix.binWidths = data.feature_widths;
        }
    );
};

// add by Shouxing, 2017 / 7 / 20
FeatureMatrix.prototype.update_bin_format = function () {
    $.getJSON('/api/feature_matrix_for_class', {
            class_id: JSON.stringify(get_current_focused_class()),
            features: JSON.stringify(feature_matrix.features)
        }, function(data) {
            console.log(data);
            feature_matrix.binMatrix = data.feature_matrix;
            feature_matrix.binWidths = data.feature_widths;
        }
    );
};

// add by Shouxing, 2017 / 7 / 20
FeatureMatrix.prototype.get_bin_exist_for_instance = function () {
    $.getJSON('/api/bin_exist_for_instance', {
            instance_id: JSON.stringify(confidence_lines.focused_instance),
            features: JSON.stringify(feature_matrix.features)
        }, function(data) {
            console.log(data);
            feature_matrix.binsInstance = data.bins_instance;
        }
    );
};

FeatureMatrix.prototype.render_feature_ranking_partially = function () {
    var that = feature_matrix;

    that.currentFrame++;

    var canvas_height = that.fh_canvas.height;
    var canvas_width = that.fh_canvas.width;
    var top_gap = that.fh_canvas.top_gap;

    var focused_class = confidence_lines.focused_class;
    var sorted_features = that.sorted_features;

    //var flags = that.get_used_features();

    // drawing codes
    that.clear_canvas();

    var bin_matrix = that.binMatrix;
    var bin_widths = that.binWidths;

    var features = that.features;
    var feature_number = features.length;
    var start = that.featureStart;

    var text_width = Math.round((canvas_width) * 0.15);
    var bar_width = Math.round((canvas_width) * 0.7);
    var imp_width = Math.round((canvas_width) * 0.15);

    for (var k = 0; k < feature_number; k++) {
        var feature_id = features[k];
        var ytop = Math.round((canvas_height - top_gap) / that.nFeaturePerPage * k + top_gap);
        var ybottom = Math.round((canvas_height - top_gap) / that.nFeaturePerPage * (k + 1) + top_gap);

        that.fh_context.font = (10 * that.scale * 1.5) + 'px Arial';
        that.fh_context.textAlign = 'center';
        that.fh_context.textBaseline = 'middle';
        that.fh_context.fillStyle = 'gray';
        that.fh_context.fillText(sorted_features[k + start]['value'].toFixed(1), text_width + bar_width + imp_width / 2, (ytop + ybottom) / 2);
        that.fh_context.fillText('F' + (feature_id + 1), text_width / 2, (ytop + ybottom) / 2);

        that.fh_context.setLineDash([2 * that.scale, 3 * that.scale]);
        that.fh_context.strokeStyle = 'gray';
        that.fh_context.beginPath();
        that.fh_context.moveTo(0, ytop);
        that.fh_context.lineTo(canvas_width, ytop);
        that.fh_context.stroke();
        that.fh_context.setLineDash([]);

        var transformed_bin_focus = [];
        var transformed_bin_others = [];
        var sum_bin = [0, 0];
        var max_bin = 0;
        var bin_number = bin_widths[k].length;
        for (var i = 0;i < bin_number; i++) {
            transformed_bin_focus[i] = Math.pow(bin_matrix[k][0][i], 0.3);
            transformed_bin_others[i] = Math.pow(bin_matrix[k][1][i], 0.3);

            sum_bin[0] += transformed_bin_focus[i];
            sum_bin[1] += transformed_bin_others[i];
        }
        for (var i = 0;i < bin_number; i++) {
            transformed_bin_focus[i] *= 100;
            transformed_bin_others[i] *= 100;

            transformed_bin_focus[i] /= sum_bin[0];
            transformed_bin_others[i] /= sum_bin[1];

            max_bin = Math.max(max_bin, transformed_bin_focus[i]);
            max_bin = Math.max(max_bin, transformed_bin_others[i]);
        }
        var percent_begin = 0;
        for (var i = 0;i < bin_number; i++) {
            var focus_bin_height = transformed_bin_focus[i] / max_bin * (ybottom - ytop - 5 * that.scale);
            var others_bin_height = transformed_bin_others[i] / max_bin * (ybottom - ytop - 5 * that.scale);

            focus_bin_height = focus_bin_height * (that.currentFrame / that.totalFrames);
            others_bin_height = others_bin_height * (that.currentFrame / that.totalFrames);

            var xleft = Math.round(bar_width * percent_begin / 100);
            var xright = Math.round(bar_width * (percent_begin + bin_widths[k][i]) / 100);
            var xmid = Math.round((xleft + xright) / 2);
            var single_bar_width = Math.round((xright - xleft) / 8);

            that.fh_context.fillStyle = hexToRGB(color_manager.get_color(focused_class));
            that.fh_context.fillRect(xmid + text_width, ybottom - focus_bin_height, single_bar_width, focus_bin_height);
            that.fh_context.fillStyle = hexToRGB('#AAAAAA', 0.7);
            that.fh_context.fillRect(xmid - single_bar_width + text_width, ybottom - others_bin_height, single_bar_width, others_bin_height);
            percent_begin += bin_widths[k][i];
        }
    }

    that.fh_context.font = 10 * that.scale + 'px Arial';
    that.fh_context.textAlign = 'center';
    that.fh_context.textBaseline = 'middle';
    that.fh_context.fillStyle = 'gray';
    that.fh_context.fillText('Feature', text_width / 2, top_gap / 4);
    that.fh_context.fillText('Name', text_width / 2, top_gap / 4 * 3);
    that.fh_context.fillText('Ranking', imp_width / 2 + text_width + bar_width, top_gap / 4);
    that.fh_context.fillText('Score', imp_width / 2 + text_width + bar_width, top_gap / 4 * 3);
    that.fh_context.fillText('Value Distribution', bar_width / 2 + text_width, top_gap / 4);

    that.fh_context.setLineDash([2 * that.scale, 3 * that.scale]);
    that.fh_context.strokeStyle = 'gray';
    that.fh_context.lineWidth = 1 * that.scale;
    that.fh_context.beginPath();
    that.fh_context.moveTo(text_width, 0);
    that.fh_context.lineTo(text_width, canvas_height);
    that.fh_context.moveTo(text_width + bar_width, 0);
    that.fh_context.lineTo(text_width + bar_width, canvas_height);
    that.fh_context.stroke();
    that.fh_context.setLineDash([]);

    if (that.currentFrame < that.totalFrames) {
        that.currentFrame = that.totalFrames - 1;
        window.requestAnimationFrame(that.render_feature_ranking_partially);
    }
};

FeatureMatrix.prototype.render_feature_ranking = function () {
    $('#ranking-hint').css('display', 'inline');

    var that = this;
    var focused_class = get_current_focused_class();
    that.get_average_feature_importance(focused_class);
    var features = [];
    for (var k = 0; k < Math.min(that.nFeaturePerPage, FEATURE_COUNT - that.featureStart); k++) {
        features.push(that.sorted_features[k + that.featureStart]['id']);
    }
    that.features = features;
    that.update_bin_format();
    that.mode = that.importanceMode;
    that.currentFrame = 0;
    window.requestAnimationFrame(that.render_feature_ranking_partially);
};

FeatureMatrix.prototype.render_feature_ranking_with_one_instance_partially = function () {
    var that = feature_matrix;

    that.currentFrame++;

    var canvas_height = that.fh_canvas.height;
    var canvas_width = that.fh_canvas.width;
    var top_gap = that.fh_canvas.top_gap;

    var focused_class = confidence_lines.focused_class;
    var sorted_features = that.sorted_features;

    var index = confidence_lines.focused_instance;
    var bins_instance = feature_matrix.binsInstance;

    //var flags = that.get_used_features();

    // drawing codes
    that.clear_canvas();

    var bin_matrix = that.binMatrix;
    var bin_widths = that.binWidths;

    var features = that.features;
    var feature_number = features.length;
    var start = that.featureStart;

    var text_width = Math.round((canvas_width) * 0.15);
    var bar_width = Math.round((canvas_width) * 0.7);
    var imp_width = Math.round((canvas_width) * 0.15);



    for (var k = 0; k < feature_number; k++) {
        var feature_id = features[k];
        var ytop = Math.round((canvas_height - top_gap) / that.nFeaturePerPage * k + top_gap);
        var ybottom = Math.round((canvas_height - top_gap) / that.nFeaturePerPage * (k + 1) + top_gap);

        that.fh_context.font = (10 * that.scale * 1.5) + 'px Arial';
        that.fh_context.textAlign = 'center';
        that.fh_context.textBaseline = 'middle';
        that.fh_context.fillStyle = 'gray';
        that.fh_context.fillText(sorted_features[k + start]['value'].toFixed(1), text_width + bar_width + imp_width / 2, (ytop + ybottom) / 2);
        that.fh_context.fillText('F' + (feature_id + 1), text_width / 2, (ytop + ybottom) / 2);

        that.fh_context.setLineDash([2 * that.scale, 3 * that.scale]);
        that.fh_context.strokeStyle = 'gray';
        that.fh_context.beginPath();
        that.fh_context.moveTo(0, ytop);
        that.fh_context.lineTo(canvas_width, ytop);
        that.fh_context.stroke();
        that.fh_context.setLineDash([]);


        var transformed_bin_focus = [];
        var transformed_bin_others = [];
        var sum_bin = [0, 0];
        var max_bin = 0;
        var bin_number = bin_widths[k].length;
        for (var i = 0;i < bin_number; i++) {
            transformed_bin_focus[i] = Math.pow(bin_matrix[k][0][i], 0.3);
            transformed_bin_others[i] = Math.pow(bin_matrix[k][1][i], 0.3);

            sum_bin[0] += transformed_bin_focus[i];
            sum_bin[1] += transformed_bin_others[i];
        }
        for (var i = 0;i < bin_number; i++) {
            transformed_bin_focus[i] *= 100;
            transformed_bin_others[i] *= 100;

            transformed_bin_focus[i] /= sum_bin[0];
            transformed_bin_others[i] /= sum_bin[1];

            max_bin = Math.max(max_bin, transformed_bin_focus[i]);
            max_bin = Math.max(max_bin, transformed_bin_others[i]);
        }
        var percent_begin = 0;

        for (var i = 0;i < bin_number; i++) {
            var focus_bin_height = transformed_bin_focus[i] / max_bin * (ybottom - ytop - 5 * that.scale);
            var others_bin_height = transformed_bin_others[i] / max_bin * (ybottom - ytop - 5 * that.scale);

            focus_bin_height = focus_bin_height * (that.currentFrame / that.totalFrames);
            others_bin_height = others_bin_height * (that.currentFrame / that.totalFrames);

            var xleft = Math.round(bar_width * percent_begin / 100);
            var xright = Math.round(bar_width * (percent_begin + bin_widths[k][i]) / 100);
            var xmid = Math.round((xleft + xright) / 2);
            var single_bar_width = Math.round((xright - xleft) / 8);

            if (bins_instance[k][i] > 0) {
                that.fh_context.fillStyle = hexToRGB(color_manager.get_color(TRUE_LABELS[index]), 0.3);
                that.fh_context.fillRect(xleft + text_width, ytop, xright - xleft, ybottom - ytop);
            }

            that.fh_context.fillStyle = hexToRGB(color_manager.get_color(focused_class));
            that.fh_context.fillRect(xmid + text_width, ybottom - focus_bin_height, single_bar_width, focus_bin_height);
            that.fh_context.fillStyle = hexToRGB('#AAAAAA', 0.7);
            that.fh_context.fillRect(xmid - single_bar_width + text_width, ybottom - others_bin_height, single_bar_width, others_bin_height);
            percent_begin += bin_widths[k][i];
        }
    }

    that.fh_context.font = 10 * that.scale + 'px Arial';
    that.fh_context.textAlign = 'center';
    that.fh_context.textBaseline = 'middle';
    that.fh_context.fillStyle = 'gray';
    that.fh_context.fillText('Feature', text_width / 2, top_gap / 4);
    that.fh_context.fillText('Name', text_width / 2, top_gap / 4 * 3);
    that.fh_context.fillText('Ranking', imp_width / 2 + text_width + bar_width, top_gap / 4);
    that.fh_context.fillText('Score', imp_width / 2 + text_width + bar_width, top_gap / 4 * 3);
    that.fh_context.fillText('Value Distribution', bar_width / 2 + text_width, top_gap / 4);

    that.fh_context.setLineDash([2 * that.scale, 3 * that.scale]);
    that.fh_context.strokeStyle = 'gray';
    that.fh_context.lineWidth = 1 * that.scale;
    that.fh_context.beginPath();
    that.fh_context.moveTo(text_width, 0);
    that.fh_context.lineTo(text_width, canvas_height);
    that.fh_context.moveTo(text_width + bar_width, 0);
    that.fh_context.lineTo(text_width + bar_width, canvas_height);
    that.fh_context.stroke();
    that.fh_context.setLineDash([]);

    if (that.currentFrame < that.totalFrames) {
        window.requestAnimationFrame(that.render_feature_ranking_partially);
    }
};

FeatureMatrix.prototype.render_feature_ranking_with_one_instance = function () {
    $('#ranking-hint').css('display', 'inline');

    var that = this;
    var focused_class = get_current_focused_class();
    that.get_average_feature_importance(focused_class);
    var features = [];
    for (var k = 0; k < Math.min(that.nFeaturePerPage, FEATURE_COUNT - that.featureStart); k++) {
        features.push(that.sorted_features[k + that.featureStart]['id']);
    }
    that.features = features;
    that.mode = that.importanceMode;
    that.update_bin_format();
    that.currentFrame = 0;
    window.requestAnimationFrame(that.render_feature_ranking_with_one_instance_partially);
};

FeatureMatrix.prototype.render_feature_ranking_for_clusters_partially = function () {
    var that = feature_matrix;

    that.currentFrame++;

    var canvas_height = that.fh_canvas.height;
    var canvas_width = that.fh_canvas.width;
    var top_gap = that.fh_canvas.top_gap;

    var focused_class = confidence_lines.focused_class;
    var sorted_features = that.sorted_features;

    var cluster_count = confidence_lines.cluster_label_set.length;
    //var flags = that.get_used_features();

    // drawing codes
    that.clear_canvas();

    var bin_matrix = that.binMatrix;
    var bin_widths = that.binWidths;

    var features = that.features;
    var feature_number = features.length;
    var start = that.featureStart;

    var text_width = Math.round((canvas_width) * 0.15);
    var bar_width = Math.round((canvas_width) * 0.7);
    var imp_width = Math.round((canvas_width) * 0.15);

    that.fh_context.lineWidth = 1 * that.scale;

    for (var k = 0; k < feature_number; k++) {
        var feature_id = features[k];
        var ytop = Math.round((canvas_height - top_gap) / that.nFeaturePerPage * k + top_gap);
        var ybottom = Math.round((canvas_height - top_gap) / that.nFeaturePerPage * (k + 1) + top_gap);

        that.fh_context.font = (10 * that.scale * 1.5) + 'px Arial';
        that.fh_context.textAlign = 'center';
        that.fh_context.textBaseline = 'middle';
        that.fh_context.fillStyle = 'gray';
        that.fh_context.fillText(sorted_features[k + start]['value'].toFixed(1), text_width + bar_width + imp_width / 2, (ytop + ybottom) / 2);
        that.fh_context.fillText('F' + (feature_id + 1), text_width / 2, (ytop + ybottom) / 2);

        //if (flags[feature_id] == true) {
        //    that.fh_context.fillStyle = hexToRGB(color_manager.get_color(focused_class), 0.3);
        //    that.fh_context.fillRect(0, ytop, text_width, ybottom - ytop);
        //}

        that.fh_context.setLineDash([2 * that.scale, 3 * that.scale]);
        that.fh_context.strokeStyle = 'gray';
        that.fh_context.beginPath();
        that.fh_context.moveTo(0, ytop);
        that.fh_context.lineTo(canvas_width, ytop);
        that.fh_context.stroke();
        that.fh_context.setLineDash([]);

        var max_bin = 0;
        var transformed_bin_collec = [];
        var sum_bin = new Array(cluster_count);
        var bin_number = bin_widths[k].length;
        for (var j = 0;j < cluster_count; j++) {
            sum_bin[j] = 0;
        }
        for (var i = 0;i < cluster_count; i++) {
            for (var j = 0;j < bin_number; j++) {
                transformed_bin_collec[i][j] = Math.pow(bin_matrix[k][i][j], 0.3);
                sum_bin[i] += transformed_bin_collec[i][j];
            }
        }
        for (var i = 0;i < cluster_count; i++) {
            for (var j = 0;j < bin_number; j++) {
                transformed_bin_collec[i][j] *= 100;
                transformed_bin_collec[i][j] /= sum_bin[i];
                max_bin = Math.max(max_bin, transformed_bin_collec[i][j]);
            }
        }
        var percent_begin = 0;

        for (var i = 0;i < bin_number; i++) {
            var xleft = Math.round(bar_width * percent_begin / 100);
            var xright = Math.round(bar_width * (percent_begin + bin_widths[k][i]) / 100);
            var xmid = Math.round((xleft + xright) / 2);
            var single_bar_width = Math.round((xright - xleft) / 8);
            var bin_height = [];
            var bin_xleft = [];
            var bin_xright = [];

            for (j = 0; j < cluster_count; j++) {
                bin_height[j] = transformed_bin_collec[i][j] / max_bin * (ybottom - ytop - 5 * that.scale);
                bin_height[j] = bin_height[j] * (that.currentFrame / that.totalFrames);
                bin_xleft[j] = xmid + (j - cluster_count / 2) * single_bar_width;
                bin_xright[j] = bin_xleft[j] + single_bar_width;
            }


            for (j = 0; j < cluster_count; j++) {
                that.fh_context.fillStyle = (changeColorLightness(color_manager.get_color(SELECTED_CLASSES[confidence_lines.cluster_label_set[j]]), confidence_lines.cluster_alpha_set[j]));

                that.fh_context.fillRect(bin_xleft[j] + text_width, ybottom - bin_height[j], single_bar_width, bin_height[j]);
            }
        }
    }

    that.fh_context.font = 10 * that.scale + 'px Arial';
    that.fh_context.textAlign = 'center';
    that.fh_context.textBaseline = 'middle';
    that.fh_context.fillStyle = 'gray';
    that.fh_context.fillText('Feature', text_width / 2, top_gap / 4);
    that.fh_context.fillText('Name', text_width / 2, top_gap / 4 * 3);
    that.fh_context.fillText('Ranking', imp_width / 2 + text_width + bar_width, top_gap / 4);
    that.fh_context.fillText('Score', imp_width / 2 + text_width + bar_width, top_gap / 4 * 3);
    that.fh_context.fillText('Value Distribution', bar_width / 2 + text_width, top_gap / 4);

    that.fh_context.setLineDash([2 * that.scale, 3 * that.scale]);
    that.fh_context.strokeStyle = 'gray';
    that.fh_context.beginPath();
    that.fh_context.moveTo(text_width, 0);
    that.fh_context.lineTo(text_width, canvas_height);
    that.fh_context.moveTo(text_width + bar_width, 0);
    that.fh_context.lineTo(text_width + bar_width, canvas_height);
    that.fh_context.stroke();
    that.fh_context.setLineDash([]);

    if (that.currentFrame < that.totalFrames) {
        that.currentFrame = that.totalFrames - 1;
        window.requestAnimationFrame(that.render_feature_ranking_for_clusters_partially);
    }
};

FeatureMatrix.prototype.render_feature_ranking_for_clusters = function () {
    $('#ranking-hint').css('display', 'inline');

    var that = this;

    that.container
        .transition()
        .duration(500)
        .style("opacity", 1);
    var focused_class = get_current_focused_class();
    that.get_average_feature_importance(focused_class);
    var features = [];
    for (var k = 0; k < Math.min(that.nFeaturePerPage, FEATURE_COUNT - that.featureStart); k++) {
        features.push(that.sorted_features[k + that.featureStart]['id']);
    }
    that.features = features;
    that.update_bin_format_for_cluster();

    that.mode = that.importanceMode;
    that.currentFrame = 0;
    window.requestAnimationFrame(that.render_feature_ranking_for_clusters_partially);
};

FeatureMatrix.prototype.render_separation_features_for_clusters_partially = function () {
    var that = feature_matrix;

    that.currentFrame++;

    var canvas_height = that.fh_canvas.height;
    var canvas_width = that.fh_canvas.width;
    var top_gap = that.fh_canvas.top_gap;

    var focused_class = confidence_lines.focused_class;
    var sorted_features = that.sorted_features;

    var cluster_count = confidence_lines.cluster_label_set.length;
    //var flags = that.get_used_features();

    // drawing codes
    that.clear_canvas();

    var bin_matrix = that.binMatrix;
    var bin_widths = that.binWidths;

    var features = that.features;
    var start = that.featureStart;

    var text_width = Math.round((canvas_width) * 0.15);
    var bar_width = Math.round((canvas_width) * 0.7);
    var imp_width = Math.round((canvas_width) * 0.15);

    for (var k = 0; k < Math.min(that.nFeaturePerPage, FEATURE_COUNT - start); k++) {
        var feature_id = sorted_features[k + start]['id'];
        var ytop = Math.round((canvas_height - top_gap) / that.nFeaturePerPage * k + top_gap);
        var ybottom = Math.round((canvas_height - top_gap) / that.nFeaturePerPage * (k + 1) + top_gap);

        that.fh_context.font = (10 * that.scale * 1.5) + 'px Arial';
        that.fh_context.textAlign = 'center';
        that.fh_context.textBaseline = 'middle';
        that.fh_context.fillStyle = 'gray';
        that.fh_context.fillText(sorted_features[k + start]['value'].toFixed(1), text_width + bar_width + imp_width / 2, (ytop + ybottom) / 2);
        that.fh_context.fillText('F' + (feature_id + 1), text_width / 2, (ytop + ybottom) / 2);
        //if (flags[feature_id] == true) {
        //    that.fh_context.fillStyle = hexToRGB(color_manager.get_color(focused_class), 0.3);
        //    that.fh_context.fillRect(0, ytop, text_width, ybottom - ytop);
        //}

        that.fh_context.setLineDash([2 * that.scale, 3 * that.scale]);
        that.fh_context.strokeStyle = 'gray';
        that.fh_context.beginPath();
        that.fh_context.moveTo(0, ytop);
        that.fh_context.lineTo(canvas_width, ytop);
        that.fh_context.stroke();
        that.fh_context.setLineDash([]);

        var max_bin = 0;
        var transformed_bin_collec = [];
        var sum_bin = new Array(cluster_count);
        var bin_number = bin_widths[feature_id].length;
        for (var j = 0;j < cluster_count; j++) {
            sum_bin[j] = 0;
        }
        for (var i = 0;i < cluster_count; i++) {
            for (var j = 0;j < bin_number; j++) {
                transformed_bin_collec[i][j] = Math.pow(bin_matrix[feature_id][i][j], 0.3);
                sum_bin[i] += transformed_bin_collec[i][j];
            }
        }
        for (var i = 0;i < cluster_count; i++) {
            for (var j = 0;j < bin_number; j++) {
                transformed_bin_collec[i][j] *= 100;
                transformed_bin_collec[i][j] /= sum_bin[i];
                max_bin = Math.max(max_bin, transformed_bin_collec[i][j]);
            }
        }
        var percent_begin = 0;

        for (var i = 0;i < bin_number; i++) {
            var xleft = Math.round(bar_width * percent_begin / 100);
            var xright = Math.round(bar_width * (percent_begin + bin_widths[feature_id][i]) / 100);
            var xmid = Math.round((xleft + xright) / 2);
            var single_bar_width = Math.round((xright - xleft) / 8);
            var bin_height = [];
            var bin_xleft = [];
            var bin_xright = [];

            for (j = 0; j < cluster_count; j++) {
                bin_height[j] = transformed_bin_collec[i][j] / max_bin * (ybottom - ytop - 5 * that.scale);
                bin_height[j] = bin_height[j] * (that.currentFrame / that.totalFrames);
                bin_xleft[j] = xmid + (j - cluster_count / 2) * single_bar_width;
                bin_xright[j] = bin_xleft[j] + single_bar_width;
            }


            for (j = 0; j < cluster_count; j++) {
                that.fh_context.fillStyle = (changeColorLightness(color_manager.get_color(SELECTED_CLASSES[confidence_lines.cluster_label_set[j]]), confidence_lines.cluster_alpha_set[j]));

                that.fh_context.fillRect(bin_xleft[j] + text_width, ybottom - bin_height[j], single_bar_width, bin_height[j]);
            }
        }
    }

    that.fh_context.font = 10 * that.scale + 'px Arial';
    that.fh_context.textAlign = 'center';
    that.fh_context.textBaseline = 'middle';
    that.fh_context.fillStyle = 'gray';
    that.fh_context.fillText('Feature', text_width / 2, top_gap / 4);
    that.fh_context.fillText('Name', text_width / 2, top_gap / 4 * 3);
    that.fh_context.fillText('Ranking', imp_width / 2 + text_width + bar_width, top_gap / 4);
    that.fh_context.fillText('Score', imp_width / 2 + text_width + bar_width, top_gap / 4 * 3);
    that.fh_context.fillText('Value Distribution', bar_width / 2 + text_width, top_gap / 4);

    that.fh_context.setLineDash([2 * that.scale, 3 * that.scale]);
    that.fh_context.strokeStyle = 'gray';
    that.fh_context.beginPath();
    that.fh_context.moveTo(text_width, 0);
    that.fh_context.lineTo(text_width, canvas_height);
    that.fh_context.moveTo(text_width + bar_width, 0);
    that.fh_context.lineTo(text_width + bar_width, canvas_height);
    that.fh_context.stroke();
    that.fh_context.setLineDash([]);

    if (that.currentFrame < that.totalFrames) {
        window.requestAnimationFrame(that.render_separation_features_for_clusters_partially);
    }
};

FeatureMatrix.prototype.render_separation_features_for_clusters = function () {
    $('#ranking-hint').css('display', 'inline');

    var cluster_count = confidence_lines.cluster_label_set.length;
    if (cluster_count < 2) {
        return;
    }

    var that = this;
    var features = [];
    for (var i = 0; i < FEATURE_COUNT;i++) {
        features[i] = i;
    }
    that.features = features;
    that.update_bin_format_for_cluster();
    that.mode = that.separationMode;

    var bin_matrix = that.binMatrix;
    var bin_widths = that.binWidths;

    var separation_power = [];
    var sorted_features = [];
    for (k = 0; k < FEATURE_COUNT; k++) {
        separation_power[k] = 0;
        var total_bin_sum = 0;
        var bin_number = bin_widths[k].length;
        for (i = 0; i < bin_number; i++) {
            var bin_sum = 0;
            for (j = 0; j < cluster_count; j++) {
                bin_sum += bin_matrix[k][j][i];
            }
            if (bin_sum == 0) {
                continue;
            }
            for (j = 0; j < cluster_count; j++) {
                separation_power[k] += bin_matrix[k][j][i] * bin_matrix[k][j][i] / bin_sum;
            }
            total_bin_sum += bin_sum;
        }
        sorted_features[k] = {
            'id' : k,
            'value' : separation_power[k] / total_bin_sum
        };
    }
    sorted_features = _.sortBy(sorted_features, function(obj){
        return -obj['value'];
    });
    that.sorted_features = sorted_features;

    that.currentFrame = 0;
    window.requestAnimationFrame(that.render_separation_features_for_clusters_partially);
};

FeatureMatrix.prototype.get_average_feature_importance = function (focused_class) {
    var that = this;

    var imp = [];
    for (var i = 0; i < FEATURE_COUNT; i++) {
        imp[i] = FEATURE_IMPORTANCE[focused_class][i];
    }

    var imp2 = [];
    for (i = 0; i < FEATURE_COUNT; i++) {
        imp2[i] = {
            'id' : i,
            'value' : parseFloat(imp[i])
        };
    }
    imp2 = _.sortBy(imp2, function(obj){return -obj['value'];});

    that.sorted_features = imp2;
};

FeatureMatrix.prototype.get_average_feature_importance2 = function (focused_class) {
    var that = this;

    var imp = [];
    for (var i = 0; i < FEATURE_COUNT; i++) {
        imp[i] = 0;
    }

    for (var t = 0; t < ITERATION_COUNT; t++) {
        if (focused_class != -1) {
            for (i = 0; i < FEATURE_INFO_LIGHTGBM[t][focused_class].length; i++) {
                var obj = FEATURE_INFO_LIGHTGBM[t][focused_class][i];
                imp[obj['feature_id']] += obj['importance_value'];
            }
        } else {
            for (var k = 0; k < SELECTED_CLASSES.length; k++) {
                for (i = 0; i < FEATURE_INFO_LIGHTGBM[t][k].length; i++) {
                    var obj2 = FEATURE_INFO_LIGHTGBM[t][k][i];
                    imp[obj2['feature_id']] += obj2['importance_value'];
                }
            }
        }
    }

    for (i = 0; i < FEATURE_COUNT; i++) {
        imp[i] /= ITERATION_COUNT;
    }

    var imp2 = [];
    for (i = 0; i < FEATURE_COUNT; i++) {
        imp2[i] = {
            'id' : i,
            'value' : imp[i]
        };
    }
    imp2 = _.sortBy(imp2, function(obj){return -obj['value'];});

    //var max_value = imp2[0]['value'];
    //for (i = 0; i < FEATURE_COUNT; i++) {
    //    imp2[i]['value'] /= max_value;
    //}

    that.sorted_features = imp2;
    // console.log(imp2);

    return imp;
};

FeatureMatrix.prototype.render_separation_features_old = function (iteration, class_label, inst_idx, cluster_label) {
    //stop here, 2017/7/21 09:35
    var that = this;
    var canvas_height = that.fh_canvas.height,
        canvas_width = that.fh_canvas.width;

    if (confidence_lines.cluster_label_set.length < 2) {
        return;
    }

    that.mode = that.separationMode;

    var another_cluster = confidence_lines.clusters[confidence_lines.cluster_label_set[0]][confidence_lines.cluster_id_set[0]];

    var in_cluster = [];
    var in_another_cluster = [];

    for (var i = 0; i < INSTANCE_COUNT; i++) {
        in_cluster[i] = 0;
        in_another_cluster[i] = 0;
    }
    for (i = 0; i < inst_idx.length; i++) {
        in_cluster[inst_idx[i]] = 1;
    }
    for (i = 0; i < another_cluster.length; i++) {
        in_another_cluster[another_cluster[i]] = 1;
    }

    var separation_power = [];
    var appearing_iteration = [];

    var bins_cluster = [];
    var bins_others = [];
    var bins_another = [];

    for (var k = 0; k < FEATURE_COUNT; k++) {
        var max_value = Number.MIN_VALUE, min_value = Number.MAX_VALUE;
        for (i = 0; i < INSTANCE_COUNT; i++) {
            //if (TRUE_LABELS[i] >= SELECTED_CLASSES.length) {
            //    continue;
            //}

            if (SELECTED_CLASSES.indexOf(TRUE_LABELS[i]) == -1) {
                continue;
            }

            var value = RAW_FEATURES[i][k];
            if (value > max_value) {
                max_value = value;
            }
            if (value < min_value) {
                min_value = value;
            }
        }
        //console.log(k, min_value, max_value);

        //min_value = min_value - 0.01;

        bins_cluster[k] = [];
        bins_others[k] = [];
        bins_another[k] = [];

        for (i = 0;  i < that.nBins; i++) {
            bins_cluster[k][i] = 0;
            bins_others[k][i] = 0;
            bins_another[k][i] = 0;
        }

        for (i = 0; i < INSTANCE_COUNT; i++) {
            //if (TRUE_LABELS[i] >= SELECTED_CLASSES.length) {
            //    continue;
            //}

            if (SELECTED_CLASSES.indexOf(TRUE_LABELS[i]) == -1) {
                continue;
            }

            value = RAW_FEATURES[i][k];
            for (var j = 0; j < that.nBins; j++) {
                //if (value > min_value + (max_value - min_value) / that.nBins * j && value < min_value + (max_value - min_value) / that.nBins * (j + 1)) {
                //    if (in_cluster[i] == 1) {
                //        bins_cluster[k][j]++;
                //    } else {
                //        bins_others[k][j]++;
                //    }
                //    break;
                //}
                if (value >= that.binBound[j] && (j == that.nBins - 1 || value < that.binBound[j + 1])) {
                    if (in_cluster[i] == 1) {
                        bins_cluster[k][j]++;
                    } else if (in_another_cluster[i] == 1) {
                        bins_another[k][j]++;
                    } else {
                        bins_others[k][j]++;
                    }
                    break;
                }
            }
        }

        separation_power[k] = {
            'value' : 0,
            'feature_id' : k
        };
        for (i = 0; i < that.nBins; i++) {
            if (bins_cluster[k][i] != 0) {
                separation_power[k]['value'] += bins_cluster[k][i] * (bins_cluster[k][i] / (bins_cluster[k][i] + bins_another[k][i]));
            }
        }

        //appearing_iteration[k] = [];
        //for (i = 0; i < ITERATION_COUNT; i++) {
        //    for (j = 0; j < TREE_INFO_LIGHTGBM[i][class_label]['num_internals']; j++) {
        //        if (TREE_INFO_LIGHTGBM[i][class_label]['split_feature'][j] == k) {
        //            appearing_iteration[k].push({
        //                'iteration' : i,
        //                'gain' : TREE_INFO_LIGHTGBM[i][class_label]['split_gain'][j]
        //            });
        //        }
        //    }
        //}
        //
        //var max_gain = 0;
        //for (i = 0; i < appearing_iteration[k].length; i++) {
        //    if (appearing_iteration[k][i]['gain'] > max_gain) {
        //        max_gain = appearing_iteration[k][i]['gain'];
        //    }
        //}
        //for (i = 0; i < appearing_iteration[k].length; i++) {
        //    appearing_iteration[k][i]['gain'] = appearing_iteration[k][i]['gain'] / max_gain;
        //}
    }

    separation_power = _.sortBy(separation_power, function (obj) {
        return -obj['value'];
    });

    //console.log(separation_power);

    that.fh_context.clearRect(0, 0, that.fh_canvas.width, that.fh_canvas.height);

    var text_width = (canvas_width - that.left_gap) * 0.1;
    var bar_width = (canvas_width - that.left_gap) * 0.45;
    var appearance_width = (canvas_width - that.left_gap) * 0.45;

    for (k = 0; k < that.nFeaturePerPage; k++) {
        var feature_id = separation_power[k]['feature_id'];

        var ytop = canvas_height / that.nFeaturePerPage * k;
        var ybottom = canvas_height / that.nFeaturePerPage * (k + 1);

        that.fh_context.font = 10 * that.scale + 'px Arial';
        that.fh_context.textAlign = 'center';
        that.fh_context.textBaseline = 'middle';
        that.fh_context.fillStyle = 'gray';
        that.fh_context.fillText('F' + feature_id, that.left_gap + text_width / 2, (ytop + ybottom) / 2);

        var single_bar_width = 2;

        var max_bin = _.max(bins_cluster[feature_id]);
        for (i = 0; i < that.nBins; i++) {
            var single_bin_height = getBaseLog(1.1, bins_cluster[feature_id][i]) / getBaseLog(1.1, max_bin) * (ybottom - ytop - 5);

            var xleft = bar_width / that.nBins * i;
            var xright = bar_width / that.nBins * (i + 1);

            xleft = (xleft + xright) / 2 - single_bar_width / 2;
            xright = xleft + single_bar_width;

            that.fh_context.fillStyle = hexToRGB(color_manager.get_color(SELECTED_CLASSES[cluster_label]), 1);
            that.fh_context.fillRect(that.left_gap + text_width + xleft, ybottom - single_bin_height, xright- xleft, single_bin_height);
        }

        max_bin = _.max(bins_another[feature_id]);
        for (i = 0; i < that.nBins; i++) {
            single_bin_height = getBaseLog(1.1, bins_another[feature_id][i]) / getBaseLog(1.1, max_bin) * (ybottom - ytop - 5);

            xleft = appearance_width / that.nBins * i;
            xright = appearance_width / that.nBins * (i + 1);

            xleft = (xleft + xright) / 2 - single_bar_width / 2;
            xright = xleft + single_bar_width;

            that.fh_context.fillStyle = hexToRGB(color_manager.get_color(SELECTED_CLASSES[confidence_lines.cluster_label_set[0]]), 1);
            that.fh_context.fillRect(that.left_gap + text_width + bar_width + xleft, ybottom - single_bin_height, xright- xleft, single_bin_height);
        }

        //for (i = 0; i < appearing_iteration[feature_id].length; i++) {
        //    var obj = appearing_iteration[feature_id][i];
        //    var pos = obj['iteration'] / ITERATION_COUNT * (appearance_width - 10) + 10;
        //    var lightness = obj['gain'];
        //
        //    that.fh_context.beginPath();
        //    that.fh_context.moveTo(that.left_gap + text_width + bar_width + pos, ytop);
        //    that.fh_context.lineTo(that.left_gap + text_width + bar_width + pos, ybottom);
        //    that.fh_context.strokeStyle = hexToRGB(COLORS_ORIGIN[cluster_label * 2], lightness);
        //    that.fh_context.stroke();
        //}
    }

    that.fh_context.setLineDash([2, 3]);
    that.fh_context.strokeStyle = 'gray';
    that.fh_context.beginPath();
    that.fh_context.moveTo(that.left_gap, 0);
    that.fh_context.lineTo(that.left_gap, canvas_height);
    that.fh_context.moveTo(that.left_gap + text_width, 0);
    that.fh_context.lineTo(that.left_gap + text_width, canvas_height);
    that.fh_context.moveTo(that.left_gap + text_width + bar_width, 0);
    that.fh_context.lineTo(that.left_gap + text_width + bar_width, canvas_height);
    that.fh_context.stroke();
    that.fh_context.setLineDash([]);

};

FeatureMatrix.prototype.render_feature_heatmap = function (data, n_feature, T, n_class) {
    //console.log('feature');
    //console.log(data[0]);

    this.feature_mat = data;
    this.Nfeature = n_feature;

    var that = this;
    var canvas_width = that.width;
    var canvas_height = that.height;

    //console.log(canvas_width, canvas_height);
    //var colors = ['#ffffff', '#ffccff', '#ff99ff', '#ff66ff', '#ff33ff', '#ff00ff'];

    var cell_height = Math.max(Math.floor(canvas_height / that.Nfeature), 11);
    var cell_width = Math.max(Math.floor(canvas_width / T), 1);
    var cell_size = Math.min(canvas_height / that.Nfeature, cell_width);

    // that.fh_canvas_d3.attr("width", cell_width * T);

    for (var t = 0; t < T; t++) {
        var vec = that.feature_mat[t];
        var xleft = Math.round(canvas_width / T * t);
        var xright = Math.round(canvas_width / T * (t + 1));
        // var xleft = cell_width * t;

        for (var key in vec) {
            var info = vec[key];
            var key_index = key - 0;

            var ytop = Math.round(cell_height * key_index);

            var color_index = info[0];
            that.fh_context.fillStyle = COLORS_ORIGIN[color_index * 2];//COLOR_GENERATOR(color_index);
            that.fh_context.fillRect(xleft, ytop, xright - xleft, cell_height);
        }
    }
};

FeatureMatrix.prototype.render_feature_heatmap2_prepare = function (Nfeature, T, Nclass) {
    this.Nfeature = Nfeature;
    this.feature_info = FEATURE_INFO_LIGHTGBM;
    this.render_feature_heatmap2(4);
};

FeatureMatrix.prototype.render_feature_heatmap2 = function (focused_class) {
    var that = this;
    var canvas_height = that.height,
        canvas_width = that.width,
        T = confusion_matrix.T,
        radius = canvas_width / T / 2;

    for (var t = 0; t < T; t++) {

        var vec = that.feature_info[t][focused_class];
        var temp = [];
        var xleft = Math.round(canvas_width / T * t);
        var xright = Math.round(canvas_width / T * (t + 1));

        for (var i = 0; i < vec.length; i++) {
            var obj = {};
            for (var key in vec[i]) {
                obj[key] = vec[i][key];
            }
            temp.push(obj);
        }

        temp = _.sortBy(temp, 'feature_id');

        var ytop = [], ybottom = [];

        for (i = 0; i < temp.length; i++) {
            var ymiddle = (Math.round(temp[i]['feature_id'] / that.Nfeature * (canvas_height - radius * 2)) + radius);
            ytop.push(ymiddle - radius);
            ybottom.push(ymiddle + radius);
        }

        for (i = 1; i < temp.length; i++) {
            if (ytop[i] < ybottom[i - 1] && ybottom[i - 1] + radius * 2 <= canvas_height - radius) {
                ytop[i] = ybottom[i - 1] + 2;
                ybottom[i] = ytop[i] + radius * 2;
            }
        }

        for (i = temp.length - 2; i >= 0; i--) {
            if (ybottom[i] > ytop[i + 1]) {
                ybottom[i] = ytop[i + 1] - 2;
                ytop[i] = ybottom[i] - radius * 2;
            }
        }

        for (i = 0; i < temp.length; i++) {
            var real_radius = radius * (0.5 + temp[i]['self_size'] / vec[0]['self_size'] * 0.5);
            var xmiddle = (xleft + xright) / 2;
            ymiddle = (ytop[i] + ybottom[i]) / 2;

            var xleft_new = Math.round(xmiddle - real_radius);
            var xright_new = Math.round(xmiddle + real_radius);
            var ytop_new = Math.round(ymiddle - real_radius);
            var ybottom_new = Math.round(ymiddle + real_radius);

            that.fh_context.fillStyle = hexToRGB(COLORS_ORIGIN[focused_class * 2], temp[i]['importance_value']);
            that.fh_context.fillRect(xleft_new, ytop_new, xright_new - xleft_new, ybottom_new - ytop_new);
            that.fh_context.strokeStyle = 'gray';
            that.fh_context.strokeRect(xleft_new, ytop_new, xright_new - xleft_new, ybottom_new - ytop_new);

            var yleft, yright;
            if (temp[i]['size_ratio'] >= 0.5) {
                yleft = ymiddle + real_radius * (temp[i]['size_ratio'] - 0.5);
                yright = ymiddle - real_radius * (temp[i]['size_ratio'] - 0.5);
            } else {
                yright = ymiddle + real_radius * (0.5 - temp[i]['size_ratio']);
                yleft = ymiddle - real_radius * (0.5 - temp[i]['size_ratio']);
            }
            that.fh_context.beginPath();
            that.fh_context.strokeStyle = 'black';
            that.fh_context.moveTo(xleft_new + 2, yleft);
            that.fh_context.lineTo(xright_new - 2, yright);
            that.fh_context.stroke();
        }
    }
};

FeatureMatrix.prototype.get_feature_distribution = function (feature_id) {
    var max_value = Number.MIN_VALUE, min_value = Number.MAX_VALUE;

    for (var i = 0; i < INSTANCE_COUNT; i++) {
        var v = RAW_FEATURES[i][feature_id];
        if (v > max_value) {
            max_value = v;
        }
        if (v < min_value) {
            min_value = v;
        }
    }
    console.log(feature_id, min_value, max_value);

    var segment = 20;
    var count = init2dArray(segment, CLASS_COUNT);

    for (i = 0; i < INSTANCE_COUNT; i++) {
        v = RAW_FEATURES[i][feature_id];
        for (var k = 0; k < segment; k++) {
            if (v > (max_value - min_value) / segment * k && v < (max_value - min_value) / segment * (k + 1)) {
                count[k][TRUE_LABELS[i]]++;
            }
        }
    }

    return count;
};

FeatureMatrix.prototype.render_feature_distribution = function (focused_class) {
    var that = this;
    var canvas_height = that.height, canvas_width = that.width;
    var T = confusion_matrix.T, nRow = that.nRow;
    var left_gap = 20;

    that.fh_context.clearRect(0, 0, canvas_width, canvas_height);

    that.get_average_feature_importance(focused_class);

    for (var k = 0; k < nRow; k++) {
        var feature_id = that.sorted_feature[k]['id'];
        var feature_distribution = that.get_feature_distribution(feature_id);
        var segment = feature_distribution.length;

        var ytop = canvas_height / nRow * k,
            ybottom = canvas_height / nRow * (k + 1);

        that.fh_context.font = 8 * that.scale + 'px Arial';
        that.fh_context.textAlign = 'center';
        that.fh_context.textBaseline = 'middle';
        that.fh_context.fillStyle = 'black';
        that.fh_context.fillText('F ' + feature_id.toString(), left_gap / 2, (ytop + ybottom) / 2);
        that.fh_context.strokeStyle = 'white';
        that.fh_context.strokeRect(0, ytop, left_gap, ybottom - ytop);

        var max_instance_count = 0;
        for (var i = 0; i < segment; i++) {
            var sum = 0;
            for (var j = 0; j < SELECTED_CLASSES.length; j++) {
                sum += feature_distribution[i][j];
            }
            if (sum > max_instance_count) {
                max_instance_count = sum;
            }
        }

        for (i = 0; i < segment; i++) {
            var xleft = (canvas_width - left_gap) / segment * i + left_gap,
                xright = xleft + (canvas_width - left_gap) / segment;
            for (j = 0; j < SELECTED_CLASSES.length; j++) {
                var w = feature_distribution[i][j] / max_instance_count * ((canvas_width - left_gap) / segment);
                that.fh_context.fillStyle = COLORS_ORIGIN[j * 2];
                that.fh_context.fillRect(xleft, ytop, w, ybottom - ytop);
                xleft += w;
            }
            that.fh_context.strokeStyle = 'white';
            that.fh_context.strokeRect(xleft, ytop, xright - xleft, ybottom);
        }
    }
};

FeatureMatrix.prototype.render_feature_heatmap_multiple_class = function () {
    var that = this;
    var canvas_height = that.height, canvas_width = that.width;
    var T = confusion_matrix.T, nRow = that.nRow;

    that.fh_context.clearRect(0, 0, canvas_width, canvas_height);

    that.get_average_feature_importance(-1);

    var multiple_value_mat = [];

    for (var c = 0; c < SELECTED_CLASSES.length; c++) {
        var value_mat = [], max_value = 0;

        for (var t = 0; t < T; t++) {
            var L = (t == 0) ? 0 : ENDPOINTS[t - 1] + 1,
                R = ENDPOINTS[t];

            var value = [];

            for (var k = 0; k < nRow; k++) {
                value[k] = 0;
                for (var j = R; j <= R; j++) {
                    for (var i = 0; i < FEATURE_INFO_LIGHTGBM[j][c].length; i++) {
                        if (FEATURE_INFO_LIGHTGBM[j][c][i]['feature_id'] == that.sorted_feature[k]['id']) {
                            value[k] += FEATURE_INFO_LIGHTGBM[j][c][i]['importance_value'];
                        }
                    }
                }

                if (value[k] > max_value) {
                    max_value = value[k];
                }
            }

            value_mat.push(value);
        }

        for (t = 0; t < T; t++) {
            for (k = 0; k < nRow; k++) {
                if (value_mat[t][k] > 0)
                    value_mat[t][k] = Math.log(value_mat[t][k] + 1) / Math.log(max_value + 1);
            }
        }

        multiple_value_mat.push(value_mat);
    }

    for (t = 0; t < T; t++) {
        for (k = 0; k < nRow; k++) {
            var xleft = Math.floor(canvas_width / T * t);
            var xright = Math.floor(canvas_width / T * (t + 1));
            var ytop = (canvas_height / nRow * k);
            var ybottom = (canvas_height / nRow * (k + 1));

            for (c = 0; c < SELECTED_CLASSES.length; c++) {
                var v = multiple_value_mat[c][t][k];

                if (v > 0) {
                    v = 0.3 + v * 0.7;
                }

                var xl = xleft + (xright - xleft) / SELECTED_CLASSES.length * c,
                    xr = xleft + (xright - xleft) / SELECTED_CLASSES.length * (c + 1);

                if (v > 0) {
                    that.fh_context.fillStyle = hexToRGB(COLORS_ORIGIN[c * 2], v);
                    that.fh_context.fillRect(xl, ytop, xr - xl, ybottom - ytop);
                } else {
                    that.fh_context.fillStyle = hexToRGB('#CCCCCC', 0.8);
                    that.fh_context.fillRect(xl, ytop, xr - xl, ybottom - ytop);
                }
            }

            that.fh_context.strokeStyle = 'white';
            that.fh_context.strokeRect(xleft, ytop, xright - xleft, ybottom - ytop);
        }
    }
};

FeatureMatrix.prototype.render_feature_heatmap3 = function (focused_class) {
    var that = this;
    var canvas_height = that.height, canvas_width = that.width;
    var T = confusion_matrix.T, nRow = that.nRow;

    that.fh_context.clearRect(0, 0, canvas_width, canvas_height);

    that.get_average_feature_importance(focused_class);

    var value_mat = [], max_value = 0;

    for (var t = 0; t < T; t++) {
        var L = (t == 0) ? 0 : ENDPOINTS[t - 1] + 1,
            R = ENDPOINTS[t];

        var value = [], occur_count = [];

        for (var k = 0; k < nRow; k++) {
            value[k] = 0;
            occur_count[k] = 0;
            for (var j = R; j <= R; j++) {
                for (var i = 0; i < FEATURE_INFO_LIGHTGBM[j][focused_class].length; i++) {
                    if (FEATURE_INFO_LIGHTGBM[j][focused_class][i]['feature_id'] == that.sorted_feature[k]['id']) {
                        value[k]+= FEATURE_INFO_LIGHTGBM[j][focused_class][i]['importance_value'];
                        occur_count[k] += 1;
                    }
                }
            }

            // value[k] = value[k] / (R - L + 1);

            //if (occur_count[k] > 0) {
            //    value[k] /= occur_count[k];
            //}

            if (value[k] > max_value) {
                max_value = value[k];
            }
        }

        value_mat.push(value);
    }

    for (t = 0; t < T; t++) {
        for (k = 0; k < nRow; k++) {
            if (value_mat[t][k] > 0)
                value_mat[t][k] = Math.log(value_mat[t][k] + 1) / Math.log(max_value + 1);
        }
    }
    // console.log(value_mat);

    for (t = 0; t < T; t++) {
        for (k = 0; k < nRow; k++) {
            var v = value_mat[t][k];

            if (v > 0) {
                v = 0.3 + v * 0.7;
            }

            var xleft = Math.floor(canvas_width / T * t);
            var xright = Math.floor(canvas_width / T * (t + 1));
            var ytop = (canvas_height / nRow * k);
            var ybottom = (canvas_height / nRow * (k + 1));

            if (v > 0) {
                //var color = tinycolor(COLORS[focused_class * 2]);
                //var hsvobj = color.toHsv();
                //if (t == 0) {
                //    console.log(hsvobj.h, hsvobj.s, hsvobj.v);
                //}
                //hsvobj.s *= v;
                //if (t == 0) {
                //    console.log(hsvobj.h, hsvobj.s, hsvobj.v);
                //}
                //color = tinycolor(hsvobj);
                //that.fh_context.fillStyle = color.toRgbString();
                that.fh_context.fillStyle = hexToRGB(COLORS_ORIGIN[focused_class * 2], v);
                that.fh_context.fillRect(xleft, ytop, xright - xleft, ybottom - ytop);
            } else {
                that.fh_context.fillStyle = hexToRGB('#CCCCCC', 0.5);
                that.fh_context.fillRect(xleft, ytop, xright - xleft, ybottom - ytop);
            }
            that.fh_context.strokeStyle = 'white';
            that.fh_context.strokeRect(xleft, ytop, xright - xleft, ybottom - ytop);
        }
    }
};

function validate_feature_importance () {
    var tmp = [];
    for (i = 0; i < FEATURE_COUNT; i++) {
        tmp[i] = 0;
    }
    for (var i = 0; i < CLASS_COUNT; i++) {
        var imp = feature_matrix.get_average_feature_importance(i);
        for (var j = 0; j < imp.length; j++) {
            tmp[imp[j]['id']] += imp[j]['value'];
        }
    }
    var tmp2 = [];
    for (i = 0; i < FEATURE_COUNT; i++) {
        tmp2[i] = {
            'id' : i,
            'value' : tmp[i]
        };
    }
    tmp2 = _.sortBy(tmp2, function (obj) {
        return -obj['value'];
    });
    for (i = 0; i < FEATURE_COUNT; i++) {
        //console.log(tmp2[i]['id'], tmp2[i]['value']);
    }

    //print_leaf_count();
}

function print_leaf_count() {
    for (var i = 0; i < ITERATION_COUNT; i++) {
        console.log(i, TREE_INFO_LIGHTGBM[i][1]['num_leaves']);
    }
}
