class Collision {

    /**
     * AABB collision between two objects with position and size
     * @param {Vec2} posA
     * @param {Size} sizeA
     * @param {Vec2} posB
     * @param {Size} sizeB
     * @returns {boolean}
     */
    static rectRect(posA, sizeA, posB, sizeB) {
        return posA.X < posB.X + sizeB.width &&
            posA.X + sizeA.width > posB.X &&
            posA.Y < posB.Y + sizeB.height &&
            posA.Y + sizeA.height > posB.Y;
    }

    /**
     * Circle-circle collision
     * @param {Vec2} posA - center of circle A
     * @param {number} radiusA
     * @param {Vec2} posB - center of circle B
     * @param {number} radiusB
     * @returns {boolean}
     */
    static circleCircle(posA, radiusA, posB, radiusB) {
        var dx = posA.X - posB.X;
        var dy = posA.Y - posB.Y;
        var distSq = dx * dx + dy * dy;
        var radSum = radiusA + radiusB;
        return distSq <= radSum * radSum;
    }

    /**
     * Circle-rectangle collision
     * @param {Vec2} circlePos - center of circle
     * @param {number} radius
     * @param {Vec2} rectPos - top-left of rectangle
     * @param {Size} rectSize
     * @returns {boolean}
     */
    static circleRect(circlePos, radius, rectPos, rectSize) {
        var closestX = Math.max(rectPos.X, Math.min(circlePos.X, rectPos.X + rectSize.width));
        var closestY = Math.max(rectPos.Y, Math.min(circlePos.Y, rectPos.Y + rectSize.height));
        var dx = circlePos.X - closestX;
        var dy = circlePos.Y - closestY;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    /**
     * Point inside rectangle
     * @param {Vec2} point
     * @param {Vec2} rectPos
     * @param {Size} rectSize
     * @returns {boolean}
     */
    static pointRect(point, rectPos, rectSize) {
        return point.X >= rectPos.X &&
            point.X <= rectPos.X + rectSize.width &&
            point.Y >= rectPos.Y &&
            point.Y <= rectPos.Y + rectSize.height;
    }

    /**
     * Point inside circle
     * @param {Vec2} point
     * @param {Vec2} circlePos
     * @param {number} radius
     * @returns {boolean}
     */
    static pointCircle(point, circlePos, radius) {
        var dx = point.X - circlePos.X;
        var dy = point.Y - circlePos.Y;
        return (dx * dx + dy * dy) <= (radius * radius);
    }
}
