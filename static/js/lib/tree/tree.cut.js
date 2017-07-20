var TreeCut = function (tree) {
    var _this = this;

    var pinArray = new Array();
    var clickQueue = new Array();
    clickQueue.insertAt = function(index, obj) {
        this.splice(index, 0, obj);
    }
    clickQueue.removeAt = function(index) {
        this.splice(index, 1);
    }

    var inPath = function(source, item) {
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
    }

    var updateBeforeAfterCountField = function (source) {
        source.beforeList = new Array();
        for (var i = source.window.x - 1; i >= 0; i--) {
            if (source.myChildren.indexOf(source.allChildren[i]) < 0) {
                source.beforeList.push(source.allChildren[i]);
            }
        }
        source.afterList = new Array();
        for (var i = source.window.y; i < source.allChildren.length; i++) {
            if (source.myChildren.indexOf(source.allChildren[i]) < 0) {
                source.afterList.push(source.allChildren[i]);
            }
        }
    }

    var updateHasAfterContField = function (source) {
        source.beforeList = new Array();
        source.afterList = new Array();
        for (var i = 0; i < source.allChildren.length; i++) {
            if (source.myChildren.indexOf(source.allChildren[i]) < 0) {
                source.afterList.push(source.allChildren[i]);
            }
        }
    }

    var fromRestTomyChildren = function (node) {
        if (node.parent.allChildren.indexOf(node) < 0) {
            return false;
        }
        if (node.parent.myChildren.indexOf(node) < 0) {
            node.parent.myChildren.push(node);
            updateHasAfterContField(node.parent);
            return true;
        } else {
            return false;
        }
    }

    var frommyChildrenToRest = function(node) {
        var id = node.parent.myChildren.indexOf(node);
        if (id >= 0) {
            node.parent.myChildren.splice(id, 1);
            updateHasAfterContField(node.parent);
            return true;
        } else {
            return false;
        }
    }

    var drawSingleNode = function(source) {
        var node = source;
        var drawArr = [];
        while (node != null) {
            if (node.parent != null && fromRestTomyChildren(node)) {
                drawArr.push(node);
                node = node.parent;
            } else {
                break;
            }
        }
        if (tree.treeHelper.canDraw()) {
            return true;
        } else {
            for (var i = 0; i < drawArr.length; i++) {
                frommyChildrenToRest(drawArr[i]);
            }
            return false;
        }
    }

   

    var searchUpY = function (source) {
        for (var y = source.window.y; y < source.allChildren.length; y++) {
            if (source.myChildren.indexOf(source.allChildren[y]) < 0) {
                var node = source.allChildren[y];
                fromRestTomyChildren(node);
                if (!tree.treeHelper.canDraw()) {
                    frommyChildrenToRest(node);
                    break;
                }
            }
            source.window.y = y + 1;
        }
    }

    var searchDownX = function (source) {
        for (var x = source.window.x - 1; x >= 0; x--) {
            if (source.myChildren.indexOf(source.allChildren[x]) < 0) {
                var node = source.allChildren[x];
                fromRestTomyChildren(node);

                if (!tree.treeHelper.canDraw()) {
                    frommyChildrenToRest(node);
                    break;
                }
            }
            source.window.x = x;
        }
    }

    var drawmyChildren = function (source) {
        source.window.x = 0;
        source.window.y = 0;
        searchUpY(source);
        //for (var i = source.window.x; i < source.allChildren.length; i++) {
        //    if (source.myChildren.indexOf(source.allChildren[i]) < 0) {
        //        var node = source.allChildren[i];
        //        fromRestTomyChildren(node);
        //        if (!category.treeHelper.canDraw()) {
        //            frommyChildrenToRest(node);
        //            break;
        //        }
        //    }
        //    source.window.y = i;
        //}
    }

    var drawNodeAsMuchAsPosible = function(source) {
        var node = source;
        if (node != null) {
            node = node.parent;
        }
        while (node != null) {
            drawmyChildren(node);
            node = node.parent;
        }
    }

    this._collapse = function (d, max_level) {
        if (d.level > max_level) {
            d.myChildren = new Array();
        }
        //d.myChildren = new Array();
        if (d.allChildren.length > 0) {
            // comments from Changjian, there may be a bug because max_level have not been passed in this funcion.. 2017/7/20
            d.allChildren.forEach(_this._collapse);
            //test added by Changjian, 2017/7/20
            // for( var i=0; i<d.allChildren.length; i++ ){
            //     _this._collapse(d.allChildren[i], max_level);
            // }
        }
    }

    this.initialUndefinedAndNullField = function (d) {
        if (!d.myChildren) {
            d.myChildren = new Array();
        }
        if (!d.allChildren) {
            d.allChildren = new Array();
        }
        if (!d.window) {
            d.window = {};
        }
        if (!d.window.x) {
            d.window.x = 0;
        }
        if (!d.window.y) {
            d.window.y = 0;
        }
        if (!d.beforeList) {
            d.beforeList = new Array();
        }
        if (!d.afterList) {
            d.afterList = new Array();
        }
        d.allChildren.forEach(_this.initialUndefinedAndNullField);
    }

    var drawPin = function() {
        //console.log('pinArray.length', pinArray.length);
        for (var i = 0; i < pinArray.length; i++) {
            drawSingleNode(pinArray[i]);
        }
    }

    var treeCutGeneral = function () {
        _this._collapse(tree.root, 2);
        drawPin();

        //console.log('clickQueue.length', clickQueue.length);

        var nodeNotDrawn = [];

        for (var i = 0; i < clickQueue.length; i++) {
            if (!drawSingleNode(clickQueue[i].node)) {
                nodeNotDrawn.push(clickQueue[i]);
                //clickQueue.splice(i);
                //break;
            }
        }

        if (nodeNotDrawn.length == 0) {
            drawmyChildren(tree.root);
        }

        for (var i = 0; i < nodeNotDrawn.length; i++) {
            if (nodeNotDrawn[i].drawChildren) {
                drawmyChildren(nodeNotDrawn[i].node);
            }
            drawNodeAsMuchAsPosible(nodeNotDrawn[i].node);
        }

        //for (var i = 0; i < clickQueue.length; i++) {
        //    if (!drawSingleNode(clickQueue[i].node)) {
        //        clickQueue.splice(i);
        //        break;
        //    }
        //}
        //
        //if (clickQueue.length == 0) {
        //    drawmyChildren(tree.root);
        //}
        //
        //for (var i = 0; i < clickQueue.length; i++) {
        //    if (clickQueue[i].drawChildren)
        //        drawmyChildren(clickQueue[i].node);
        //    drawNodeAsMuchAsPosible(clickQueue[i].node);
        //}
    }

    clickQueue.removeRedundantNodes = function(source) {
        for (var i = this.length - 1; i >= 1; i--) {
            if (inPath(source, this[i].node)) {
                this.removeAt(i);
            }
        }
    }
    
    //展开某个节点的时候调用
    this.treeCut = function(source, selectionArr, pin) {
        this.initialUndefinedAndNullField(tree.root);
        if (source) {
            _this.setClickQueue(selectionArr, pin);
            clickQueue.insertAt(0, {
                node: source,
                drawChildren: true
            });
            clickQueue.removeRedundantNodes(source);
            clickQueue.splice(3);
            if (pin) {
                for (var i = 0 ;i < queue.length; i ++) {
                    this.pin(queue[i]);
                }
            }
        }
        //if (source.allChildren.length > 0) {
        treeCutGeneral();
        //}
    }

    this.setClickQueue = function(queue, pin) {
        if (queue) {
            clickQueue.splice(0);
            for (var i = 0; i < queue.length; i ++) {
                clickQueue.push(queue[i]);
            }
        }
    }

    //收缩某个节点的时候调用
    this.collapseNodeAndTreeCut = function (source) {
        this.initialUndefinedAndNullField(tree.root);
        if (source) {
            clickQueue.insertAt(0, {
                node: source,
                drawChildren: false
            });
            clickQueue.removeRedundantNodes(source);
            clickQueue.splice(3);
        }
        treeCutGeneral();
    }

    var showMoreTreeCut = function (source, drawNodeSelector) {
        _this.initialUndefinedAndNullField(tree.root);
        clickQueue.insertAt(0, { node: source, drawChildren: true });
        clickQueue.removeRedundantNodes(source);
        _this._collapse(tree.root);
        drawPin();
        drawSingleNode(clickQueue[0].node);
        drawNodeSelector(clickQueue[0].node);
        
        drawNodeAsMuchAsPosible(clickQueue[0].node);
        for (var i = 1; i < clickQueue.length; i++) {
            if (!drawSingleNode(clickQueue[i].node)) {
                clickQueue.splice(i);
                break;
            }
        }
        for (var i = 1; i < clickQueue.length; i++) {
            //drawmyChildrenAndClear(clickQueue[i]);
            if (clickQueue[i].drawChildren)
                drawmyChildren(clickQueue[i].node);
            drawNodeAsMuchAsPosible(clickQueue[i].node);
        }
        updateBeforeAfterCountField(source);
    }

    //点击圆点展开更多的时候调用
    this.showMore = function (source) {
        showMoreTreeCut(source, drawmyChildren);
        //this.showAfter(source);
    }

    //显示后一页的时候调用
    this.showAfter = function(source) {
        
        var drawAfterChildren = function (source) {
            source.window.x = source.window.y;
            if (source.window.x < 0) {
                source.window.x = 0;
            }
            if (source.window.x > source.allChildren.length) {
                source.window.x = source.allChildren.length;
            }
            source.window.y = source.window.x;
            //search y.
            searchUpY(source);
            //if y is largest, then search x.
            if (source.window.y == source.allChildren.length) {
                searchDownX(source);
            }
        }
        showMoreTreeCut(source, drawAfterChildren);

    }

    //显示前一页的时候调用
    this.showBefore = function(source) {
        var drawBeforeChildren = function (source) {
            source.window.y = source.window.x;
            if (source.window.y < 0) {
                source.window.y = 0;
            }
            if (source.window.y > source.allChildren.length) {
                source.window.y = source.allChildren.length;
            }
            source.window.x = source.window.y;
            searchDownX(source);
            if (source.window.x == 0) {
                searchUpY(source);
            }
        }
        showMoreTreeCut(source, drawBeforeChildren);
    }

    this.pin = function (source, add) {
        this.initialUndefinedAndNullField(tree.root);
        if (add) {
            if (pinArray.indexOf(source) < 0) {
                pinArray.push(source);
            }
        } else {
            for (var i = pinArray.length - 1; i >= 0; i--) {
                if (source == pinArray[i]) {
                    pinArray.splice(i, 1);
                }
            }
        }
    }
}