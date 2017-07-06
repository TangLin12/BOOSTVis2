/**
 * Created by derekxiao on 2017/2/7.
 */

function ClassSelector(container) {
    var that = this;
    container.select("#class-selector").remove();
    that.container = container
        .append("svg")
        .attr("id", "class-selector")
        .attr("version", "1.1")
        .attr("xmlns", "http://www.w3.org/2000/svg");
    that.container.attr("class", "overlay")
        .style("overflow", "overlay");

    that.bbox = container.node().getBoundingClientRect();
    that.width = that.bbox.width;
    that.height = that.bbox.height;

    that.toggle_button_top = 5;
    that.toggle_button_height = 20;
    that.toggle_button_bottom = 10;

    that.selected_glyph_width = that.width * 0.178;
    that.selected_glyph_height = that.selected_glyph_width * 1.2;
    that.selected_glyph_space_y = that.height * 0.02 + that.selected_glyph_height;
    that.class_glyph_width = that.width * 0.16;
    that.class_glyph_height = that.class_glyph_width * 1.2;
    that.class_glyph_space_x = that.height * 0.05 + that.class_glyph_width;
    that.class_glyph_space_y = that.height * 0.02 + that.class_glyph_height;

    that.glyph_setting = {
        "x-start-tp": that.width * 0.37 - that.selected_glyph_width / 2,
        "x-start-fp": that.width * 0.66 - that.selected_glyph_width / 2,
        //"x-start": that.width * 0.05 - that.selected_glyph_width / 2,
        "x-start": 0,
        "y-start": that.width / 6
    };

    //console.log(that.class_glyph_space_y, that.selected_glyph_space_y);
    var columns = ["TP", "FP"];
    that.column_labels = that.container.append("svg:g").selectAll("text");
    that.column_labels = that.column_labels.data(columns);
    that.column_labels.enter().append("text")
        .attr("class", "class-selector-column")
        .attr("fill", "grey")
        .attr("font-family", "sans-serif")
        .attr("font-size", 11 + "px")
        .text(function (d) { return d; })
        .attr("x", function (d, i) {
            var s = i == 0 ? that.glyph_setting["x-start-tp"] : that.glyph_setting["x-start-fp"];
            return s + that.selected_glyph_width / 4;
        })
        .attr("y", function (d, i) {
            return that.width / 11;
            //return that.toggle_button_height +
            //    that.toggle_button_top +
            //    that.toggle_button_bottom + that.width / 40;
        })
    ;

    that.toggle_button_holder = that.container
        .attr("width", that.width)
        .attr("height", that.height)
        .append("svg:g")
        .attr("transform", "translate(" + 0 + "," + 0
            //(that.height - (that.toggle_button_height))
        + ")")
        .style("opacity", 0);
    that.toggle_button = that.toggle_button_holder.append("rect")
        .attr("height", that.toggle_button_height)
        .attr("width", 24)
        .attr("rx", 3)
        .attr("ry", 3)
        .style("fill", "white")
        .style("stroke", "white")
        //.style("opacity", 0)
        .on("mouseover", function () {
            //d3.select(this).style("stroke", "#333");
                //.style("opacity", 1);
        })
        .on("mouseout", function () {
            if (that.is_visible) return;
            //d3.select(this).style("stroke", "white");
                //.style("opacity", 0);
        })
        .on("mousedown", function () {
            event.stopImmediatePropagation();
            event.preventDefault();
            //that.toggle_menu.call(that);
        });
    var cx = [6, 12, 18];
    for (var i = 0; i < cx.length; i ++) {
        that.toggle_button_holder.append("circle")
            .attr("fill", "#666")
            .attr("r", 2)
            .attr("cx", cx[i])
            .attr("cy", 10)
            .style("pointer-events", "none");
    }

    that.g = that.container.append("svg:g");
    that.selected_holder = that.g.append("g");
    that.selected_class_glyphs_TP = that.selected_holder.selectAll("rect.selected-glyph-tp");
    that.selected_class_glyphs_FP = that.selected_holder.selectAll("rect.selected-glyph-fp");
    that.selected_label_holder = that.g.append("g");
    that.selected_class_labels = that.selected_label_holder.selectAll("text.selected-label");
    that.hidden_holder = that.g.append("g");
    that.hidden_class_glyphs = that.hidden_holder.selectAll("rect.hidden-glyph");

    var intercept = 10;
    that.container.append('defs')
        .append('pattern')
        .attr('id', 'diagonalHatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', intercept)
        .attr('height', intercept)
        .append('path')
        .attr('d', 'M0,' + intercept + ' l' + [intercept, -intercept] + " M-2, 2l4, -4 "
            + "M" + [intercept - 2, intercept + 2] + "l" + [4, -4])
        .attr('stroke', '#808080')
        .attr('stroke-width', 1);
}

ClassSelector.prototype.toggle_menu = function () {
    var that = this;
    if (this.is_visible) {
        that.hide_menu.call(that);
    } else {
        that.show_menu.call(that);
    }
    this.is_visible = !this.is_visible;
};

ClassSelector.prototype.highlight_class = function (class_) {
    var that = this;
    that.dehighlight_class();
    that.selected_holder
        .select("#tp-" + class_)
        .style("stroke", "black")
        .style("stroke-width", "2px");
    that.selected_holder
        .select("#fp-" + class_)
        .style("stroke", "black")
        .style("stroke-width", "2px");
    //that.selected_class_labels.select("#class-label-" + class_);
};

ClassSelector.prototype.dehighlight_class = function () {
    var that = this;
    that.selected_class_glyphs_TP
        //.selectAll(".selected-glyph-tp")
        .style("stroke", "#808080")
        .style("stroke-width", "1px");
    that.selected_class_glyphs_FP
        //.selectAll(".selected-glyph-tp")
        .style("stroke", "#808080")
        .style("stroke-width", "1px");
};

ClassSelector.prototype.show_menu = function () {
    var that = this;
    if (this.is_visible) return;
    that.toggle_button.style("fill", "#C6C6C6");
    that.selected_class_glyphs_TP
        .transition()
        .duration(500)
        .style("opacity", 0.1);
    that.hidden_class_glyphs
        .transition()
        .duration(500)
        .style("pointer-events", "initial")
        .style("opacity", 1);
    that.selected_class_labels
        .transition()
        .duration(500)
        .style("opacity", 0.1);
};

ClassSelector.prototype.hide_menu = function () {
    if (!this.is_visible) return;
    var that = this;
    that.toggle_button
        .style("fill", "white");
    var selected_classes = color_manager.get_classes();
    that.create_selected_glyphs(selected_classes);
    that.hidden_class_glyphs
        .transition()
        .duration(300)
        .style("pointer-events", "none")
        .style("opacity", 0);
    that.selected_class_labels
        .transition()
        .duration(500)
        .style("opacity", 1);
    that.commit_selection();
};

ClassSelector.prototype.commit_selection = function () {
    if (this.selection_changed) {
        selected_class_changed();
        this.selection_changed = false;
    }
};

ClassSelector.prototype.handle_select = function (class_label) {
    var that = this;
    if (color_manager.has_class(class_label)) {
        color_manager.detach_class(class_label);
        this.selection_changed = true;
    } else {
        if (!color_manager.insert_class(class_label)) {
            window.dialog = new Messi(
                'Select TOOOO many classes',
                {
                    center: false,
                    width: '300px',
                    position: {top: 30 + 'px', left: '20px'},
                    autoclose: 400
                }
            );
            return;
        }
        this.selection_changed = true;
    }
    that.hidden_class_glyphs
        .style("fill", function (d) {
            return color_manager.get_color(d.name);
        });
};

ClassSelector.prototype.update = function (color_manager, sort_index) {
    var that = this;
    var selected_labels = color_manager.get_classes();

    that.create_selected_glyphs(selected_labels, sort_index);
    that.create_hidden_glyphs(sort_index);
};

ClassSelector.prototype.create_selected_glyphs = function (selected_labels, sort_index) {
    var that = this;
    this.ranking = sort_index;
    var data = _.map(selected_labels, function (d) {
        return {
            "name": d
        };
    });
    // create TP legends
    that.selected_class_glyphs_TP = that.selected_class_glyphs_TP.data(data);
    that.selected_class_glyphs_TP.enter()
        .append("rect")
        .attr("class", "selected-glyph-tp");

    that.selected_class_glyphs_TP.exit().remove();
    that.selected_class_glyphs_TP
        .attr("id", function (d) {
            return "tp-" + d.name;
        })
        .attr("title", function (d) {
            return that.ranking[d.name];
        })
        .attr("x", that.glyph_setting["x-start-tp"])
        .attr("y", function (d, i) {
            return i * that.selected_glyph_space_y +
                that.glyph_setting["y-start"];
        })
        .attr("width", that.selected_glyph_width)
        .attr("height", that.selected_glyph_height)
        .attr("rx", that.selected_glyph_width * 0.05)
        .attr("ry", that.selected_glyph_height * 0.05)
        .style("stroke", "#808080")
        .style("fill", function (d) {
            return color_manager.get_color(that.ranking[d.name]);
        })
        .style("opacity", 1)
        .style("cursor", "hand")
        .on("click", function (d) {
            //update_confusion_matrix(d.name);
            //focus_on_class(d.name);
            console.log("focus", d.name);
            click_class(d.name - 0);
        });

    // create FP legends
    that.selected_class_glyphs_FP = that.selected_class_glyphs_FP.data(data);
    that.selected_class_glyphs_FP.enter()
        .append("rect")
        .attr("class", "selected-glyph-fp");

    that.selected_class_glyphs_FP
        .attr("id", function (d) {
            return "fp-" + d.name;
        })
        .attr("title", function (d) {
            return that.ranking[d.name];
        })
        .attr("x", that.glyph_setting["x-start-fp"])
        .attr("y", function (d, i) {
            return i * that.selected_glyph_space_y +
                that.glyph_setting["y-start"];
        })
        .attr("width", that.selected_glyph_width)
        .attr("height", that.selected_glyph_height)
        .attr("rx", that.selected_glyph_width * 0.05)
        .attr("ry", that.selected_glyph_height * 0.05)
        .style("stroke", "#808080")
        .style("fill", function (d) {
            return hexToRGB(color_manager.get_color(that.ranking[d.name]), 0.5);
            //return color_manager.get_companion_color(d.name);
        })
        .style("opacity", 1)
        .style("cursor", "hand")
        .on("click", function (d) {
            //update_confusion_matrix(d.name);
            //focus_on_class(d.name);
            console.log("focus", d.name);
            click_class(d.name - 0);
        });

    var patterns = that.selected_holder.selectAll("rect.selected-glyph-fp-pattern").data(data);
    patterns.enter()
        .append("rect")
        .attr("class", "selected-glyph-fp-pattern");
    patterns
        .attr("x", that.glyph_setting["x-start-fp"])
        .attr("y", function (d, i) {
            return i * that.selected_glyph_space_y +
                that.glyph_setting["y-start"];
        })
        .attr("width", that.selected_glyph_width)
        .attr("height", that.selected_glyph_height)
        .attr("rx", that.selected_glyph_width * 0.05)
        .attr("ry", that.selected_glyph_height * 0.05)
        .style("stroke", "#808080")
        .style("fill", "url(#diagonalHatch)")
        .style("cursor", "hand")
        .style("opacity", 1)
        .on("click", function (d) {
            //update_confusion_matrix(d.name);
            //focus_on_class(d.name);
            console.log("focus", d.name);
            click_class(d.name - 0);
        });

    that.create_selected_labels(data);
};

ClassSelector.prototype.create_selected_labels = function (selected_labels, sort_index) {
    var that = this;
    that.selected_class_labels = that.selected_class_labels.data(selected_labels);
    that.selected_class_labels.enter()
        .append("text")
        .attr("font-family", "sans-serif")
        .attr("font-size", 11 + "px")
        .attr("x", that.glyph_setting["x-start"] + that.selected_glyph_width / 6)
        .attr("y", function (d, i) {
            return i * that.selected_glyph_space_y +
                that.glyph_setting["y-start"]
                + that.selected_glyph_height / 2 + 4;
        });
    that.selected_class_labels.exit().remove();
    that.selected_class_labels
        .attr("id", function (d) {
            return "class-label-" + d.name;
        })
        .text(function (l) {
            return "C" + (that.ranking[l.name] - - 1);
        })
        .attr("id", function (d) { return "class-label-" + d.name; })
        .style("fill", "grey");
};

ClassSelector.prototype.create_hidden_glyphs = function () {
    var that = this;
    var selection_max = color_manager.selection_max;
    var data = _.map(ALL_CLASSES, function (d, i) {
        var target_y_index = i % selection_max;
        var target_x_index = (i - target_y_index) / selection_max;
        return {
            "name": d,
            "x-index": target_x_index,
            "y-index": target_y_index
        };
    });
    that.hidden_class_glyphs = that.hidden_class_glyphs.data(data);
    that.hidden_class_glyphs
        .enter()
        .append("rect")
        .attr("class", "hidden-glyph")
        .attr("title", function (d) {
            return d.name;
        })
        .attr("x", function (d, i) {
            return that.glyph_setting["x-start"] + that.class_glyph_space_x * d["x-index"] + that.width * 0.07;
        })
        .attr("y", function (d, i) {
            return that.glyph_setting["y-start"] + d['y-index'] * that.class_glyph_space_y;
        })
        .attr("width", that.class_glyph_width)
        .attr("height", that.class_glyph_height)
        .attr("rx", that.class_glyph_width * 0.05)
        .attr("ry", that.class_glyph_height * 0.05)
        .style("stroke", "#808080")
        .style("fill", function (d) {
            return color_manager.get_color(d.name);
        })
        .style("pointer-events", "none")
        .style("opacity", 0)
        .on("mousedown", function (d) {
            that.handle_select.call(that, d.name);
        });
    that.hidden_class_glyphs.exit().remove();
};
