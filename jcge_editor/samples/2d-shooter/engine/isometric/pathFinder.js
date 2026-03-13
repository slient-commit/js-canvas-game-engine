class PathFinder {

    /**
     * A* pathfinding on an IsometricMap
     * @param {IsometricMap} map
     * @param {number} startCol
     * @param {number} startRow
     * @param {number} endCol
     * @param {number} endRow
     * @returns {Array} array of {col, row} waypoints (excludes start), empty if no path
     */
    static findPath(map, startCol, startRow, endCol, endRow) {
        if (!map.inBounds(startCol, startRow) || !map.inBounds(endCol, endRow)) return [];
        if (!map.isWalkable(endCol, endRow)) return [];
        if (startCol === endCol && startRow === endRow) return [];

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

        var maxIterations = map.cols * map.rows * 2;
        var iterations = 0;

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            openSet.sort(function(a, b) { return a.f - b.f; });
            var current = openSet.shift();
            var currentKey = current.col + ',' + current.row;

            if (current.col === endCol && current.row === endRow) {
                return PathFinder._reconstructPath(cameFrom, current);
            }

            closedSet[currentKey] = true;

            for (var i = 0; i < dirs.length; i++) {
                var nc = current.col + dirs[i].dc;
                var nr = current.row + dirs[i].dr;
                var neighborKey = nc + ',' + nr;

                if (closedSet[neighborKey]) continue;
                if (!map.canMoveTo(current.col, current.row, nc, nr)) continue;

                var heightDiff = Math.abs(map.getHeight(nc, nr) - map.getHeight(current.col, current.row));
                var moveCost = heightDiff > 0 ? 1.5 : 1.0;
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

    static _reconstructPath(cameFrom, current) {
        var path = [{ col: current.col, row: current.row }];
        var key = current.col + ',' + current.row;
        while (cameFrom[key]) {
            current = cameFrom[key];
            key = current.col + ',' + current.row;
            path.unshift({ col: current.col, row: current.row });
        }
        path.shift(); // remove start position
        return path;
    }
}
