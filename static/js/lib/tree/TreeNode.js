var TreeNode = function() {
    var _this = this;

    this.allChildren = new Array();
    this.myChildren = new Array();
    this.documents = new Array();
    this.Id = null;
    this.id = null;
    this.words = new Array();
    this.label = new Array();
    this.documentCnt = 0;
    this.parent = null;

    this.window = {'x':0, 'y':0};
    this.beforeList = new Array();
    this.afterList = new Array();

    this.initialize = function (node) {
        var maxId = 0;
        var children = [];
        if (node["C"]) {
            for (var i = 0; i < node["C"].length; i++) {
                var cnode = new TreeNode();
                var id = cnode.initialize(node["C"][i]);
                if (maxId < id) {
                    maxId = id;
                }
                cnode.sibling_id = i;
                children.push(cnode);
            }
        }
        _this.allChildren = children;
        _this.myChildren = children;
        _this.level = node.level;
        _this.status = node.status;
        _this.splits = node.splits || [];
        _this.raw_splits = node.splits ? node.splits.slice() : [];
        _this.documents = node.Documents ? node.Documents : new Array();
        _this.Id = node["i"] ? node["i"] : 0;
        _this.id = node["i"] ? node["i"] + 1 : 1;
        if (maxId < _this.id) {
            maxId = _this.id;
        }
        _this.isLeaf = (typeof node["v"] != "undefined");
        _this.nodeData = _this.isLeaf ? {
            "leaf-count": node["d"],
            "leaf-value": node["v"]
        } : {
            "internal-count": node["c"],
            "internal-value": node["V"],
            "split-feature": node["f"],
            "split-gain": node["g"],
            "threshold": node["t"]
        };
        var label;
        if (!_this.isLeaf) {
            if (node["f"][0] != 'f') {
                label = 'F' + (node["f"] - - 1);
            } else {
                label = 'F' + (node["f"].slice(1) - - 1);
            }
        }
        _this.label = [_this.isLeaf ? node["v"].toExponential(1) : label];
        _this.documentCnt = _this.getAllDescendantId().length;
        return maxId;
    };

    this.copy = function(node) {
        _this.allChildren = node.allChildren;
        _this.myChildren = node.myChildren;
        _this.documents = node.documents;
        _this.Id = node.Id;
        _this.id = node.id;
        _this.words = node.words;
        _this.label = node.label;
        _this.documentCnt = node.documentCnt;
        _this.parent = node.parent;
        _this.window = node.window;
        _this.beforeList = node.beforeList;
        _this.afterList = node.afterList;
    }

    this.update = function(toParent) {
        _this.window = { 'x': 0, 'y': 0 };
        _this.beforeList = new Array();
        _this.afterList = new Array();
        _this.updateFeatureVector(toParent);
    }

    this.sort = function() {
        _this.allChildren.sort(function (a, b) {
            if (a.documentCnt == b.documentCnt) {
                return b.Id < a.Id ? -1 : 1;
            }
            return b.documentCnt < a.documentCnt ? -1 : 1;
        });
    }

    this.addChild = function(childrens) {
        _this.allChildren = _this.allChildren.concat(childrens);
        for (var i = 0; i < childrens.length; i++) {
            childrens[i].parent = _this;
        }
        _this.updateFeatureVector(true);
        _this.sort();
    }

    this.removeChild = function (childrens) {
        var index = -1;
        for (var i = 0; i < childrens.length; i++) {
            index = _this.allChildren.indexOf(childrens[i]);
            if (index > -1) {
                _this.allChildren.splice(index, 1);
            }
        }
        _this.updateFeatureVector(true);
    }
    this.addTopRestNode = function () {
        var rest = _this.topRest ? _this.topRest : new TreeNode();
        rest.isTop = true;
        rest.isRest = true;
        rest.restChildrenCnt = _this.beforeList.length;
        rest.restDocumentCnt = 0;
        for (var i = 0; i < _this.beforeList.length; i++) {
            rest.restDocumentCnt += _this.beforeList[i].documentCnt;
        }
        rest.Id = -_this.Id - 1;
        rest.parent = _this;
        _this.topRest = rest;
    }
    this.addBottomRestNode = function() {
        var rest = _this.bottomRest ? _this.bottomRest : new TreeNode();
        rest.isTop = false;
        rest.isRest = true;
        rest.restChildrenCnt = _this.afterList.length;
        rest.restDocumentCnt = 0;
        for (var i = 0; i < _this.afterList.length; i++) {
            rest.restDocumentCnt += _this.afterList[i].documentCnt;
        }
        rest.Id = -_this.Id - 1;
        rest.parent = _this;
        _this.bottomRest = rest;
    }

    this.getDepth = function () {
        var treeDepth = 0;
        var depthCount = function (level, n) {
            if (level > treeDepth) {
                treeDepth = level;
            }
            if (n.allChildren && n.allChildren.length > 0) {
                n.allChildren.forEach(function (d) {
                    depthCount(level + 1, d);
                });
            }
        };
        depthCount(0, _this);
        return treeDepth;
    }

    this.getWidth = function () {
        var levelWidth = [1];
        var childCount = function (level, n) {
            if (n.allChildren && n.allChildren.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.allChildren.length;
                n.allChildren.forEach(function (d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, _this);
        return levelWidth;
    }

    this.getAllDescendantId = function () {
        var result = new Array();
        var queue = new Array();
        var startPtr = 0;
        var endPtr = 0;
        queue[endPtr++] = _this;
        while (startPtr < endPtr) {
            if (queue[startPtr].documents)
                for (var i = 0; i < queue[startPtr].documents.length; i++) {
                    result.push(queue[startPtr].documents[i]);
                }
            if (queue[startPtr].allChildren) {
                for (var i = 0; i < queue[startPtr].allChildren.length; i++) {
                    queue[endPtr++] = queue[startPtr].allChildren[i];
                }
            }
            startPtr++;
        }
        _this.documentCnt = result.length;
        return result;
    }

    this.deleteDocumentNodeById = function(id) {
        var index = this.documents.indexOf(id);
        if (index >= 0) {
            this.documents.splice(index, 1);
            this.updateFeatureVector();
            return true;
        } else {
            for (var i = 0; i < this.allChildren.length; i++) {
                if (this.allChildren[i].deleteDocumentNodeById(id)) {
                    this.updateFeatureVector();
                    return true;
                }
            }
            return false;
        }
    }

    this.updateFeatureVector = function (toParent) {
        $.ajax({
            url: "/BRTViz/FeatureVector",
            type: 'POST',
            data: {
                ids: JSON.stringify(_this.getAllDescendantId())
            },
            success: function (data) {
                var count = 3;
                _this.label = [];
                //_this.label.push("(" + _this.documentCnt + ")");
                for (var j = 0; j < (data.length < count ? data.length : count) ; j++) {
                    _this.label.push(data[j].Key);
                }
                _this.words = [];
                for (var j = 0; j < data.length; j++) {
                    _this.words.push(data[j].Key);
                }
                d3.select("#node" + _this.Id).selectAll("tspan")
                    .data(function(d) {
                        return d.label;
                    })
                    .text(function(d) {
                        return d;
                    });
                var drawRect = new DrawHighlightRect().updateHighlightRects(d3.select("#node" + _this.Id));
                var drawDepth = new DrawDepthNode().updateDepthNodes(d3.select("#node" + _this.Id));
            }
        });
        if (_this.parent && toParent) {
            _this.parent.updateFeatureVector(toParent);
        }
    }
}