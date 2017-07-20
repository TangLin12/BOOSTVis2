var TreeLayout = function (baseSvg, size, separation) {
    var _this = this;
    this.treeHelper = new TreeHelper(this);
    this.treeCut = new TreeCut(this);
    this.root = null;
    this.selectArr = [];
    this.draggingNode = null;
    this.viewHeight = size.viewerWidth;
    this.viewWidth = size.viewerHeight;
    this.translateX = size.translateX;
    this.translateY = size.translateY;
    this.nodeWidth = size.nodeWidth || ( (this.viewWidth - 40) / size["tree-depth"] ); //and line 269:  12 -> max_tree_depth
    this.max_depth = size["tree-depth"] + 1;
    this.nodeHeight = size.nodeHeight || 40;
    this.nodeSize = size.nodeSize || [1.5, 2.7];
    this.Margin = size.Margin || 80;
    this.type = size.type;
    this.baseSvg = baseSvg;
    this.multiSelect = false;
    this.tree = d3.layout.tree()
        .size([size.viewerHeight, size.viewerWidth])
        .nodeSize([this.nodeHeight, this.nodeWidth]);
    if (separation) {
        this.tree.separation(separation);
    } else {
        this.tree.separation(function (a, b) {
            return (a.parent.Id == b.parent.Id ? _this.nodeSize[0] : _this.nodeSize[1]);
        });
    }

    this.tree.sort(function (a, b) {
        if (a.isRest) {
            if (a.isTop) {
                return -1;
            } else {
                return 1;
            }
        } else if (b.isRest) {
            if (b.isTop) {
                return 1;
            } else {
                return -1;
            }
        }
        if (a.documentCnt == b.documentCnt) {
            return b.Id < a.Id ? -1 : 1;
        }
        return b.documentCnt < a.documentCnt ? -1 : 1;
        //return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
    });

    this.tree.children(function (d) {
        var children = null;
        if (d.myChildren && d.myChildren.length > 0) {
            children = [].concat(d.allChildren);
            // if (d.afterList.length > 0) {
            //     d.addBottomRestNode();
            //     children.push(d.bottomRest);
            // }
            // if (d.beforeList.length) {
            //     d.addTopRestNode();
            //     children.push(d.topRest);
            // }
        }
        return children;
    });
    this.treeNodeDic = new Array();
    this.id = 0;
    var dragListener = new this.treeHelper.DragListener();
    this.drawNode = new DrawNode(dragListener);
    this.drawLink = new DrawLink();

    this.onClickNode = null;

    this.layoutTreeByURL = function (url) {
        baseSvg.selectAll('g').remove();
        baseSvg.selectAll('path').remove();
        _this.selectArr = [];
        _this.id = 0;
        d3.json(url, function (error, data) {
            if (data != null) {
                //_this.treeHelper.convertTreeData(treeData);
                _this.root = new TreeNode();
                _this.id = _this.root.initialize(data);
                var root = _this.root;
                _this.initialNodeDic(root);
                _this.tree.nodes(root);
                root.x0 = 0;
                root.y0 = 0;
                _this.treeCut.treeCut(root);
                _this.update(root);
                // updateNodeInformation(root, _this.type);
            }
        });
    };
    this.layoutTree = function (data, selectionArr) {
        baseSvg.selectAll('g').remove();
        baseSvg.selectAll('path').remove();
        _this.selectArr = [];
        _this.id = 0;
        if (data != null) {
            _this.root = new TreeNode();
            _this.id = _this.root.initialize(data);
            var root = _this.root;
            _this.initialNodeDic(root);
            _this.tree.nodes(root);
            root.x0 = 0;
            root.y0 = 0;
            _this.treeCut.treeCut(root);
            _this.update(root);
        }
    };

    this.normalizeTree = function () {
        if (_this.root.raw_splits.length == 0) return;
        var sum = 0;
        for (var i = 0; i < _this.root.raw_splits.length; i++) {
            sum += _this.root.raw_splits[i];
        }
        var traversal = function (r) {
            if (r) {
                r.splits = [];
                r.intra_splits1 = [];
                r.api = 0;
                for (var i = 0; i < r.raw_splits.length; i++) {
                    var focused_class = get_current_focused_class();
                    if (focused_class == 4) {
                        r.splits.push((r.raw_splits[i]) / _this.root.raw_splits[i]);
                    } else {
                        r.splits.push((r.raw_splits[i]) / sum);
                    }
                    r.intra_splits1.push((r.raw_splits[i]) / _this.root.raw_splits[i]);
                    //r.splits.push(r.raw_splits[i] / _this.root.raw_splits[i] / _this.root.raw_splits.length);
                    r.api = Math.max(r.api, r.raw_splits[i] / _this.root.raw_splits[i]);
                }
                for (var i = 0; i < r.allChildren.length; i++) {
                    traversal(r.allChildren[i]);
                }
            }
        };
        traversal(_this.root);
    };

    this.layoutTreeWithSelectionArr = function (data, selectionArr, pin, dotTree) {
        baseSvg.selectAll('g').remove();
        baseSvg.selectAll('path').remove();
        _this.selectArr = [];
        _this.id = 0;
        if (data != null) {
            _this.root = new TreeNode();
            _this.id = _this.root.initialize(data);
            var root = _this.root;
            _this.normalizeTree();
            _this.initialNodeDic(root);
            _this.tree.nodes(root);
            _this.split_colors = [];
            root.x0 = 0;
            root.y0 = 0;
            var _selectionArr = [];
            for (var i = 0; i < selectionArr.length; i++) {
                _selectionArr.push({
                    node: _this.treeNodeDic[selectionArr[i]['i']],
                    drawChildren: true
                });
            }
            if (dotTree) return;
            _this.treeCut.setClickQueue(_selectionArr, pin);
            _this.treeCut.treeCut();
            //_this.update(root);
        }
    };

    var inPath = function (source, item) {
        var node = item;
        while (node != null) {
            if (node == source)
                return true;
            node = node.parent;
        }
        node = source;
        while (node != null) {
            if (node == item)
                return true;
            node = node.parent;
        }
        return false;
    };

    var LCA2 = function (a, b) {
        while (a.level > b.level) {
            a = a.parent;
        }
        while (b.level > a.level) {
            b = b.parent;
        }
        while (a.id != b.id) {
            a = a.parent;
            b = b.parent;
        }
        return a;
    };

    var distance = function (a, b) {
        //var p = LCA(_this.root, a, b);
        var p = LCA2(a, b);
        var d = a.level + b.level - p.level * 2;
        if (d < 0) {
            console.log("distance error");
        }
        return d;
    };

    this.DOI = function () {
        if (_this.root.raw_splits.length == 0) return [];

        var that = this;

        var all_nodes = [];

        var sum = function (arr) {
            var _s = 0;
            for (var i = 0; i < arr.length; i++) {
                _s += arr[i];
            }
            return _s;
        };

        var max_depth = parseInt(size["tree-depth"]) + 1;

        var traverse_for_api = function (r) {
            if (r) {
                all_nodes.push(r);

                r.doi = 0;

                for (var i = 0; i < r.raw_splits.length; i++) {
                    //r.api = Math.max(r.api, r.raw_splits[i] / _this.root.raw_splits[i]);
                    r.doi += r.raw_splits[i] / _this.root.raw_splits[i];
                }

                r.doi = r.doi / (max_depth - r.level) + 1;
                // r.doi_1 = r.doi;
                for (var i = 0; i < r.allChildren.length; i++) {
                    traverse_for_api(r.allChildren[i]);
                }
            }
        };
        traverse_for_api(_this.root);

        var nodes_doi_sorted = all_nodes.slice();
        nodes_doi_sorted.sort(function (a, b) {
            return b.doi - a.doi;
        });

        var focus_count = 5;
        for (var i = focus_count; i < nodes_doi_sorted.length; i++) {
            var min_dis = Number.MAX_VALUE;
            for (var j = 0; j < focus_count; j++) {
                var dis = distance(nodes_doi_sorted[i], nodes_doi_sorted[j]);
                if (dis < min_dis) {
                    min_dis = dis;
                }
            }
            nodes_doi_sorted[i].doi -= min_dis / (max_depth * 2);
        }

        nodes_doi_sorted.sort(function (a, b) {
            return b.doi - a.doi;
        });

        return nodes_doi_sorted.slice(0, 30);
    };

    this.clearClusters = function () {
        _this.split_colors = [];
        for (var i = 0; i < _this.treeNodeDic.length; i++) {
            _this.treeNodeDic[i].raw_splits = [];
            _this.treeNodeDic[i].splits = [];
            _this.treeNodeDic[i].lineWidth_splits = [];
        }
    };

    this.add_data_distribution_on_nodes = function (data) {
        for (var i = 0; i < data[0].length; i++) {
            _this.treeNodeDic[i].data_count = [];
            for (var k = 0; k < CLASS_COUNT; k++) {
                _this.treeNodeDic[i].data_count[k] = data[k][i];
            }
        }

        for (i = data[0].length - 1; i >= 0; i--) {
            for (k = 0; k < CLASS_COUNT; k++) {
                _this.treeNodeDic[i].data_count[k] /= _this.treeNodeDic[0].data_count[k];
            }
        }
    };
    this.showBar = function () {
        DRAW_BAR = 1;
        _this.update();
    }
    this.hiddenBar = function () {
        DRAW_BAR = 0;
        _this.update();
    }
    this.showSplit = function () {
        SHOW_SPILT_VALUT = 1;
        var nodes = _this.tree.nodes(_this.root).reverse();
        var node = baseSvg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++_this.id);
            });
        _this.drawNode.drawNodeLabel.creatLabels(node);
        _this.drawNode.drawHighlightRect.createHighlightRects(node);
        _this.drawNode.drawHighlightRect.updateHighlightRects(node);
    }
    this.hiddenSplit = function () {
        SHOW_SPILT_VALUT = 0;
        var nodes = _this.tree.nodes(_this.root).reverse();
        var node = baseSvg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++_this.id);
            });
        _this.drawNode.drawNodeLabel.creatLabels(node);
        _this.drawNode.drawHighlightRect.createHighlightRects(node);
        _this.drawNode.drawHighlightRect.updateHighlightRects(node);
    }


    //For preview tree list
    this.applyCluster_Preview = function (count_on_nodes, split_color, highlightIndex, projection) {
        _this.split_colors.push(split_color);
        for (var i = 0; i < count_on_nodes.length; i++) {
            _this.treeNodeDic[i].raw_splits.push(count_on_nodes[i]);
        }
        _this.normalizeTree();
        var selectionArr = _this.DOI();
        var _selectionArr = new Array();
        for (var i = 0; i < selectionArr.length; i++) {
            _selectionArr.push({
                node: selectionArr[i],
                drawChildren: true
            });
        }
        var traversal_check_siblings = function (r) {
            if (r.Children) {
                if (r.Children[0].sibling_id != 0) {
                    var temp = r.Children[0];
                    r.Children[0] = r.Children[1];
                    r.Children[1] = temp;
                }
                for (var i = 0; i < r.Children.length; i++) {
                    traversal_check_siblings(r.Children[i]);
                }
            }
        };
        traversal_check_siblings(_this.root);
        var nodes = _this.tree.nodes(_this.root).reverse();
        var links = _this.tree.links(nodes);

        projection(nodes);

        var draggingNode = null;
        //var links = _this.tree.links(nodes);
        var node = baseSvg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++_this.id);
            });
        var drawNode = new DrawNode_Preview();
        var drawLink = new DrawLink_Preview();
        var nodeEnter = drawNode.createNodes(node, highlightIndex);
        drawNode.drawBar.createBars(node);
        drawLink.showRestLinks(nodeEnter, highlightIndex);
        drawNode.drawHighlightRect.createHighlightRects(nodeEnter);
        // var split_length = _this.root.splits.length;

        var nodeUpdate = drawNode.updateNodes(node, draggingNode);

        drawNode.drawHighlightRect.updateHighlightRects(node);
        drawNode.drawBar.updateBars(node, 1);
        drawLink.updateLinks(null, 1, 1, 1, _this.nodeWidth - 7, highlightIndex);
        //_this.treeHelper.centerTree(_this.root, 2, [0, this.viewWidth]);
    };

    //For preview tree list
    this.calculate_DOI_and_perfrom_treecut = function (count_on_nodes, split_color, highlightIndex) {
        _this.split_colors.push(split_color);
        for (var i = 0; i < count_on_nodes.length; i++) {
            _this.treeNodeDic[i].raw_splits.push(count_on_nodes[i]);
        }
        _this.normalizeTree();
        var selectionArr = _this.DOI();
        var _selectionArr = new Array();
        for (var i = 0; i < selectionArr.length; i++) {
            _selectionArr.push({
                node: selectionArr[i],
                drawChildren: true
            });
        }
        _this.treeCut.setClickQueue(_selectionArr);
        _this.treeCut.treeCut();
    };

    this.applyCluster = function (count_on_nodes, split_color, finished) {
        _this.split_colors.push(split_color);
        for (var i = 0; i < count_on_nodes.length; i++) {
            _this.treeNodeDic[i].raw_splits.push(count_on_nodes[i]);
        }
        _this.normalizeTree();
        var selectionArr = _this.DOI();
        var _selectionArr = new Array();
        for (var i = 0; i < selectionArr.length; i++) {
            _selectionArr.push({
                node: selectionArr[i],
                drawChildren: true
            });
        }
        _selectionArr.push({
            node: _this.root.allChildren[0],
            drawChildren: true
        });
        //console.log(_selectionArr);
        _this.treeCut.setClickQueue(_selectionArr);
        _this.treeCut.treeCut();
        _this.update(_this.root);
    };

    this.resize = function (size) {
        _this.viewHeight = size.viewerWidth;
        _this.viewWidth = size.viewerHeight;
        _this.translateX = size.translateX;
        _this.translateY = size.translateY;
        _this.baseSvg.attr("transform", "translate(" + _this.translateX + "," + _this.translateY + ")rotate(-90)");
        var root = _this.root;
        root.x0 = 0;
        root.y0 = 0;
        _this.treeCut.treeCut();
        _this.update();
        //updateNodeInformation(root, _this.type);
        _this.highlight([]);

    }
    this.deleteNode = function () {
        var selectArr = _this.selectArr;
        var parent = selectArr[0].parent;
        if (parent) {
            parent.removeChild(selectArr);
            selectArr = [];
            _this.highlight(selectArr);
            _this.treeCut.treeCut(parent);
            parent.updateFeatureVector();
            _this.update(parent);
        }
    }

    this.showNode = function (d, noClick) {
        if (d) {
            _this.treeCut.treeCut(d);
            //_this.selectArr = [d];
            _this.selectArr.splice(0, 0, d);
        } else {
            //_this.selectArr = [];
        }
        _this.update();

        _this.highlight(_this.selectArr, noClick);
    }

    this.click = function (d) {
        // _this.highLightNodes.hideLeafInfo(d);
        if (SHOW_SPILT_VALUT != 1) {
            _this.drawNode.drawHighlightRect.hideLeafInfo(d);
        }
        if (d3.event.defaultPrevented) return;

        var alpha = 0.6, beta = 0.4, decay = 0.9;

        var all_nodes = [];

        function traverse_for_doi(r) {
            var dis = distance(r, d);
            r.doi = r.doi * decay * alpha + 1.0 / (dis + 1) * beta;
            for (var i = 0; i < r.allChildren.length; i++) {
                traverse_for_doi(r.allChildren[i]);
            }
            all_nodes.push(r);
            r.inQueue = false;
        }

        traverse_for_doi(_this.root);

        all_nodes.sort(function (a, b) {
            return b.doi - a.doi;
        });

        var _selectionArr = [];

        for (var j = 0; j < d.allChildren.length; j++) {
            var c = d.allChildren[j];
            if (c.allChildren.length == 0) {
                _selectionArr.push({
                    'node': c,
                    'drawChildren': true
                });
                c.inQueue = true;
            } else {
                for (i = 0; i < c.allChildren.length; i++) {
                    var gc = c.allChildren[i];
                    _selectionArr.push({
                        'node': gc,
                        'drawChildren': true
                    });
                    gc.inQueue = true;
                }
            }
        }

        var selectionArr = all_nodes.slice(0, 30);

        for (var i = 0; i < selectionArr.length; i++) {
            var node = selectionArr[i];
            if (node.inQueue == false) {
                _selectionArr.push({
                    node: node,
                    drawChildren: true
                });
            }
        }
        _this.treeCut.setClickQueue(_selectionArr);
        _this.treeCut.treeCut();
        _this.update_click(d);
    }

    this.click1 = function (d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        function selectNode() {
            if (d.isRest) {
                if (d.isTop) {
                    _this.treeCut.showBefore(d.parent);
                } else {
                    //if (!_this.treeCut.showMore(d.parent)) {
                    _this.treeCut.showAfter(d.parent);
                    //}
                }
                _this.update(d);
                //updateNodeInformation(d.parent, _this.type);
                return;
            }
            _this.showNode(d);
            //updateNodeInformation(d, _this.type);
            if (_this.onClickNode != null) {
                _this.onClickNode(d);
            }
        }

        function addNode() {
            if (d.isRest || d === _this.root) {
                return;
            }
            var selectArr = _this.selectArr;
            if (!selectArr) {
                selectArr = [];
            }
            var index = selectArr.indexOf(d);
            if (index > -1) {
                selectArr.splice(index, 1);
            } else {
                var parent = d.parent;
                while (parent) {
                    index = selectArr.indexOf(parent);
                    if (index > -1) {
                        return;
                    }
                    parent = parent.parent;
                }
                selectArr.push(d);
            }
            _this.highlight(selectArr);
        }

        if (_this.multiSelect) {
            addNode();
        } else {
            selectNode();
        }
    }
    this.setMulti = function (v) {
        _this.multiSelect = v;
    }

    function appearAni(anidata) {
        var split_length = _this.root.splits.length;
        var node = anidata[0];
        var link = anidata[1];
        var draggingNode = _this.draggingNode;
        var drawNode = _this.drawNode;
        var drawLink = _this.drawLink;
        var nodeUpdate = drawNode.updateNodes(node, draggingNode);

        drawNode.drawBar.updateBars(node, _this.split_colors);
        drawNode.drawPin.updatePins(nodeUpdate);
        drawNode.drawDepthNode.updateDepthNodes(nodeUpdate);
        drawNode.drawRestNode.updateRestNode(nodeUpdate);

        drawNode.drawNodeLabel.updateLabels(node);
        drawNode.drawHighlightRect.updateHighlightRects(node);
        var timeNode = drawLink.updateLinks(link, draggingNode, _this.split_colors, node, _this.nodeWidth - 20);

    }

    function disappearAni(anidata) {
        var node = anidata[0];
        var link = anidata[1];
        var nodes = anidata[2];
        var drawNode = _this.drawNode;
        var drawLink = _this.drawLink;
        var exitNode = node.exit();
        if (_this.draggingNode) {
            for (var i = 0; i < exitNode[0].length; i++) {
                if (exitNode[0][i] && exitNode[0][i].id == "node" + _this.draggingNode.Id) {
                    exitNode[0].splice(exitNode[0].indexOf(exitNode[0][i]), 1);
                }
            }
        }
        var nodeExit = exitNode.transition()
            .duration(duration)
            .attr("transform", function (d) {
                var parent = d.parent;
                while (nodes.indexOf(parent) < 0) {
                    parent = parent.parent;
                }
                return "translate(" + parent.y + "," + parent.x + ")";
            })
            .style("opacity", 0)
            .remove();
        drawLink.removeLinks(link, nodes);

    }

    this.get_drawn_node_features = function () {
        var flag = [];
        for (var k = 0; k < FEATURE_COUNT; k++) {
            flag[k] = false;
        }

        var traverse_for_feature = function (r) {
            if (r.isLeaf == true) {
                return;
            }
            //console.log(r.Id, r.nodeData['split-feature']);
            flag[parseInt(r.nodeData['split-feature'])] = true;
            for (var i = 0; i < r.myChildren.length; i++) {
                traverse_for_feature(r.myChildren[i]);
            }
        };
        traverse_for_feature(this.root);

        return flag;
    }

    this.update = function (d) {
        var split_length = _this.root.splits.length;
        var INSTANCE_MODE_FIXED_WIDTH = 5;
        var MAX_WIDTH = 30;
        var exp = 0.7;
        var log = d3.scale.pow().exponent(exp).domain([1, 3000]).range([5, 30]);
        var rootWidth = log(sum(tree_inspector.resultTree.root.raw_splits));

        var traversal_check_siblings = function (r) {
            if (r.Children) {
                if (r.Children[0].sibling_id != 0) {
                    var temp = r.Children[0];
                    r.Children[0] = r.Children[1];
                    r.Children[1] = temp;
                }
                for (var i = 0; i < r.Children.length; i++) {
                    traversal_check_siblings(r.Children[i]);
                }
            }
        };
        traversal_check_siblings(_this.root);
        var traversal = function (r) {
            r.intra_splits = [];
            r.flow_exist = [];
            r.lineWidth_splits = [];
            var EXP = 0.5;
            if (r.parent === null) {
                _sum = 0;
                for (var i = 0; i < r.splits.length; i++) {
                    // r.lineWidth_splits.push( r.splits[i] / sum(r.splits) );
                    _sum += Math.pow(r.splits[i], EXP);
                }
                for (var i = 0; i < r.splits.length; i++) {
                    r.lineWidth_splits.push(Math.pow(r.splits[i], EXP) / _sum);
                }
            }
            else {
                var sum_width = 0;
                for (var i = 0; i < r.parent.allChildren.length; i++) {
                    for (var j = 0; j < r.parent.allChildren[i].splits.length; j++) {
                        //sum_width = sum_width + Math.log( 1000 * ( 1e-6 + r.parent.allChildren[i].splits[j]) + 1 );
                        sum_width = sum_width + Math.pow(r.parent.allChildren[i].splits[j], EXP);
                    }
                }
                var parent_sum = sum(r.parent.lineWidth_splits);
                // for( var i = 0; i < r.parent.splits.length; i++) {
                //     parent_sum = parent_sum + r.parent.lineWidth_splits[i];
                // }
                //console.log( " sum_width:" + sum_width + " parent_sum:" + parent_sum);

                for (var j = 0; j < r.splits.length; j++) {
                    // r.lineWidth_splits.push( Math.log( 1000 * ( 1e-6 + r.splits[j]) + 1 ) / sum_width * parent_sum );
                    r.lineWidth_splits.push(Math.pow(r.splits[j], EXP) / sum_width * parent_sum);
                }
            }
            if (r.allChildren.length) {
                for (var i = 0; i < r.allChildren.length; i++) {
                    traversal(r.allChildren[i]);
                }
            }
        };
        traversal(_this.root);
        function scaleSplit(input, input2) {
            if (input2 < 3e-4) {
                return 0;
            }
            if (log(sum(tree_inspector.resultTree.root.raw_splits)) <= MAX_WIDTH)
                return Math.max(Math.round(input * ( is_instance_mode() ? INSTANCE_MODE_FIXED_WIDTH : rootWidth )), 1);
            else
                return Math.max(Math.round(input * ( is_instance_mode() ? INSTANCE_MODE_FIXED_WIDTH : MAX_WIDTH )), 1);
        }

        var traversal_round = function (r) {
            // if ( r.splits.length === 0){
            //     return ;
            // }
            r.flow_exist.push(sum(r.lineWidth_splits) > 0.5 ? 1 : 0);
            var tmp = [];
            var color_index = [];
            for (var i = 0; i < r.lineWidth_splits.length; i++) {
                //if (scaleSplit(r.lineWidth_splits[i]) < 1) {
                //    console.log("fff");
                //}
                r.lineWidth_splits[i] = scaleSplit(r.lineWidth_splits[i], r.intra_splits1[i]);
                for (var j = 0; j < r.lineWidth_splits[i]; j++) {
                    tmp.push(1);
                    color_index.push(i);
                }
            }

            r.lineNum_splits = tmp;
            r.lineNum_splits.push(r.flow_exist[0]);
            //arr_validate(r.intra_splits1, r.lineNum_splits);
            //r.lineWidth_splits = tmp;
            r.color_index = color_index;

            if (r.allChildren.length) {
                for (var i = 0; i < r.allChildren.length; i++) {
                    traversal_round(r.allChildren[i]);
                }
            }
        };
        traversal_round(_this.root);

        //this.tree = d3.layout.tree()
        //    .nodeSize([this.nodeHeight / 2, this.nodeWidth / 2]);
        var nodes = _this.tree.nodes(_this.root).reverse();
        var links = _this.tree.links(nodes);

        var node = baseSvg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++_this.id);
            });
        node.select("rect.nodeRect").filter(".highlight").attr("class", "nodeRect show");
        var drawNode = _this.drawNode;
        var drawLink = _this.drawLink;
        var nodeEnter = drawNode.createNodes(node);
        nodeEnter.on('click', _this.click);
        drawNode.drawConnectRect.creatRects(nodeEnter);
        drawNode.drawNodeLabel.creatLabels(node);
        drawNode.drawPin.createPins(nodeEnter, _this.treeCut);
        drawNode.drawDepthNode.createDepthNodes(nodeEnter);
        drawNode.drawRestNode.createRestNodes(nodeEnter);
        drawNode.drawBar.createBars(node);
        drawLink.showRestLinks(node, split_length);
        drawNode.drawHighlightRect.createHighlightRects(node);
        _this.highLightNodes(nodeEnter, d);
        var link = baseSvg.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });
        //var link = baseSvg.selectAll("path.link")
        //    .data(links);
        //var link = baseSvg.selectAll("path.link").data(links);

        //drawLink.createLinks(link, links,_this.draggingNode);

        var aniData = [node, link, nodes, links];
        appearAni(aniData);
        disappearAni(aniData);
        //nodes.forEach(function (d) {
        //    if (_this.draggingNode && _this.draggingNode === d) {
        //        return;
        //    }
        //    d.x0 = d.x;
        //    d.y0 = d.y;
        //});
        _this.treeHelper.centerTree(d);
    }

    this.update_click = function (d) {
        var split_length = _this.root.splits.length;
        var INSTANCE_MODE_FIXED_WIDTH = 5;
        var MAX_WIDTH = 30;
        var exp = 0.7;
        var log = d3.scale.pow().exponent(exp).domain([1, 3000]).range([5, 30]);
        var rootWidth = log(sum(tree_inspector.resultTree.root.raw_splits));

        var traversal_check_siblings = function (r) {
            if (r.Children) {
                if (r.Children[0].sibling_id != 0) {
                    var temp = r.Children[0];
                    r.Children[0] = r.Children[1];
                    r.Children[1] = temp;
                }
                for (var i = 0; i < r.Children.length; i++) {
                    traversal_check_siblings(r.Children[i]);
                }
            }
        }
        traversal_check_siblings(_this.root);
        var traversal = function (r) {
            r.intra_splits = [];
            r.flow_exist = [];
            r.lineWidth_splits = [];
            var EXP = 0.5;
            if (r.parent === null) {
                _sum = 0;
                for (var i = 0; i < r.splits.length; i++) {
                    // r.lineWidth_splits.push( r.splits[i] / sum(r.splits) );
                    _sum += Math.pow(r.splits[i], EXP);
                }
                for (var i = 0; i < r.splits.length; i++) {
                    r.lineWidth_splits.push(Math.pow(r.splits[i], EXP) / _sum);
                }
            }
            else {
                var sum_width = 0;
                for (var i = 0; i < r.parent.allChildren.length; i++) {
                    for (var j = 0; j < r.parent.allChildren[i].splits.length; j++) {
                        //sum_width = sum_width + Math.log( 1000 * ( 1e-6 + r.parent.allChildren[i].splits[j]) + 1 );
                        sum_width = sum_width + Math.pow(r.parent.allChildren[i].splits[j], EXP);
                    }
                }
                var parent_sum = sum(r.parent.lineWidth_splits);
                // for( var i = 0; i < r.parent.splits.length; i++) {
                //     parent_sum = parent_sum + r.parent.lineWidth_splits[i];
                // }
                //console.log( " sum_width:" + sum_width + " parent_sum:" + parent_sum);

                for (var j = 0; j < r.splits.length; j++) {
                    // r.lineWidth_splits.push( Math.log( 1000 * ( 1e-6 + r.splits[j]) + 1 ) / sum_width * parent_sum );
                    r.lineWidth_splits.push(Math.pow(r.splits[j], EXP) / sum_width * parent_sum);
                }
            }
            if (r.allChildren.length) {
                for (var i = 0; i < r.allChildren.length; i++) {
                    traversal(r.allChildren[i]);
                }
            }
        };
        traversal(_this.root);

        function scaleSplit(input) {
            if (input < 0.01) {
                //return 0;
                return 1;
            }
            else if (input < 0.025) {
                return 1;
            }
            else {
                if (log(sum(tree_inspector.resultTree.root.raw_splits)) <= 30)
                    return Math.round(input * ( is_instance_mode() ? INSTANCE_MODE_FIXED_WIDTH : rootWidth ));
                else
                    return Math.round(input * ( is_instance_mode() ? INSTANCE_MODE_FIXED_WIDTH : MAX_WIDTH ));
            }
        }

        var traversal_round = function (r) {
            // if ( r.splits.length === 0){
            //     return ;
            // }
            r.flow_exist.push(sum(r.lineWidth_splits) > 0.5 ? 1 : 0);
            var tmp = [];
            var color_index = [];
            for (var i = 0; i < r.lineWidth_splits.length; i++) {
                r.lineWidth_splits[i] = scaleSplit(r.lineWidth_splits[i]);
                for (var j = 0; j < r.lineWidth_splits[i]; j++) {
                    tmp.push(1);
                    color_index.push(i);
                }
            }
            r.lineNum_splits = tmp;
            r.lineNum_splits.push(r.flow_exist[0]);
            //r.lineWidth_splits = tmp;
            r.color_index = color_index;

            if (r.allChildren.length) {
                for (var i = 0; i < r.allChildren.length; i++) {
                    traversal_round(r.allChildren[i]);
                }
            }
        }
        traversal_round(_this.root);

        //this.tree = d3.layout.tree()
        //    .nodeSize([this.nodeHeight / 2, this.nodeWidth / 2]);
        var nodes = _this.tree.nodes(_this.root).reverse();
        var links = _this.tree.links(nodes);

        var node = baseSvg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++_this.id);
            });
        node.select("rect.nodeRect").filter(".highlight").attr("class", "nodeRect show");
        var drawNode = _this.drawNode;
        var drawLink = _this.drawLink;
        var nodeEnter = drawNode.createNodes(node);
        var nodeExit = drawNode.exitNodes(node);
        nodeExit.remove();
        nodeEnter.on('click', _this.click);
        drawNode.drawConnectRect.creatRects(nodeEnter);
        drawNode.drawNodeLabel.creatLabels(nodeEnter);
        drawNode.drawPin.createPins(nodeEnter, _this.treeCut);
        drawNode.drawDepthNode.createDepthNodes(nodeEnter);
        drawNode.drawRestNode.createRestNodes(nodeEnter);
        drawNode.drawBar.createBars(node);
        drawLink.showRestLinks(nodeEnter, split_length);
        drawNode.drawHighlightRect.createHighlightRects(nodeEnter);
        _this.highLightNodes(nodeEnter, d);
        var link = baseSvg.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });
        // var nodeAll = node.copy()
        var draggingNode = _this.draggingNode;
        var nodeUpdate = drawNode.updateNodes(node, draggingNode);
        drawNode.drawBar.updateBars(node, _this.split_colors);
        drawNode.drawPin.updatePins(nodeUpdate);
        drawNode.drawDepthNode.updateDepthNodes(nodeUpdate);
        drawNode.drawRestNode.updateRestNode(nodeUpdate);
        var nodeOld = [];
        for (var i = 0; i < node[0].length; i++) {
            if (node[0][i] == nodeEnter[0][i]) {
                node[0][i] = null;
                nodeUpdate[0][i] = null;
            }
        }
        drawNode.drawNodeLabel.updateLabels(node, 0);
        drawNode.drawHighlightRect.updateHighlightRects(node, 0);
        drawNode.drawNodeLabel.updateLabels(nodeEnter, d.level);
        drawNode.drawHighlightRect.updateHighlightRects(nodeEnter, d.level);
        drawLink.updateLinks(link, draggingNode, _this.split_colors, nodeUpdate, _this.nodeWidth - 20, 0);
        drawLink.updateLinks(link, draggingNode, _this.split_colors, nodeEnter, _this.nodeWidth - 20, d.level);
        _this.treeHelper.centerTree(d);
    }

    this.save = function () {
        var source = _this.root;
        var newRoot = {
            "Id": source.Id,
            "Children": [],
            "Documents": source.documents
        };
        var result = new Array();
        var queue = new Array();
        var startPtr = 0;
        var endPtr = 0;
        result[endPtr] = newRoot;
        queue[endPtr++] = source;
        while (startPtr < endPtr) {
            if (queue[startPtr].allChildren) {
                for (var i = 0; i < queue[startPtr].allChildren.length; i++) {
                    var children = {
                        "Id": queue[startPtr].allChildren[i].Id,
                        "Children": [],
                        "Documents": queue[startPtr].allChildren[i].documents
                    }
                    result[startPtr].Children.push(children);
                    result[endPtr] = children;
                    queue[endPtr++] = queue[startPtr].allChildren[i];
                }
            }
            startPtr++;
        }
        return newRoot;
    }

    this.highLightNodes = function (noteEnter, source) {
        // for (var i = 0; i < source.length; i++) {
        //     _this.baseSvg.selectAll("#node" + source[i].Id).selectAll("rect.nodeRect").attr("class", "nodeRect show");
        //     //_this.baseSvg.selectAll("#node" + source[i].Id).selectAll("text.nodeText").style("fill", "#f57c00");
        // }
        //noteEnter.select("rect.nodeRect").filter("highlight").attr("class","nodeRect show");
        if (source) {
            _this.baseSvg.select("#node" + source.Id).select("rect.nodeRect").attr("class", "nodeRect highlight");
        }
    }

    this.highlight = function (source, noClick) {
        _this.baseSvg.selectAll("text.nodeText").style("fill", "rgb(85,85,85)");
        _this.baseSvg.selectAll(".link").attr("class", "link");
        _this.baseSvg.selectAll("rect.nodeRect").attr("class", "nodeRect show");
        for (var i = 0; i < source.length; i++) {
            if (noClick) {
                _this.baseSvg.selectAll("#node" + source[i].Id).selectAll("rect.nodeRect").attr("class", "nodeRect show");
            } else {
                _this.baseSvg.selectAll("#node" + source[i].Id).selectAll("rect.nodeRect").attr("class", "nodeRect show");
                //_this.baseSvg.selectAll("#node" + source[i].Id).selectAll("text.nodeText").style("fill", "#f57c00");
            }
            var temp = source[i];
            /*
             while (temp.parent) {
             _this.baseSvg.selectAll("#link" + temp.Id)
             .attr("class", "link");
             _this.baseSvg.selectAll("#node" + temp.parent.Id)
             .selectAll("rect.nodeRect")
             .attr("class", "nodeRect show");
             temp = temp.parent;
             }
             */
        }
    }
    this.initialNodeDic = function (root) {
        var queue = new Array();
        var startPtr = 0;
        var endPtr = 0;
        queue[endPtr++] = root;
        this.treeNodeDic = [];

        while (startPtr < endPtr) {
            var current = queue[startPtr];
            this.treeNodeDic[current.Id] = current;

            if (current.allChildren != null) {
                for (var i = 0; i < current.allChildren.length; i++) {
                    queue[endPtr++] = current.allChildren[i];
                }
            }
            startPtr++;
        }
    };

    var getClickedNode = function () {
        if (_this.selectArr.length == 1) {
            return _this.selectArr[0];
        } else {
            return false;
        }
    }

    this.addDocument = function (id) {
        var clickedNode = getClickedNode();
        if (clickedNode) {
            clickedNode.documents.push(id);
            return true;
        } else {
            return false;
        }
    }
    function contains(arr, node) {
        for (var i = 0; i < arr.length; i++) {
            if (node == arr[i])
                return true;
        }
        return false;
    }

    this.findSimilarNode = function (ids) {
        var queue = new Array();
        var startPtr = 0;
        var endPtr = 0;
        var maxNode = null;
        var maxFScore = 0;
        queue[endPtr++] = _this.root;
        while (startPtr < endPtr) {
            var current = queue[startPtr];

            var currentIds = current.getAllDescendantId();
            var precision = 0;
            var recall = 0;
            var fScore = 0;

            var count = 0;
            for (var i = 0; i < ids.length; i++) {
                if (contains(currentIds, ids[i])) {
                    count++;
                }
            }
            precision = ids.length ? count / ids.length : 0;
            recall = currentIds.length ? count / currentIds.length : 0;
            fScore = (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;
            if (fScore > maxFScore) {
                maxNode = current;
                maxFScore = fScore;
            }

            if (queue[startPtr].allChildren) {
                for (var i = 0; i < queue[startPtr].allChildren.length; i++) {
                    queue[endPtr++] = queue[startPtr].allChildren[i];
                }
            }
            startPtr++;
        }
        return maxNode;
    }
}

