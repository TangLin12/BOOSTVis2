/**
 * Created by Derek Xiao on 2017/4/4.
 */

function PreLoader() {
    var that = this;
    that.element = d3.select("#preloader");
    that.element.selectAll(".progress>div")
        .classed("indeterminate", false)
        .classed("determinate", true)
        .style("width", 0);
    that.element.selectAll(".progress-indicator")
        .text("- -");
    that.info_header = d3.select("#loading-header");
}

PreLoader.prototype.show = function () {
    var that = this;
    that.element
        .transition()
        .duration(200)
        .style("opacity", 1);
    that.info_header.text("Loading " + (WINDOW_WIDTH < 1204 ? "" : "Progress ") + "(" + DATASET + "-" + SETTYPE + ")");
    //setTimeout(function () {
    //    that.element.style("display", "block");
    //}, 200);
};

PreLoader.prototype.hide = function () {
    var that = this;
    that.element
        .transition()
        .duration(2000)
        .style("opacity", 0)
        .style("pointer-events", "none");
    //setTimeout(function () {
    //    that.element.style("display", "none");
    //}, 2000);
};

PreLoader.prototype.load_instance_timepoint = function(timepoints, that) {
    var load = function(index){
        if (index >= timepoints.length) { return; }
        var p = timepoints[index];
        if (p >= that.time_length - 3) {
            return;
        }
        var focused_timepoint = Math.min(p + 3, that.time_length - 1);

        if (!that.cached_timepoints[p]) {
            var task = "/api/tsne-result3-iteration" + "?dataset=" + DATASET + "&is_train=" +
                (SETTYPE == "train" ? "1" : "0") + "&iteration=" + (focused_timepoint - 3) + "&full=" + 0;
            var oReq = new XMLHttpRequest();
            oReq.open("GET", task, true);
            oReq.responseType = "arraybuffer";
            oReq.setRequestHeader("cache-control", "no-cache");

            oReq.onload = function (oEvent) {
                var arrayBuffer = oReq.response;
                if (arrayBuffer) {
                    var byteArray = new Float32Array(arrayBuffer);
                    var center_data_length = CLASS_COUNT * 4 * 2;
                    for (var i = 0; i < 4; i ++) {
                        //var c = data["center"][i];
                        for (var c = 0; c < CLASS_COUNT; c ++) {
                            that.centers[focused_timepoint + i][c] = [
                                byteArray[i * CLASS_COUNT * 2 + c * 2] * that.data_enlarge_scale,
                                byteArray[i * CLASS_COUNT * 2 + c * 2 + 1] * that.data_enlarge_scale
                            ];
                        }
                    }
                    var instance_count = (byteArray.length - center_data_length) / 4 / 2;
                    for (var i = 0; i < instance_count; i ++) {
                        for (var j = 0; j < 4; j ++) {
                            //var dd = data["trajectory"][i][j];
                            that.nodes_data[i]["trajectory"][focused_timepoint + j - 3] = [
                                byteArray[i * 4 * 2 + j * 2 + center_data_length] * that.data_enlarge_scale,
                                byteArray[i * 4 * 2 + j * 2 + center_data_length + 1] * that.data_enlarge_scale
                            ];
                        }
                    }
                    that.cached_timepoints[p] = true;
                    load(index+1);
                }
            };
            oReq.send(null);
        }
        else{
            load(index+1);
        }
    };
    load(0);
};

PreLoader.prototype.load_representative_trees = function (callback) {
    var need_to_load = [];
    for (var i = 0; i < CLASSIFIER_CLUSTERING_RES_ALL.length; i ++) {
        var res = CLASSIFIER_CLUSTERING_RES_ALL[i][CLASSIFIER_CLUSTER_NUMBER];
        if (res) {
            for (var j = 0; j < res.medoids.length; j ++) {
                need_to_load.push(res.medoids[j] * CLASS_COUNT + i);
            }
        }
    }
    if (need_to_load.length == 0) {
        return 0;
    }
    d3.json("/api/get-classifiers-set" + PARAMS + "&index=" + need_to_load.join("-"))
        .get(function (error, data) {
            var trees = data["trees"];
            var index = data["index"];
            //update(tree, index);
            for (var i = 0; i < index.length; i ++) {
                TREE_CLASSIFIERS[index[i]] = trees[i];
            }
            d3.text("/api/model-raw-indices" + PARAMS + "&index=" + need_to_load.join("-"))
                .get(function (error, data) {
                    var splits = data.split("|");
                    for (var i = 0; i < splits.length; i ++) {
                        ALL_TREES[need_to_load[i]] = parse_single_classifier(splits[i]);
                    }
                    if (callback) {
                        callback();
                    }
                })
        });
};