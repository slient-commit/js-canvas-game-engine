class PathFinder {

    /**
     * A* pathfinding on any grid-based map.
     *
     * Works with both IsometricMap and any rectangular grid object.
     * The grid must have:
     *   - cols, rows (number)
     *   - isWalkable(col, row) → boolean
     * Optionally:
     *   - canMoveTo(fromCol, fromRow, toCol, toRow) → boolean  (overrides isWalkable for neighbors)
     *   - getHeight(col, row) → number  (adds height-based cost)
     *   - inBounds(col, row) → boolean  (defaults to 0..cols-1, 0..rows-1)
     *
     * @param {Object} grid - map object with cols, rows, isWalkable
     * @param {number} startCol
     * @param {number} startRow
     * @param {number} endCol
     * @param {number} endRow
     * @param {Object} [options]
     * @param {boolean} [options.allowStart=false] - allow start tile even if not walkable
     * @param {boolean} [options.allowEnd=false]   - allow end tile even if not walkable
     * @param {boolean} [options.includeStart=true] - include start in returned path
     * @returns {Array} array of {col, row} waypoints, empty if no path
     */
    static findPath(grid, startCol, startRow, endCol, endRow, options) {
        options = options || {};
        var allowStart = options.allowStart || false;
        var allowEnd = options.allowEnd || false;
        var includeStart = options.includeStart !== undefined ? options.includeStart : true;

        var inBounds = grid.inBounds
            ? function(c, r) { return grid.inBounds(c, r); }
            : function(c, r) { return c >= 0 && c < grid.cols && r >= 0 && r < grid.rows; };

        if (!inBounds(startCol, startRow) || !inBounds(endCol, endRow)) return [];
        if (startCol === endCol && startRow === endRow) return includeStart ? [{ col: startCol, row: startRow }] : [];

        // Check end tile walkability
        var endWalkable = grid.isWalkable ? grid.isWalkable(endCol, endRow) : true;
        if (!endWalkable && !allowEnd) return [];

        var openSet = [];
        var closedSet = {};
        var cameFrom = {};
        var gScore = {};
        var fScore = {};

        var startKey = startCol + ',' + startRow;

        gScore[startKey] = 0;
        fScore[startKey] = PathFinder._heuristic(startCol, startRow, endCol, endRow);
        openSet.push({ col: startCol, row: startRow, f: fScore[startKey] });

        // 4-directional neighbors
        var dirs = [
            { dc: 0, dr: -1 },
            { dc: 0, dr: 1 },
            { dc: 1, dr: 0 },
            { dc: -1, dr: 0 }
        ];

        var hasCanMoveTo = typeof grid.canMoveTo === 'function';
        var hasGetHeight = typeof grid.getHeight === 'function';

        var maxIterations = grid.cols * grid.rows * 2;
        var iterations = 0;

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            // Find lowest fScore in open set
            var bestIdx = 0;
            for (var i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[bestIdx].f) bestIdx = i;
            }
            var current = openSet[bestIdx];
            var currentKey = current.col + ',' + current.row;

            if (current.col === endCol && current.row === endRow) {
                return PathFinder._reconstructPath(cameFrom, current, includeStart);
            }

            openSet.splice(bestIdx, 1);
            closedSet[currentKey] = true;

            for (var i = 0; i < dirs.length; i++) {
                var nc = current.col + dirs[i].dc;
                var nr = current.row + dirs[i].dr;
                var neighborKey = nc + ',' + nr;

                if (closedSet[neighborKey]) continue;
                if (!inBounds(nc, nr)) continue;

                // Check if we can move to this neighbor
                var isEnd = (nc === endCol && nr === endRow);
                if (hasCanMoveTo) {
                    if (!grid.canMoveTo(current.col, current.row, nc, nr)) {
                        if (!(isEnd && allowEnd)) continue;
                    }
                } else if (grid.isWalkable) {
                    if (!grid.isWalkable(nc, nr)) {
                        if (!(isEnd && allowEnd)) continue;
                    }
                }

                // Calculate move cost
                var moveCost = 1.0;
                if (hasGetHeight) {
                    var heightDiff = Math.abs(grid.getHeight(nc, nr) - grid.getHeight(current.col, current.row));
                    if (heightDiff > 0) moveCost = 1.5;
                }

                var tentativeG = gScore[currentKey] + moveCost;

                if (gScore[neighborKey] !== undefined && tentativeG >= gScore[neighborKey]) continue;

                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeG;
                fScore[neighborKey] = tentativeG + PathFinder._heuristic(nc, nr, endCol, endRow);

                var inOpen = false;
                for (var j = 0; j < openSet.length; j++) {
                    if (openSet[j].col === nc && openSet[j].row === nr) {
                        openSet[j].f = fScore[neighborKey];
                        inOpen = true;
                        break;
                    }
                }
                if (!inOpen) {
                    openSet.push({ col: nc, row: nr, f: fScore[neighborKey] });
                }
            }
        }

        return [];
    }

    static _heuristic(col1, row1, col2, row2) {
        return Math.abs(col1 - col2) + Math.abs(row1 - row2);
    }

    static _reconstructPath(cameFrom, current, includeStart) {
        var path = [{ col: current.col, row: current.row }];
        var key = current.col + ',' + current.row;
        while (cameFrom[key]) {
            current = cameFrom[key];
            key = current.col + ',' + current.row;
            path.unshift({ col: current.col, row: current.row });
        }
        if (!includeStart) {
            path.shift();
        }
        return path;
    }
}
