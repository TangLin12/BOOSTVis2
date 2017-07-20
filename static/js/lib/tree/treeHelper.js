TreeHelper = function (treeData) {
    var _this = this;
    var currentTransY = 0;

    this.undoDrag = function(target, copyNodes) {
        target.parent.removeChild([target]);
        for (var i = 0; i < copyNodes.length; i++) {
            copyNodes[i].parent.addChild([copyNodes[i]]);
            for (var j = 0; j < copyNodes[i].allChildren.length; j++) {
                copyNodes[i].allChildren[j].parent = copyNodes[i];
            }
        }
    }
    this.joinNode = function (target, arr) {
        var copyNodes = [];
        var originNode = new TreeNode();
        originNode.copy(target);
        var index = arr.indexOf(target);
        if (index > -1) {
            arr.splice(index, 1);
        }
        arr.push(originNode);
        for (var j = 0; j < arr.length; j++) {
            var tmp = new TreeNode();
            tmp.copy(arr[j]);
            copyNodes.push(tmp);
            arr[j].parent.removeChild([arr[j]]);
            arr[j].parent = target;
            treeData.treeCut.pin(arr[j], false);
        }
        target.myChildren = [].concat(arr);
        target.allChildren = [].concat(arr);
        target.documents = [];
        target.update(false);
        d3.select("#node" + target.Id).attr("id", "node" + treeData.id);
        target.Id = treeData.id;
        target.id = ++treeData.id;
        return copyNodes;
    }
    this.mergeChildrenNode = function (a,b) {
        var children = [], document = [];
        children = children.concat(a.allChildren);
        children = children.concat(b.allChildren);
        document = document.concat(a.documents);
        document = document.concat(b.documents);
        for (var i = 0; i < children.length; i++) {
            children[i].parent = a;
        }
        a.allChildren = children;
        a.documents = document;
        b.parent.removeChild([b]);
        b.parent = a;
        a.update(true);      
        return true;
    }

    this.canDraw = function () {
        var tree = treeData.tree;

        //console.log('canDraw : layout', tree);
        var nodes = tree.nodes(treeData.root);
        //console.log('canDraw : nodes', nodes);
        var x1 = Number.MAX_VALUE, x2 = Number.MIN_VALUE, y1 = Number.MAX_VALUE, y2 = Number.MIN_VALUE;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.x < x1) {
                x1 = node.x;
            }
            if (node.x > x2) {
                x2 = node.x;
            }
            if (node.y < y1) {
                y1 = node.y;
            }
            if (node.y > y2) {
                y2 = node.y;
            }
        }

        //console.log('x2', x2, 'x1', x1, 'y2', y2, 'y1', y1);
        //console.log('viewWidth',treeData.viewWidth);
        //console.log('viewHeight', treeData.viewHeight);

        // if (x2 - x1 > treeData.viewWidth - 20 || y2 - y1 > treeData.viewHeight - 50) {
        //    return false;
        // }
        if (x2 - x1 > treeData.viewHeight - treeData.Margin || y2 - y1 > treeData.viewWidth - 20) {
            return false;
        }
        centerX = list_tree_translateY + (x1 + x2) / 2;
        for ( var i = 0; i < nodes.length; i++){
            if( draw_tree_list_now === true && nodes[i].level < 3 ){
                if( ( - nodes[i].x + centerX) < mini_tree_rightmost + 5 ){
                    return false;
                }
            }
        }
        //console.log("candraw:"+nodes.length);
        return true;
    };

    this.centerTree = function (d, type, original_range) {
        var nodes = treeData.tree.nodes(treeData.root);
        var x1 = Number.MAX_VALUE, x2 = Number.MIN_VALUE;
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.x < x1) {
                x1 = node.x;
            }
            if (node.x > x2) {
                x2 = node.x;
            }
        }

        var projection = function (data, accessor, source_range, target_range) {
            var t = d3.scale.linear().domain(source_range).range(target_range);
            data.forEach(function (d) {
                d[accessor] = t(d[accessor]);
            });
            console.log("projection");
        };

        currentTransY = treeData.translateY + (x1 + x2) / 2;
        function teleport(s) {
            if (d) {
                if (type===1) {
                    currentTransY =  x2 - d.x + mini_tree_left_margin - tree_list_padding;
                    mini_tree_rightmost = x2 - x1 + mini_tree_left_margin - tree_list_padding;
                    s//.transition().duration(750)
                        .attr("transform", "translate(" + currentTransY + "," + treeData.translateX + ")rotate(90)")
                        //.transition().duration(2000)
                        .select("#node" + d.Id).select("rect.nodeRect").attr("class", "nodeRect show");
                }
                else{
                    if( type === 2 ){
                        //projection(nodes, "x", [x1, x2], original_range);
                        s
                            .attr("transform", "translate(" + currentTransY + "," + treeData.translateX + ")rotate(90)")
                            .select("#node" + d.Id).select("rect.nodeRect").attr("class", "nodeRect show");
                    }
                    else {
                        s
                            .transition().duration(1000)
                            .attr("transform", "translate(" + currentTransY + "," + treeData.translateX + ")rotate(90)")
                            .transition().duration(2000)
                            .select("#node" + d.Id).select("rect.nodeRect").attr("class", "nodeRect show");
                    }
                }
            }
            else {
                s
                    //.transition().duration(750)
                    .attr("transform", "translate(" + currentTransY + "," + treeData.translateX + ")rotate(90)");
            }
        }
        treeData.baseSvg.call(teleport);
            // .transition()
            // .duration(750)
            // .attr("transform", "translate(" + currentTransY + "," + treeData.translateX + ")rotate(90)");
    };
//never be used
    this.DragListener = function () {
        var dragStarted = false;
        var dragTimer = null;
        var expendTimer = null;
        var selectedNode = null;
        var mergeNode = null;
        var copyNodes = null;
        function updateTempConnector() {
            var data = [];
            var draggingNode = treeData.draggingNode;
            if (draggingNode !== null && selectedNode !== null) {
                // have to flip the source coordinates since we did this for the existing connectors on the original category
                data = [{
                    source: {
                        x: selectedNode.y0 + 40,
                        y: selectedNode.x0
                    },
                    target: {
                        x: draggingNode.y0,
                        y: draggingNode.x0
                    }
                }];
            }
            var link = treeData.baseSvg.selectAll(".templink").data(data);

            link.enter().append("path")
                .attr("class", "templink")
                .attr("d", d3.svg.diagonal())
                .attr('pointer-events', 'none');

            link.attr("d", d3.svg.diagonal());

            link.exit().remove();
        };

        function updateDragList() {
            var data = [];
            var draggingNode = treeData.draggingNode;
            var rect = treeData.baseSvg.selectAll(".dragRect").data(data);
            if (draggingNode !== null && mergeNode !== null) {
                data = [mergeNode];
                rect = treeData.baseSvg.select("#node" + mergeNode.Id).selectAll(".dragRect").data(data);
                
            }
            var rectPanel = rect.enter().append("g");
            rectPanel.append("rect")
                .attr('class', 'dragRect')
                .attr("width", 70)
                .attr("height", 25)
                .attr("y", -90)
                .attr("x", 10)
                .attr('pointer-events', 'mouseover');
            rectPanel.append("rect")
                .attr('class', 'dragRect')
                .attr("width", 70)
                .attr("height", 25)
                .attr("y", -65)
                .attr("x", 10)
                .attr('pointer-events', 'mouseover');
            rectPanel.append("rect")
                .attr('class', 'dragRect')
                .attr("width", 70)
                .attr("height", 25)
                .attr("y", -40)
                .attr("x", 10)
                .attr('pointer-events', 'mouseover');
            rect.exit().remove();
        }
        function startDrag() {
            if (treeData.selectArr && treeData.selectArr.length > 1) {
                var index = treeData.selectArr.indexOf(d);
                if (index > -1) {
                    dragStarted = true;
                } else {
                    dragStarted = false;
                }
            } else {
                dragStarted = true;
            }
        }
        function initiateDrag(d, domNode) {
            if (treeData.selectArr && treeData.selectArr.length > 1) {
                copyNodes = _this.joinNode(d, treeData.selectArr);
            }
            treeData.draggingNode = d;
            d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
            d3.select(domNode).select('.ghostCircle').attr("class", "ghostCircle");
            if (d.myChildren && d.myChildren.length > 0) {
                treeData.treeCut.collapseNodeAndTreeCut(d);
                treeData.update();                                                                                                                                                                                                                                                                         
            }
            treeData.baseSvg.selectAll("g.node").sort(function (a, b) {
                if (a.id !== treeData.draggingNode.id) return 1;
                else return -1;
            });
            treeData.baseSvg.selectAll('path.link').filter(function (d, i) {
                if (d.target.id === treeData.draggingNode.id) {
                    return true;
                }
                return false;
            }).remove();
            dragStarted = null;
        }
        function endDrag(domNode) {
            selectedNode = null;
            mergeNode = null;
            copyNodes = null;
            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
            d3.select(domNode).attr('class', 'node');
            // now restore the mouseover event or we won't be able to drag a 2nd time
            d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
            updateTempConnector();
            if (treeData.draggingNode !== null) {
                treeData.highlight(treeData.selectArr);
                treeData.draggingNode = null;
                treeData.update();
            }
        }

        function expandmyChildren() {
            if (mergeNode.isRest) {
                if (mergeNode.isTop) {
                    _this.treeCut.showBefore(mergeNode.parent);
                } else {
                    if (!_this.treeCut.showMore(mergeNode.parent)) {
                        _this.treeCut.showAfter(mergeNode.parent);
                    }
                }
                treeData.update();
            } else {
                treeData.treeCut.treeCut(mergeNode);
                treeData.update();
            }
            
            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
            d3.select("node" + treeData.draggingNode.Id).select('.ghostCircle').attr("class", "ghostCircle");
        }
        this.overCircle = function (d) {
            if (d.isRest) {
                return;
            }
            selectedNode = d;
            updateTempConnector();
        };
        this.outCircle = function (d) {
            selectedNode = null;
            updateTempConnector();
        };

        this.overLabel = function (d) {
            if (treeData.draggingNode && treeData.draggingNode !== d) {
                mergeNode = d;
                expendTimer = setTimeout(expandmyChildren, 1000);
                //updateDragList();
            }
        };
        this.outLabel = function (d) {
            mergeNode = null;
            clearTimeout(expendTimer);
            expendTimer = null;
            //updateDragList();
        };

        
        this.dragTimerStart = function () {
            dragTimer = setTimeout(startDrag, 200);
        }
        this.dragTimerStop = function () {
            if (dragTimer == null) {
                return;
            }
            clearTimeout(dragTimer);
            dragTimer = null;
        }
        this.dragListener = d3.behavior.drag().on("dragstart", function (d) {
            if (d === treeData.root) {
                return;
            }
            d3.event.sourceEvent.stopPropagation();
            // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
        }).on("drag", function (d) {
            if (d === treeData.root) {
                return;
            }
            if (dragStarted) {
                initiateDrag(d, this);
            }
            if (treeData.draggingNode) {
                d.x0 += d3.event.dy;
                d.y0 += d3.event.dx;
                var node = d3.select(this);
                node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
                updateTempConnector();
            }
        }).on("dragend", function (d) {
            if (d === treeData.root) {
                return;
            }
            dragStarted = false;
            if (selectedNode) {
                treeData.draggingNode.parent.removeChild([treeData.draggingNode]);
                selectedNode.addChild([treeData.draggingNode]);
                treeData.treeCut.treeCut(selectedNode);
                treeData.selectArr = [treeData.draggingNode];
                
            } else if (mergeNode && treeData.draggingNode && _this.mergeChildrenNode(mergeNode, treeData.draggingNode)) {
                treeData.treeCut.treeCut(mergeNode);
                treeData.selectArr = [mergeNode];
            } else if (copyNodes) {
                _this.undoDrag(treeData.draggingNode, copyNodes);
                treeData.treeCut.treeCut(treeData.draggingNode.parent);
                treeData.selectArr = [];
            }         
            endDrag(this);
        });
    }

    this.ZoomListener = function() {
        function zoom() {
            treeData.baseSvg.attr("transform", "translate(" + d3.event.translate[0] + "," + currentTransY + ")");
        }


        // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
        this.zoomListener = d3.behavior.zoom().on("zoom", zoom);
    }
}