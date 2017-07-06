/**
 * Created by Derek Xiao on 2016/12/9.
 */

function LineUp(container) {
    this.svg = d3.select(container).append("svg");
    this.height = 400;
    this.width = 600;
    this.margin = {
        "top": 10,
        "bottom": 10,
        "left": 10,
        "right": 10
    };
    this.row_height = 30;
}

// table: row_names, col_names, data
LineUp.prototype.draw = function (table) {
    var table_data = table.data;

};