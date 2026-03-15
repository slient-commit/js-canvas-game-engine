class IsometricUtils {

    /**
     * Convert grid coordinates to screen position
     * @param {number} col - grid column
     * @param {number} row - grid row
     * @param {number} tileW - tile width in pixels
     * @param {number} tileH - tile height in pixels
     * @param {number} height - height level at this tile
     * @param {number} heightStep - pixels per height level
     * @param {Vec2} offset - screen offset for centering
     * @returns {Vec2} screen position (top-center of diamond)
     */
    static toScreen(col, row, tileW, tileH, height, heightStep, offset) {
        var x = (col - row) * (tileW / 2);
        var y = (col + row) * (tileH / 2);
        y -= (height || 0) * (heightStep || 0);
        if (offset) {
            x += offset.X;
            y += offset.Y;
        }
        return new Vec2(x, y);
    }

    /**
     * Convert screen position to grid coordinates (ignores height)
     * @param {number} screenX
     * @param {number} screenY
     * @param {number} tileW
     * @param {number} tileH
     * @param {Vec2} offset
     * @returns {Vec2} grid position (floating point col/row)
     */
    static toGrid(screenX, screenY, tileW, tileH, offset) {
        var sx = screenX;
        var sy = screenY;
        if (offset) {
            sx -= offset.X;
            sy -= offset.Y;
        }
        var col = (sx / (tileW / 2) + sy / (tileH / 2)) / 2;
        var row = (sy / (tileH / 2) - sx / (tileW / 2)) / 2;
        return new Vec2(col, row);
    }

    /**
     * Get the four diamond vertices for a tile at screen position
     * @param {number} screenX - top-center X of diamond
     * @param {number} screenY - top Y of diamond
     * @param {number} tileW
     * @param {number} tileH
     * @returns {Array} [top, right, bottom, left] Vec2 vertices
     */
    static getDiamondVertices(screenX, screenY, tileW, tileH) {
        return [
            new Vec2(screenX, screenY),
            new Vec2(screenX + tileW / 2, screenY + tileH / 2),
            new Vec2(screenX, screenY + tileH),
            new Vec2(screenX - tileW / 2, screenY + tileH / 2)
        ];
    }
}
