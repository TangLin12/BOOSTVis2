/**
 * Modified by Junlin Liu on 17/1/19.
 */

function LineChart(container) {
    var that = this;
    that.container = container;
    var bbox = container.node().getBoundingClientRect();

    that.margin = {
        "top": 5,
        "bottom": 5,
        "left": 0,
        "right": 0
    };

    var svg_width = bbox.width;
    var svg_height = WINDOW_HEIGHT * 0.08;
    //that.width = svg_width - that.margin.left - that.margin.right;
    //that.height = svg_height - that.margin.top - that.margin.bottom;
    that.width = svg_width - that.margin.left - that.margin.right;
    that.height = svg_height - that.margin.top - that.margin.bottom;
    that.linechart_svg = this.container.append("svg:svg")
        .attr("width", svg_width)
        .attr("height", svg_height);

    that.relative_shift = bbox.width / (2 * SEGMENT_COUNT);
    that.relative_shift_right = bbox.width / (2 * SEGMENT_COUNT) + 10;
    that.actual_width = bbox.width - that.relative_shift - that.relative_shift_right;

    that.curve_holder = that.linechart_svg.append("svg:g")
        .attr("transform", "translate(" + (that.relative_shift + that.margin.left) + "," + 0 + ")");
    that.curves = that.curve_holder.selectAll("path.curve");
    that.legend_holder = that.linechart_svg.append("svg:g")
        .attr("transform", "translate(" + (that.relative_shift + that.margin.left) + "," + 0 + ")");
    that.legend = that.legend_holder.selectAll("text.legend");

    that.indicator = that.linechart_svg.append("rect")
        .attr("width", 3)
        .attr("height", that.height)
        .attr("x", 0)
        .attr("y", 0)
        .style("fill", "black")
        .attr("class", "x-indictor")
        .style("opacity", 0)
        .style("pointer-events", "none");

    that.time_length = SEGMENT_COUNT;
    that.bin_space = that.actual_width / (that.time_length - 1);
    that.metric_map = {
        "accuracy": [
            "accuracy-train",
            "accuracy-test"
        ],
        "margin-mean": [
            "margin_mean_train",
            "margin_mean_test"
        ],
        "logloss": [
            "training's multi_logloss",
            "valid_1's multi_logloss"
        ]
    };
    that.label_name_map = {
        "accuracy-train": "train",
        "accuracy-test": "valid",
        "margin_mean_train": "train",
        "margin_mean_test": "valid",
        "training's multi_logloss": "train",
        "valid_1's multi_logloss": "valid"
    };
    that.metric_family = "logloss";
}

LineChart.prototype.show_stats = function (show_position) {
    var that = this;
    that.indicator
        .style("opacity", 1)
        .attr("x", show_position);
    show_position -= that.relative_shift;
    var pointed_timepoint = Math.floor(show_position / that.actual_width * that.time_length);
    pointed_timepoint = Math.max(0, pointed_timepoint);
    pointed_timepoint = Math.min(that.time_length - 1, pointed_timepoint);
    var stats = _.map(that.fields, function (f) {
        return {
            "name": f,
            "value": that.original_curve_data[f][pointed_timepoint]
        };
    });
    var orderby_current_time = {}; // key -> order
    _.each(_.sortBy(stats, function (d) {
        return - d.value;
    }), function (d, i) {
        orderby_current_time[d.name] = i;
    });
    that.legend_values
        .attr("x", show_position + that.actual_width * 0.01)
        .text(function (d) {
            return "    " + that.original_curve_data[d][pointed_timepoint].toPrecision(2);
        })
        .attr("y", function (d) {
            return that.start_y + orderby_current_time[d] * that.spacing_y;
        })
        .style("opacity", 1);
    that.legend
        .attr("x", show_position - that.actual_width * 0.01)
        .attr("y", function (d) {
            return that.start_y + orderby_current_time[d] * that.spacing_y;
        })
        .style("opacity", 1);
};

LineChart.prototype.switch_metric = function (metric_family) {
    var that = this;
    that.metric_family = metric_family;
    that.update_view();
};

LineChart.prototype.render_line_chart = function (curve_data, time_length) {
    var that = this;
    that.time_length = time_length;
    that.original_curve_data = curve_data;

    that.x = d3.scale.linear()
        .range([0, that.actual_width])
        .domain([0, that.time_length]);

    var xAxis = d3.svg.axis()
        .scale(that.x)
        .orient("bottom")
        .innerTickSize(- that.height)
        .outerTickSize(0.5)
        .ticks(SEGMENT_COUNT);
        //.tickPadding(Math.floor(that.time_length / SEGMENT_COUNT));

    that.brush = d3.svg.brush()
        .x(that.x);
    that.linechart_svg.
        append("g")
        .attr("class", "x brush")
        .attr("transform", "translate(" + (that.relative_shift + that.margin.left) +
            "," + 0 + ")"
        )
        .call(that.brush)
        .selectAll("rect")
        .attr("y", -6)
        .attr("height", that.height + 7);

    that.linechart_svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + (that.relative_shift + that.margin.left) +
            "," + (that.height) + ")"
        )
        .call(xAxis);
    d3.selectAll(".axis>.tick>text").attr("y", 5);
    d3.selectAll(".axis>.tick>text").attr("x", 5);
    d3.selectAll(".axis>.tick>text").text("");
    that.update_view();
    that._setup_listeners();
};

LineChart.prototype.update_view = function () {
    var that = this;
    var curve_data = that.original_curve_data;
    // filter out stop metrics

    var selected_curves = _.map(that.metric_map[that.metric_family], function (m) {
        return curve_data[m];
    });

    // get max value in curve data
    var curve_max_value = Number.MIN_VALUE;
    var curve_min_value = Number.MAX_VALUE;
    for (var i = 0; i < selected_curves.length; i ++) {
        var c = selected_curves[i];
        curve_max_value = Math.max(curve_max_value, _.max(c));
        curve_min_value = Math.min(curve_min_value, _.min(c));
    }

    var y = d3.scale.linear()
        .range([0, that.height])
        .domain([
            curve_max_value * 1.1 - curve_min_value * 0.1,
            curve_min_value * 1.1 - curve_max_value * 0.1
        ]);

    var time_points = [];
    for (var i = 0; i < that.time_length; i ++) {
        time_points.push(that.x(i));
    }

    that.curves = that.curve_holder.selectAll("path.curve");
    var curve_tuples = [];
    that.fields = _.map(_.sortBy(that.metric_map[that.metric_family], function (l) {
        return - that.original_curve_data[l][0];
    }), function (f) {
        return f;
    });
    console.log(that.fields.join("\t"));
    that.start_y = that.height * 0.3;
    that.spacing_y = (that.height - that.start_y * 2) / (that.fields.length - 1);

    for (var j = 0; j < selected_curves.length; j ++) {
        var key = that.metric_map[that.metric_family][j];
        var y_h = [];
        for (var i = 0; i < curve_data[key].length; i ++) {
            y_h.push([time_points[i], y(curve_data[key][i])]);
        }
        curve_tuples.push({
            "name": key,
            "curve": y_h
        });
    }
    that.curves = that.curves.data(curve_tuples);
    that.curves.enter()
        .append("svg:path")
        .attr("class", "curve")
        .attr("stroke-dasharray", function (d, i) {
            if (i == 0) {
                return "4, 3";
            }
        })
        .attr("fill", "none")
        .attr("stroke", "black")
        .style("pointer-events", "none");
    that.curves
        .attr("title", function (d) {
            return d["name"];
        })
        .transition()
        .duration(400)
        .attr("d", function (d) {
            return "M" + d["curve"].join("L");
        });
    that.curves.exit()
        .remove();
    that._add_legend(that.fields);
};

LineChart.prototype._setup_listeners = function () {
    var that = this;
    var get_timepoint = function (pos) {
        var pointed_timepoint = Math.floor((pos - that.relative_shift) / that.actual_width * that.time_length);
        pointed_timepoint = Math.max(0, pointed_timepoint);
        pointed_timepoint = Math.min(that.time_length - 1, pointed_timepoint);
        return pointed_timepoint;
    };
    that.linechart_svg.on("mouseover", function () {
        if (!d3.event.ctrlKey) return;
        var pos = d3.mouse(this);
        if (pos[0] < that.relative_shift - 6 || pos[0] > that.width) {
            var hidden_opacity = 0.4;
            that.indicator.style("opacity", hidden_opacity);
            return;
        }
        that.indicator.style("opacity", 1);
        //var pointed_timepoint = get_timepoint(pos[0]);
        that.show_stats(pos[0] - 2);
    });
    that.linechart_svg.on("mouseout", function () {
        var hidden_opacity = 0.4;
        that.indicator.style("opacity", hidden_opacity);
        that.legend_values
            .style("opacity", hidden_opacity);
        that.legend
            .style("opacity", hidden_opacity);
    });
    that.linechart_svg.on("mousemove", function () {
        if (!d3.event.ctrlKey) return;
        var pos = d3.mouse(this);
        if (pos[0] < that.relative_shift || pos[0] > that.width - that.relative_shift) {
            var hidden_opacity = 0.4;
            that.indicator.style("opacity", hidden_opacity);
            return;
        }
        var pointed_timepoint = get_timepoint(pos[0]);
        on_timepoint_highlight(pointed_timepoint);
        that.show_stats(pos[0] - 2);
    });
    that.linechart_svg.on("mouseup", function (d) {
        var selected_time_range = that.brush.empty() ? that.x.domain() : that.brush.extent();
        //time_ranged_changed(Math.floor(selected_time_range[0]), Math.min(Math.ceil(selected_time_range[1]), that.time_length - 1));
    });
};

LineChart.prototype._add_legend = function (labels) {
    var that = this;
    that.legend_default_x = 0;
    that.legend = that.legend_holder.selectAll("text.legend");
    that.legend = that.legend.data(labels);
    that.legend.enter()
        .append("text");
    that.legend
        .attr("class", "legend")
        .attr("x", that.legend_default_x)
        .attr("y", function (d, i) {
            return that.start_y + i * that.spacing_y;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", 8 + "px")
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .text(function (d, i) {
            return that.label_name_map[d];
        })
        .style("pointer-events", "none")
        .style("opacity", 0);
    that.legend.exit().remove();

    that.legend_values = that.legend_holder.selectAll("text.legend-values");
    that.legend_values = that.legend_values.data(labels);
    that.legend_values
        .enter()
        .append("text")
        .attr("class", "legend-values")
        .attr("x", that.legend_default_x)
        .attr("y", function (d, i) {
            return that.start_y + i * that.spacing_y;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", 8 + "px")
        .attr("fill", "black")
        .attr("text-anchor", "start")
        .text("")
        .style("pointer-events", "none")
        .style("opacity", 0);
    that.legend_values.exit().remove();
};
