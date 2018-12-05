/*!
 * Chart.js
 * https://github.com/avlcodemonkey/Chart.js
 * Version: {{ version }}
 *
 * Copyright 2015 Nick Downie
 * Released under the MIT license
 * https://github.com/nnnick/Chart.js/blob/master/LICENSE.md
 *
 * Copyright 2018 Chris Pittman
 * Released under the MIT license
 * https://github.com/avlcodemonkey/Chart.js/blob/v1x/LICENSE.md
 */
(function(root) {
    'use strict';

    // Global Chart helpers object for utility methods and classes
    var helpers = {};

    // Basic js utility methods
    helpers.each = function(loopable, callback, self) {
        var additionalArgs = Array.prototype.slice.call(arguments, 3);
        // Check to see if null or undefined firstly.
        if (loopable) {
            if (loopable.length === +loopable.length) {
                var i;
                for (i = 0; i < loopable.length; i++) {
                    callback.apply(self, [loopable[i], i].concat(additionalArgs));
                }
            } else {
                for (var item in loopable) {
                    callback.apply(self, [loopable[item], item].concat(additionalArgs));
                }
            }
        }
    };

    helpers.clone = function(obj) {
        var objClone = {};
        helpers.each(obj, function(value, key) {
            if (obj.hasOwnProperty(key)) {
                objClone[key] = value;
            }
        });
        return objClone;
    };

    helpers.extend = function(base) {
        helpers.each(Array.prototype.slice.call(arguments, 1), function(extensionObject) {
            helpers.each(extensionObject, function(value, key) {
                if (extensionObject.hasOwnProperty(key)) {
                    base[key] = value;
                }
            });
        });
        return base;
    };

    helpers.merge = function() {
        // Merge properties in left object over to a shallow clone of object right.
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift({});
        return helpers.extend.apply(null, args);
    };

    helpers.where = function(collection, filterCallback) {
        var filtered = [];
        helpers.each(collection, function(item) {
            if (filterCallback(item)) {
                filtered.push(item);
            }
        });

        return filtered;
    };

    helpers.findNextWhere = function(arrayToSearch, filterCallback, startIndex) {
        // Default to start of the array
        if (!startIndex) {
            startIndex = -1;
        }
        for (var i = startIndex + 1; i < arrayToSearch.length; i++) {
            var currentItem = arrayToSearch[i];
            if (filterCallback(currentItem)) {
                return currentItem;
            }
        }
    };

    helpers.findPreviousWhere = function(arrayToSearch, filterCallback, startIndex) {
        // Default to end of the array
        if (!startIndex) {
            startIndex = arrayToSearch.length;
        }
        for (var i = startIndex - 1; i >= 0; i--) {
            var currentItem = arrayToSearch[i];
            if (filterCallback(currentItem)) {
                return currentItem;
            }
        }
    };

    var inherits = helpers.inherits = function(extensions) {
        // Basic javascript inheritance based on the model created in Backbone.js
        var parent = this;
        var ChartElement = (extensions && extensions.hasOwnProperty('constructor')) ? extensions.constructor : function() { return parent.apply(this, arguments); };

        var Surrogate = function() { this.constructor = ChartElement; };
        Surrogate.prototype = parent.prototype;
        ChartElement.prototype = new Surrogate();

        ChartElement.extend = inherits;

        if (extensions) helpers.extend(ChartElement.prototype, extensions);

        ChartElement.__super__ = parent.prototype;

        return ChartElement;
    };

    helpers.noop = function() { };

    helpers.uid = (function() {
        var id = 0;
        return function() {
            return 'chart-' + id++;
        };
    })();

    // Math methods
    helpers.isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    helpers.max = function(array) {
        return Math.max.apply(Math, array);
    };

    helpers.min = function(array) {
        return Math.min.apply(Math, array);
    };

    helpers.getDecimalPlaces = function(num) {
        if (num % 1 !== 0 && helpers.isNumber(num)) {
            var s = num.toString();
            if (s.indexOf('e-') < 0) {
                // no exponent, e.g. 0.01
                return s.split('.')[1].length;
            }
            else if (s.indexOf('.') < 0) {
                // no decimal point, e.g. 1e-9
                return parseInt(s.split('e-')[1]);
            }
            else {
                // exponent and decimal point, e.g. 1.23e-9
                var parts = s.split('.')[1].split('e-');
                return parts[0].length + parseInt(parts[1]);
            }
        }
        else {
            return 0;
        }
    };

    helpers.toRadians = function(degrees) {
        return degrees * (Math.PI / 180);
    };

    // Gets the angle from vertical upright to the point about a centre.
    helpers.getAngleFromPoint = function(centrePoint, anglePoint) {
        var distanceFromXCenter = anglePoint.x - centrePoint.x,
            distanceFromYCenter = anglePoint.y - centrePoint.y,
            radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
        var angle = Math.PI * 2 + Math.atan2(distanceFromYCenter, distanceFromXCenter);

        // If the segment is in the top left quadrant, we need to add another rotation to the angle
        if (distanceFromXCenter < 0 && distanceFromYCenter < 0) {
            angle += Math.PI * 2;
        }

        return {
            angle: angle,
            distance: radialDistanceFromCenter
        };
    };

    helpers.aliasPixel = function(pixelWidth) {
        return (pixelWidth % 2 === 0) ? 0 : 0.5;
    };

    helpers.splineCurve = function(FirstPoint, MiddlePoint, AfterPoint, t) {
        // Props to Rob Spencer at scaled innovation for his post on splining between points
        // http://scaledinnovation.com/analytics/splines/aboutSplines.html
        var d01 = Math.sqrt(Math.pow(MiddlePoint.x - FirstPoint.x, 2) + Math.pow(MiddlePoint.y - FirstPoint.y, 2)),
            d12 = Math.sqrt(Math.pow(AfterPoint.x - MiddlePoint.x, 2) + Math.pow(AfterPoint.y - MiddlePoint.y, 2)),
            fa = t * d01 / (d01 + d12),// scaling factor for triangle Ta
            fb = t * d12 / (d01 + d12);
        return {
            inner: {
                x: MiddlePoint.x - fa * (AfterPoint.x - FirstPoint.x),
                y: MiddlePoint.y - fa * (AfterPoint.y - FirstPoint.y)
            },
            outer: {
                x: MiddlePoint.x + fb * (AfterPoint.x - FirstPoint.x),
                y: MiddlePoint.y + fb * (AfterPoint.y - FirstPoint.y)
            }
        };
    };

    helpers.calculateScaleRange = function(valuesArray, drawingSize, textSize, startFromZero, integersOnly) {
        // Set a minimum step of two - a point at the top of the graph, and a point at the base
        var minSteps = 2,
            maxSteps = Math.floor(drawingSize / (textSize * 1.5)),
            skipFitting = (minSteps >= maxSteps);

        // Filter out null values since these would min() to zero
        var values = [];
        helpers.each(valuesArray, function(v) {
            v === null || values.push(v);
        });
        var minValue = helpers.min(values),
            maxValue = helpers.max(values);

        // We need some degree of separation here to calculate the scales if all the values are the same
        // Adding/minusing 0.5 will give us a range of 1.
        if (maxValue === minValue) {
            maxValue += 0.5;
            // So we don't end up with a graph with a negative start value if we've said always start from zero
            if (minValue >= 0.5 && !startFromZero) {
                minValue -= 0.5;
            } else {
                // Make up a whole number above the values
                maxValue += 0.5;
            }
        }

        var valueRange = Math.abs(maxValue - minValue),
            rangeOrderOfMagnitude = Math.floor(Math.log(valueRange) / Math.LN10),
            graphMax = Math.ceil(maxValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
            graphMin = (startFromZero) ? 0 : Math.floor(minValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
            graphRange = graphMax - graphMin,
            stepValue = Math.pow(10, rangeOrderOfMagnitude),
            numberOfSteps = Math.round(graphRange / stepValue);

        // If we have more space on the graph we'll use it to give more definition to the data
        while ((numberOfSteps > maxSteps || (numberOfSteps * 2) < maxSteps) && !skipFitting) {
            if (numberOfSteps > maxSteps) {
                stepValue *= 2;
                numberOfSteps = Math.round(graphRange / stepValue);
                // Don't ever deal with a decimal number of steps - cancel fitting and just use the minimum number of steps.
                if (numberOfSteps % 1 !== 0) {
                    skipFitting = true;
                }
            } else {
                // We can fit in double the amount of scale points on the scale
                // If user has declared ints only, and the step value isn't a decimal
                if (integersOnly && rangeOrderOfMagnitude >= 0) {
                    //If the user has said integers only, we need to check that making the scale more granular wouldn't make it a float
                    if (stepValue / 2 % 1 === 0) {
                        stepValue /= 2;
                        numberOfSteps = Math.round(graphRange / stepValue);
                    } else {
                        // If it would make it a float break out of the loop
                        break;
                    }
                } else {
                    // If the scale doesn't have to be an int, make the scale more granular anyway.
                    stepValue /= 2;
                    numberOfSteps = Math.round(graphRange / stepValue);
                }

            }
        }

        if (skipFitting) {
            numberOfSteps = minSteps;
            stepValue = graphRange / numberOfSteps;
        }

        return {
            steps: numberOfSteps,
            stepValue: stepValue,
            min: graphMin,
            max: graphMin + (numberOfSteps * stepValue)
        };
    };

    /* eslint-disable */
    // Blows up lint errors based on the new Function constructor
    // Templating methods
    // Javascript micro templating by John Resig - source at http://ejohn.org/blog/javascript-micro-templating/
    helpers.template = function(templateString, valuesObject) {
        // If templateString is function rather than string-template - call the function for valuesObject
        if (templateString instanceof Function) {
            return templateString(valuesObject);
        }

        var cache = {};
        function tmpl(str, data) {
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            var fn = !/\W/.test(str) ?
                cache[str] = cache[str] :

                // Generate a reusable function that will serve as a template
                // generator (and which will be cached).
                new Function("obj",
                    "var p=[],print=function(){p.push.apply(p,arguments);};" +

                    // Introduce the data as local variables using with(){}
                    "with(obj){p.push('" +

                    // Convert the template into pure JavaScript
                    str
                        .replace(/[\r\t\n]/g, " ")
                        .split("<%").join("\t")
                        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                        .replace(/\t=(.*?)%>/g, "',$1,'")
                        .split("\t").join("');")
                        .split("%>").join("p.push('")
                        .split("\r").join("\\'") +
                    "');}return p.join('');"
                );

            // Provide some basic currying to the user
            return data ? fn(data) : fn;
        }
        return tmpl(templateString, valuesObject);
    };
    /* eslint-enable */

    // DOM methods
    helpers.getRelativePosition = function(evt) {
        var mouseX, mouseY;
        var e = evt.originalEvent || evt,
            canvas = evt.currentTarget || evt.srcElement,
            boundingRect = canvas.getBoundingClientRect();

        if (e.touches) {
            mouseX = e.touches[0].clientX - boundingRect.left;
            mouseY = e.touches[0].clientY - boundingRect.top;

        } else {
            mouseX = e.clientX - boundingRect.left;
            mouseY = e.clientY - boundingRect.top;
        }

        return {
            x: mouseX,
            y: mouseY
        };
    };

    helpers.bindEvents = function(chartInstance, arrayOfEvents, handler) {
        // Create the events object if it's not already present
        if (!chartInstance.events) chartInstance.events = {};

        helpers.each(arrayOfEvents, function(eventName) {
            chartInstance.events[eventName] = function() {
                handler.apply(chartInstance, arguments);
            };
            chartInstance.chart.canvas.addEventListener(eventName, chartInstance.events[eventName]);
        });
    };

    helpers.unbindEvents = function(chartInstance, arrayOfEvents) {
        helpers.each(arrayOfEvents, function(handler, eventName) {
            chartInstance.chart.canvas.removeEventListener(eventName, handler);
        });
        window && arrayOfEvents['windowResize'] && window.removeEventListener('resize', arrayOfEvents['windowResize']);
    };

    helpers.getMaximumWidth = function(domNode) {
        var container = domNode.parentNode,
            padding = parseInt(helpers.getStyle(container, 'padding-left')) + parseInt(helpers.getStyle(container, 'padding-right'));
        return container ? container.clientWidth - padding : 0;
    };

    helpers.getMaximumHeight = function(domNode) {
        var container = domNode.parentNode,
            padding = parseInt(helpers.getStyle(container, 'padding-bottom')) + parseInt(helpers.getStyle(container, 'padding-top'));
        return container ? container.clientHeight - padding : 0;
    };

    helpers.getStyle = function(el, property) {
        return document.defaultView.getComputedStyle(el, null).getPropertyValue(property);
    };

    helpers.retinaScale = function(chart) {
        var ctx = chart.ctx,
            width = chart.canvas.width,
            height = chart.canvas.height;

        if (window.devicePixelRatio) {
            ctx.canvas.style.width = width + 'px';
            ctx.canvas.style.height = height + 'px';
            ctx.canvas.height = height * window.devicePixelRatio;
            ctx.canvas.width = width * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
    };

    // Canvas methods
    helpers.clear = function(chart) {
        chart.ctx.clearRect(0, 0, chart.width, chart.height);
    };

    helpers.fontString = function(pixelSize, fontStyle, fontFamily) {
        return fontStyle + ' ' + pixelSize + 'px ' + fontFamily;
    };

    helpers.longestText = function(ctx, font, arrayOfStrings) {
        ctx.font = font;
        var longest = 0;
        helpers.each(arrayOfStrings, function(string) {
            var textWidth = ctx.measureText(string).width;
            longest = (textWidth > longest) ? textWidth : longest;
        });
        return longest;
    };

    helpers.drawRoundedRectangle = function(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    root.ChartHelpers = helpers;
}(this));