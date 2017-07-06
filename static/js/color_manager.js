/**
 * Created by Derek Xiao on 2017/2/22.
 */


function ColorManager(selection_max, available_colors) {
    var that = this;
    that.selection_max = selection_max;
    that.available_colors = available_colors;
    that.color_map = {};
    that.default_color = ['#ddd', '#bbb'];
}

ColorManager.prototype.assign = function (class_labels) {
    var that = this;
    for (var i = 0; i < class_labels.length; i ++) {
        if (_.keys(that.color_map) == that.selection_max) {
            break;
        }
        that.color_map[class_labels[i]] = that.available_colors.shift();
        // that.color_map[class_labels[i]] = that.available_colors[class_labels[i]][0];//that.available_colors.shift();
    }
};

ColorManager.prototype.has_class = function (class_label) {
    return _.has(this.color_map, class_label);
};

ColorManager.prototype.get_classes = function () {
    return _.keys(this.color_map);
};

ColorManager.prototype.get_color = function (class_label) {
    var that = this;
    if (that.color_map[class_label]) {
        return that.color_map[class_label][0];
    } else {
        return that.default_color[0];
    }
};

ColorManager.prototype.get_noob_color = function () {
    return this.default_color[0];
};

ColorManager.prototype.get_noob_color1 = function () {
    return this.default_color[1];
};

ColorManager.prototype.get_companion_color = function (class_label) {
    var that = this;
    if (that.color_map[class_label]) {
        return that.color_map[class_label][1];
    } else {
        return that.default_color[1];
    }
};

ColorManager.prototype.insert_class = function (class_label) {
    var that = this;
    if (_.keys(that.color_map).length < that.selection_max) {
        that.color_map[class_label] = that.available_colors.pop();
        SELECTED_CLASSES = that.get_classes();
        SELECTED_CLASSES.sort();
        //console.log("insert", class_label);
        return true;
    } else {
        return false;
    }
};

ColorManager.prototype.detach_class = function (class_label) {
    var that = this;
    if (_.has(that.color_map, class_label)) {
        var color = that.color_map[class_label];
        delete that.color_map[class_label];
        that.available_colors.push(color);
        //console.log("detach", class_label);
        SELECTED_CLASSES = that.get_classes();
        SELECTED_CLASSES.sort();
    } else {
        console.log("class previously not assigned", class_label);
    }
};