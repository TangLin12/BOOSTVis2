/**
 * Created by Derek Xiao on 2017/2/4.
 */

function Indicator(container) {
    var that = this;
    that.container = container;
    that.container.style("height", "0px");
    var bbox = container.node().getBoundingClientRect();
    that.svg = container.append("svg")
        .attr("width", WINDOW_WIDTH * 0.5)
        .attr("height", WINDOW_HEIGHT * 0.95)
        .style("pointer-events", "none")
        .style("z-index", 100)
        .attr("class", "transparent");
        //.style("position", "absolute")
        //.style("top", bbox.top)
        //.style("left", bbox.left);
    that.indicator = that.svg.append("rect")
        .attr("width", 3)
        .attr("height", WINDOW_HEIGHT * 0.95)
        .attr("x", 0)
        .attr("y", 0)
        .attr("class", "x-indictor")
        .style("opacity", 0)
        .style("pointer-events", "none");
}

Indicator.prototype.show = function (pos) {
    this.indicator
        .style("opacity", 1);
    this.move_to(pos);
};

Indicator.prototype.vanish = function () {
    this.indicator.style("opacity", 0);
};

Indicator.prototype.move_to = function (pos) {
    // show_linechar_stats(pos);
    this.indicator.attr("x", pos);
};