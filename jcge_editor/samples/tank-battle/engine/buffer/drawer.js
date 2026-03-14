class Drawer {

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    }

    /**
     * Resize canvas to fill window
     */
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }

    /**
     * Clear the canvas and fill it with a color
     * @param {string} color 
     */
    clearWithColor(color) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw an image from Image object
     * @param {Image} image 
     * @param {double} sx Source Position X
     * @param {double} sy Source Position Y
     * @param {double} sw Source Width
     * @param {double} sh Source Height
     * @param {double} dx Distination Position X
     * @param {double} dy Distination Position Y
     * @param {double} dw Distination Width
     * @param {double} dh Distination Height
     */
    image(image, sx, sy, sw, sh, dx, dy, dw, dh) {
        var ctxTemp = this.ctx;
        image.onload = function() {
            ctxTemp.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
        };
    }

    /**
     * Draw a sprite in position
     * @param {Sprite} sprite 
     * @param {Position} position 
     * @returns bool
     */
    sprite(sprite, position, opacity = 1, camera = null) {
        if (sprite === null || sprite === undefined) {
            console.error('No valid sprite Sheet was found to be drawed');
            return false;
        }

        if (sprite.image === null || sprite.image === undefined) {
            console.error('No valid sprite Sheet image was found to be drawed');
            return false;
        }

        this.ctx.globalAlpha = opacity;
        if (camera !== null) {
            camera.updateMaxPosition();
            if (position.X >= camera.position.X && (position.X + sprite.width) <= camera.maxPosition.X && position.Y >= camera.position.Y && position.Y <= camera.maxPosition.Y) {
                if (camera.addOffset) {
                    this.ctx.drawImage(sprite.image, position.X + camera.offset.X, position.Y + camera.offset.Y);
                    this.ctx.globalAlpha = 1.0;
                    return true;
                }
            }
        }
        this.ctx.drawImage(sprite.image, 0, 0, sprite.image.width, sprite.image.height, position.X, position.Y, sprite.width, sprite.height);
        this.ctx.globalAlpha = 1.0;
        return true;
    }

    /**
     * Draw a text to the canvas
     * @param {string} text 
     * @param {Position} position 
     */
    text(text, position, fontSize = 14, font = 'serif', style = 'normal', color = 'black', opacity = 1, camera = null) {
        this.ctx.font = `${style} ${fontSize}px ${font}`;
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.globalAlpha = opacity;
        let lines = text.split('\n');
        if (camera !== null) {
            camera.updateMaxPosition();
            let size = this.ctx.measureText(text);
            if ((position.X >= camera.position.X && (position.X + (size.width / 2)) < camera.maxPosition.X) && (position.Y - fontSize >= camera.position.Y && position.Y < camera.maxPosition.Y)) {
                if (camera.addOffset) {
                    if (lines.length > 0) {
                        for (var i = 0; i < lines.length; i++)
                            this.ctx.fillText(lines[i], position.X + camera.offset.X, (position.Y + (15 * i)) + camera.offset.Y);
                    } else
                        this.ctx.fillText(text, position.X + camera.offset.X, position.Y + camera.offset.Y);
                    this.ctx.globalAlpha = 1.0;
                    return true;
                }
            }
        }
        if (lines.length > 0) {
            for (var i = 0; i < lines.length; i++)
                this.ctx.fillText(lines[i], position.X, (position.Y + (15 * i)));
        } else
            this.ctx.fillText(text, position.X, position.Y);
        this.ctx.globalAlpha = 1.0;
        return true;
    }

    /**
     * Get a text width
     * @param {String} text 
     * @param {String} fontSize 
     * @param {String} font 
     * @param {String} style 
     * @returns {Float}
     */
    textWidth(text, fontSize = 14, font = 'serif', style = 'normal') {
        this.ctx.font = `${style} ${fontSize}px ${font}`;
        return this.ctx.measureText(text).width;
    }

    /**
     * Draw SpriteSheet animation
     * @param {SpriteSheet} sprite 
     * @param {Position} position 
     * @returns bool
     */
    spriteSheet(sprite, position, opacity = 1, camera = null) {
        if (sprite === null || sprite === undefined) {
            console.error('No valid sprite Sheet was found to be drawed');
            return false;
        }

        if (sprite.image === null || sprite.image === undefined) {
            console.error('No valid sprite Sheet image was found to be drawed');
            return false;
        }
        sprite.update();
        this.ctx.globalAlpha = opacity;
        if (camera !== null) {
            camera.updateMaxPosition();
            if (position.X >= camera.position.X && (position.X + sprite.width) <= camera.maxPosition.X && position.Y >= camera.position.Y && position.Y <= camera.maxPosition.Y) {
                if (camera.addOffset) {
                    this.ctx.drawImage(sprite.image, sprite.frame().X, sprite.frame().Y, sprite.width, sprite.height, position.X + camera.offset.X, position.Y + camera.offset.Y, sprite.width, sprite.height);
                    this.ctx.globalAlpha = 1.0;
                    return true;
                }
            }
        }
        this.ctx.drawImage(sprite.image, sprite.frame().X, sprite.frame().Y, sprite.width, sprite.height, position.X, position.Y, sprite.width, sprite.height);
        this.ctx.globalAlpha = 1.0;
        return true;
    }

    /**
     * Draw a SpriteAtlas region
     * @param {SpriteAtlas} sprite
     * @param {Position} position
     * @param {number} opacity
     * @param {Camera} camera
     * @returns bool
     */
    spriteAtlas(sprite, position, opacity = 1, camera = null) {
        if (!sprite || !sprite.image) return false;
        var r = sprite.getRegion();
        if (!r) return false;
        this.ctx.globalAlpha = opacity;
        if (camera !== null) {
            camera.updateMaxPosition();
            if (position.X >= camera.position.X && (position.X + r.width) <= camera.maxPosition.X && position.Y >= camera.position.Y && position.Y <= camera.maxPosition.Y) {
                if (camera.addOffset) {
                    this.ctx.drawImage(sprite.image, r.x, r.y, r.width, r.height, position.X + camera.offset.X, position.Y + camera.offset.Y, r.width, r.height);
                    this.ctx.globalAlpha = 1.0;
                    return true;
                }
            }
        }
        this.ctx.drawImage(sprite.image, r.x, r.y, r.width, r.height, position.X, position.Y, r.width, r.height);
        this.ctx.globalAlpha = 1.0;
        return true;
    }

    /**
     * Draw Game object sprite, SpriteSheet, or SpriteAtlas
     * @param {GameObject} gameObject
     * @returns bool
     */
    gameObject(gameObject, opacity = 1, camera = null) {
        if (gameObject === null || gameObject === undefined) {
            console.error('No gameObject found to be drawed');
            return false;
        }
        if (gameObject.sprite && gameObject.sprite._isAtlas) {
            this.spriteAtlas(gameObject.sprite, gameObject.position, opacity, camera);
            return true;
        }
        if (!gameObject.hasSimpleSprite) {
            this.spriteSheet(gameObject.sprite, gameObject.position, opacity, camera);
            return true;
        }
        this.sprite(gameObject.sprite, gameObject.position, opacity, camera);
        return true;
    }

    /**
     * Display camera Range as Rectangle
     * @param {Camera} camera 
     * @returns {boolean}
     */
    camera(camera) {
        if (camera === null || camera === undefined) {
            console.error('No camera found to be drawed');
            return false;
        }

        this.ctx.beginPath();
        this.ctx.rect(camera.position.X, camera.position.Y, camera.cameraSize.width, camera.cameraSize.height);
        this.ctx.lineWidth = "6";
        this.ctx.strokeStyle = "red";
        this.ctx.stroke();
        return true;
    }

    /**
     * Draw a line between two points
     * @param {Point} point1 
     * @param {Point} point2 
     * @param {Int} lineWidth 
     * @param {string} color 
     */
    line(point1, point2, lineWidth = 5, color = 'red', opacity = 1, camera = null) {
        // set line stroke and line width
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.globalAlpha = opacity;
        if (camera !== null) {
            camera.updateMaxPosition();
            if (point1.X >= camera.position.X && point1.Y >= camera.position.Y && point2.X <= camera.maxPosition.X && point2.Y <= camera.maxPosition.Y) {
                if (camera.addOffset) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(point1.X + camera.offset.X, point1.Y + camera.offset.Y);
                    this.ctx.lineTo(point2.X + camera.offset.X, point2.Y + camera.offset.Y);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1.0;
                    return true;
                }
            }
            this.ctx.globalAlpha = 1.0;
            return false;
        }
        this.ctx.beginPath();
        this.ctx.moveTo(point1.X, point1.Y);
        this.ctx.lineTo(point2.X, point2.Y);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        return true;
    }

    /**
     * Draw a rectangle
     * @param {Position} position 
     * @param {Size} size 
     * @param {boolean} filled 
     * @param {Int} lineWidth 
     * @param {String} color 
     * @param {Camera} camera 
     */
    rectangle(position, size, filled = true, lineWidth = 5, color = 'red', opacity = 1, camera = null, filter = '') {
        // set line stroke and line width
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.globalAlpha = opacity;
        this.ctx.filter = filter;
        if (camera !== null) {
            camera.updateMaxPosition();
            if (position.X >= camera.position.X && position.Y >= camera.position.Y && position.X <= camera.maxPosition.X && position.Y <= camera.maxPosition.Y) {
                if (camera.addOffset) {
                    if (filled) {
                        this.ctx.fillRect(position.X + camera.offset.X, position.Y + camera.offset.Y, size.width, size.height);
                        this.ctx.globalAlpha = 1.0;
                        this.ctx.filter = 'none';
                        return true;
                    }
                    this.ctx.strokeRect(position.X + camera.offset.X, position.Y + camera.offset.Y, size.width, size.height);
                    this.ctx.globalAlpha = 1.0;
                    this.ctx.filter = 'none';
                    return true;
                }
            }
            this.ctx.globalAlpha = 1.0;
            this.ctx.filter = 'none';
            return false;
        }

        if (filled) {
            this.ctx.fillRect(position.X, position.Y, size.width, size.height);
            this.ctx.globalAlpha = 1.0;
            this.ctx.filter = 'none';
            return true;
        }

        this.ctx.strokeRect(position.X, position.Y, size.width, size.height);
        this.ctx.globalAlpha = 1.0;
        this.ctx.filter = 'none';
        return true;
    }

    /**
     * Draw an arc or a circle
     * @param {Position} position 
     * @param {Int} reduis 
     * @param {Float} startAngele 
     * @param {Float} endAngle 
     * @param {boolean} filled 
     * @param {Int} lineWidth 
     * @param {String} color 
     * @param {Camera} camera 
     * @returns {boolean}
     */
    circle(position, reduis, startAngele = 0, endAngle = -1, filled = true, lineWidth = 5, color = 'red', opacity = 1, camera = null) {
        // set line stroke and line width
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.globalAlpha = opacity;
        if (endAngle === -1) {
            endAngle = 2 * Math.PI;
        }
        if (camera !== null) {
            camera.updateMaxPosition();
            if (position.X >= camera.position.X && position.Y >= camera.position.Y && position.X <= camera.maxPosition.X && position.Y <= camera.maxPosition.Y) {
                if (camera.addOffset) {
                    if (filled) {
                        this.ctx.beginPath();
                        this.ctx.arc(position.X + camera.offset.X, position.Y + camera.offset.Y, reduis, startAngele, endAngle);
                        this.ctx.fill();
                        this.ctx.globalAlpha = 1.0;
                        return true;
                    }

                    this.ctx.beginPath();
                    this.ctx.arc(position.X + camera.offset.X, position.Y + camera.offset.Y, reduis, startAngele, endAngle);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1.0;
                    return true;
                }
            }
            this.ctx.globalAlpha = 1.0;
            return false;
        }

        if (filled) {
            this.ctx.beginPath();
            this.ctx.arc(position.X, position.Y, reduis, startAngele, endAngle);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
            return true;
        }

        this.ctx.beginPath();
        this.ctx.arc(position.X, position.Y, reduis, startAngele, endAngle);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        return true;
    }

    /**
     * Color a gredient Regtangle
     * @param {Position} position 
     * @param {Size} size 
     * @param {Point} startPoint 
     * @param {Point} stopPoint 
     * @param {String} startColor 
     * @param {String} stopColor 
     * @param {Number} opacity 
     * @param {Camera} camera 
     * @returns 
     */
    gradient(position, size, startPoint, stopPoint, startColor = 'red', stopColor = 'green', opacity = 1, camera = null) {
        // set line stroke and line width
        this.ctx.beginPath();
        this.ctx.globalAlpha = opacity;
        var gradient = this.ctx.createLinearGradient(startPoint.X, startPoint.Y, stopPoint.X, stopPoint.Y);
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, stopColor);
        this.ctx.fillStyle = gradient;
        if (camera !== null) {
            camera.updateMaxPosition();
            if (position.X >= camera.position.X && position.Y >= camera.position.Y && position.X <= camera.maxPosition.X && position.Y <= camera.maxPosition.Y) {
                if (camera.addOffset) {
                    this.ctx.fillRect(position.X + camera.offset.X, position.Y + camera.offset.Y, size.width, size.height);
                    this.ctx.globalAlpha = 1.0;
                    return true;
                }
            }
            this.ctx.globalAlpha = 1.0;
            return false;
        }

        this.ctx.fillRect(position.X, position.Y, size.width, size.height);
        this.ctx.globalAlpha = 1.0;
        return true;
    }

    /**
     * Draw a particlet
     * @param {Particle} particle 
     * @param {double} elapsedTime 
     * @returns {boolean}
     */
    particle(particle, elapsedTime = 1) {
        if (particle === null || particle === undefined) {
            console.error('No particle found to be drawed');
            return false;
        }

        particle.update(elapsedTime);
        if (!particle.isDead)
        // this.circle(particle.position, 25, particle.size.width, particle.size.height, true, 1, particle.color.toString(), particle.fade);
            this.rectangle(particle.position, particle.size, true, 1, particle.color.toString(), particle.fade);
        return true;
    }

    /**
     * Draw element
     * @param {Element} element 
     * @returns 
     */
    element(element, opacity = 1, camera = null) {
        if (element === null || element === undefined) {
            console.error('No element found to be drawed');
            return false;
        }

        if (element.sprite && element.sprite._isAtlas) {
            this.spriteAtlas(element.sprite, element.position, opacity, camera);
            return true;
        }

        if (element.sprite instanceof SpriteSheet) {
            this.spriteSheet(element.sprite, element.position, opacity, camera);
            return true;
        }

        if (element.sprite instanceof Sprite) {
            this.sprite(element.sprite, element.position, opacity, camera);
            return true;
        }

        return false;
    }

    /**
     * Draw a sprite rotated around its center
     * @param {Sprite} sprite
     * @param {Vec2} position
     * @param {number} angle - rotation in radians
     * @param {number} opacity
     */
    drawRotated(sprite, position, angle, opacity = 1) {
        if (!sprite || !sprite.image) return false;
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.translate(position.X + sprite.width / 2, position.Y + sprite.height / 2);
        this.ctx.rotate(angle);
        this.ctx.drawImage(sprite.image, -sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);
        this.ctx.restore();
        return true;
    }

    /**
     * Draw a sprite with scaling
     * @param {Sprite} sprite
     * @param {Vec2} position
     * @param {number} scaleX
     * @param {number} scaleY
     * @param {number} opacity
     */
    drawScaled(sprite, position, scaleX, scaleY, opacity = 1) {
        if (!sprite || !sprite.image) return false;
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        this.ctx.translate(position.X + sprite.width / 2, position.Y + sprite.height / 2);
        this.ctx.scale(scaleX, scaleY);
        this.ctx.drawImage(sprite.image, -sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height);
        this.ctx.restore();
        return true;
    }

    /**
     * Draw a sprite flipped horizontally and/or vertically
     * @param {Sprite} sprite
     * @param {Vec2} position
     * @param {boolean} flipX
     * @param {boolean} flipY
     * @param {number} opacity
     */
    drawFlipped(sprite, position, flipX = false, flipY = false, opacity = 1) {
        return this.drawScaled(sprite, position, flipX ? -1 : 1, flipY ? -1 : 1, opacity);
    }
}