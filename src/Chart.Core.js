(function(root, helpers) {
    'use strict';

    var previous = root.Chart;

    var computeDimension = function(element, dimension) {
        if (element['offset' + dimension]) {
            return element['offset' + dimension];
        } else {
            return document.defaultView.getComputedStyle(element).getPropertyValue(dimension);
        }
    };

    // Occupy the global variable of Chart, and create a simple base class
    var Chart = function(context) {
        this.canvas = context.canvas;
        this.ctx = context;
        this.width = computeDimension(context.canvas, 'Width') || context.canvas.width;
        this.height = computeDimension(context.canvas, 'Height') || context.canvas.height;
        this.aspectRatio = this.width / this.height;
        // High pixel density displays - multiply the size of the canvas height/width by the device pixel ratio, then scale.
        helpers.retinaScale(this);

        return this;
    };

    // Globally expose the defaults to allow for user updating/changing
    Chart.defaults = {
        global: {
            // Boolean - If we should show the scale at all
            showScale: true,

            // Boolean - If we want to override with a hard coded scale
            scaleOverride: false,

            // ** Required if scaleOverride is true **
            // Number - The number of steps in a hard coded scale
            scaleSteps: null,
            // Number - The value jump in the hard coded scale
            scaleStepWidth: null,
            // Number - The scale starting value
            scaleStartValue: null,

            // String - Colour of the scale line
            scaleLineColor: 'rgba(0,0,0,.1)',

            // Number - Pixel width of the scale line
            scaleLineWidth: 1,

            // Boolean - Whether to show labels on the scale
            scaleShowLabels: true,

            // Boolean or a positive integer denoting number of labels to be shown on x axis
            showXLabels: true,

            // Interpolated JS string - can access value
            scaleLabel: '<%=value%>',

            // Boolean - Whether the scale should stick to integers, and not show any floats even if drawing space is there
            scaleIntegersOnly: true,

            // Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
            scaleBeginAtZero: false,

            // String - Scale label font declaration for the scale label
            scaleFontFamily: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

            // Number - Scale label font size in pixels
            scaleFontSize: 12,

            // String - Scale label font weight style
            scaleFontStyle: 'normal',

            // String - Scale label font colour
            scaleFontColor: '#666',

            // Boolean - whether or not the chart should be responsive and resize when the browser does.
            responsive: true,

            // Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
            maintainAspectRatio: false,

            // Boolean - Determines whether to draw tooltips on the canvas or not - attaches events to touchmove & mousemove
            showTooltips: true,

            // Boolean - Determines whether to draw built-in tooltip or call custom tooltip function
            customTooltips: false,

            // Array - Array of string names to attach tooltip events
            tooltipEvents: ['mousemove', 'touchstart', 'touchmove', 'mouseout'],

            // String - Tooltip background colour
            tooltipFillColor: 'rgba(0,0,0,0.8)',

            // String - Tooltip label font declaration for the scale label
            tooltipFontFamily: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

            // Number - Tooltip label font size in pixels
            tooltipFontSize: 12,

            // String - Tooltip font weight style
            tooltipFontStyle: 'normal',

            // String - Tooltip label font colour
            tooltipFontColor: '#fff',

            // String - Tooltip title font declaration for the scale label
            tooltipTitleFontFamily: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

            // Number - Tooltip title font size in pixels
            tooltipTitleFontSize: 14,

            // String - Tooltip title font weight style
            tooltipTitleFontStyle: 'bold',

            // String - Tooltip title font colour
            tooltipTitleFontColor: '#fff',

            // String - Tooltip title template
            tooltipTitleTemplate: '<%= label%>',

            // Number - pixel width of padding around tooltip text
            tooltipYPadding: 6,

            // Number - pixel width of padding around tooltip text
            tooltipXPadding: 6,

            // Number - Size of the caret on the tooltip
            tooltipCaretSize: 8,

            // Number - Pixel radius of the tooltip border
            tooltipCornerRadius: 6,

            // Number - Pixel offset from point x to tooltip edge
            tooltipXOffset: 10,

            // String - Template string for single tooltips
            tooltipTemplate: '<%if (label){%><%=label%>: <%}%><%= value %>',

            // String - Template string for single tooltips
            multiTooltipTemplate: '<%= datasetLabel %>: <%= value %>',

            // String - Colour behind the legend colour block
            multiTooltipKeyBackground: '#fff',

            // Array - A list of colors to use as the defaults
            segmentColorDefault: ['#A6CEE3', '#1F78B4', '#B2DF8A', '#33A02C', '#FB9A99', '#E31A1C', '#FDBF6F', '#FF7F00', '#CAB2D6', '#6A3D9A', '#B4B482', '#B15928'],

            // Array - A list of highlight colors to use as the defaults
            segmentHighlightColorDefaults: ['#CEF6FF', '#47A0DC', '#DAFFB2', '#5BC854', '#FFC2C1', '#FF4244', '#FFE797', '#FFA728', '#F2DAFE', '#9265C2', '#DCDCAA', '#D98150'],
        }
    };

    // Create a dictionary of chart types, to allow for extension of existing types
    Chart.types = {};


    //Store a reference to each instance - allowing us to globally resize chart instances on window resize.
    //Destroy method on the chart will remove the instance of the chart from this reference.
    Chart.instances = {};

    Chart.Type = function(data, options, chart) {
        this.options = options;
        this.chart = chart;
        this.id = uid();
        //Add the chart instance to the global namespace
        Chart.instances[this.id] = this;

        // Initialize is always called when a chart type is created
        // By default it is a no op, but it should be extended
        if (options.responsive) {
            this.resize();
        }
        this.initialize.call(this, data);
    };

    // Core methods that'll be a part of every chart type
    helpers.extend(Chart.Type.prototype, {
        initialize: function() {
            return this;
        },

        clear: function() {
            helpers.clear(this.chart);
            return this;
        },

        resize: function(callback) {
            var canvas = this.chart.canvas,
                newWidth = helpers.getMaximumWidth(this.chart.canvas),
                newHeight = this.options.maintainAspectRatio ? newWidth / this.chart.aspectRatio : helpers.getMaximumHeight(this.chart.canvas);

            canvas.width = this.chart.width = newWidth;
            canvas.height = this.chart.height = newHeight;

            helpers.retinaScale(this.chart);

            if (typeof callback === 'function') {
                callback.apply(this, Array.prototype.slice.call(arguments, 1));
            }
            return this;
        },

        reflow: helpers.noop,

        render: function(reflow) {
            if (reflow) {
                this.reflow();
            }
            this.draw();
            return this;
        },

        generateLegend: function() {
            return helpers.template(this.options.legendTemplate, this);
        },

        destroy: function() {
            this.clear();
            helpers.unbindEvents(this, this.events);
            var canvas = this.chart.canvas;

            // Reset canvas height/width attributes starts a fresh with the canvas context
            canvas.width = this.chart.width;
            canvas.height = this.chart.height;
            canvas.style.removeProperty('width');
            canvas.style.removeProperty('height');
        },

        showTooltip: function(chartElements) {
            // Only redraw the chart if we've actually changed what we're hovering on.
            if (typeof this.activeElements === 'undefined') {
                this.activeElements = [];
            }

            var isChanged = (function(elements) {
                var changed = false;

                if (elements.length !== this.activeElements.length) {
                    changed = true;
                    return changed;
                }

                helpers.each(elements, function(element, index) {
                    if (element !== this.activeElements[index]) {
                        changed = true;
                    }
                }, this);
                return changed;
            }).call(this, chartElements);

            if (!isChanged) {
                return;
            }

            this.activeElements = chartElements;
            this.draw();
            if (this.options.customTooltips) {
                this.options.customTooltips(false);
            }
            if (chartElements.length > 0) {
                // If we have multiple datasets, show a MultiTooltip for all of the data points at that index
                if (this.datasets && this.datasets.length > 1) {
                    var dataArray,
                        dataIndex;

                    for (var i = this.datasets.length - 1; i >= 0; i--) {
                        dataArray = this.datasets[i].points || this.datasets[i].bars || this.datasets[i].segments;
                        dataIndex = dataArray.indexOf(chartElements[0]);
                        if (dataIndex !== -1) {
                            break;
                        }
                    }
                    var tooltipLabels = [],
                        tooltipColors = [],
                        medianPosition = (function() {
                            var elements = [],
                                dataCollection,
                                xPositions = [],
                                yPositions = [],
                                xMax,
                                yMax,
                                xMin,
                                yMin;
                            helpers.each(this.datasets, function(dataset) {
                                dataCollection = dataset.points || dataset.bars || dataset.segments;
                                if (dataCollection[dataIndex] && dataCollection[dataIndex].hasValue()) {
                                    elements.push(dataCollection[dataIndex]);
                                }
                            });

                            helpers.each(elements, function(element) {
                                xPositions.push(element.x);
                                yPositions.push(element.y);

                                // Include any colour information about the element
                                tooltipLabels.push(helpers.template(this.options.multiTooltipTemplate, element));
                                tooltipColors.push({
                                    fill: element._saved.fillColor || element.fillColor,
                                    stroke: element._saved.strokeColor || element.strokeColor
                                });

                            }, this);

                            yMin = helpers.min(yPositions);
                            yMax = helpers.max(yPositions);
                            xMin = helpers.min(xPositions);
                            xMax = helpers.max(xPositions);

                            return {
                                x: (xMin > this.chart.width / 2) ? xMin : xMax,
                                y: (yMin + yMax) / 2
                            };
                        }).call(this, dataIndex);

                    new Chart.MultiTooltip({
                        x: medianPosition.x,
                        y: medianPosition.y,
                        xPadding: this.options.tooltipXPadding,
                        yPadding: this.options.tooltipYPadding,
                        xOffset: this.options.tooltipXOffset,
                        fillColor: this.options.tooltipFillColor,
                        textColor: this.options.tooltipFontColor,
                        fontFamily: this.options.tooltipFontFamily,
                        fontStyle: this.options.tooltipFontStyle,
                        fontSize: this.options.tooltipFontSize,
                        titleTextColor: this.options.tooltipTitleFontColor,
                        titleFontFamily: this.options.tooltipTitleFontFamily,
                        titleFontStyle: this.options.tooltipTitleFontStyle,
                        titleFontSize: this.options.tooltipTitleFontSize,
                        cornerRadius: this.options.tooltipCornerRadius,
                        labels: tooltipLabels,
                        legendColors: tooltipColors,
                        legendColorBackground: this.options.multiTooltipKeyBackground,
                        title: helpers.template(this.options.tooltipTitleTemplate, chartElements[0]),
                        chart: this.chart,
                        ctx: this.chart.ctx,
                        custom: this.options.customTooltips
                    }).draw();
                } else {
                    helpers.each(chartElements, function(element) {
                        var tooltipPosition = element.tooltipPosition();
                        new Chart.Tooltip({
                            x: Math.round(tooltipPosition.x),
                            y: Math.round(tooltipPosition.y),
                            xPadding: this.options.tooltipXPadding,
                            yPadding: this.options.tooltipYPadding,
                            fillColor: this.options.tooltipFillColor,
                            textColor: this.options.tooltipFontColor,
                            fontFamily: this.options.tooltipFontFamily,
                            fontStyle: this.options.tooltipFontStyle,
                            fontSize: this.options.tooltipFontSize,
                            caretHeight: this.options.tooltipCaretSize,
                            cornerRadius: this.options.tooltipCornerRadius,
                            text: helpers.template(this.options.tooltipTemplate, element),
                            chart: this.chart,
                            custom: this.options.customTooltips
                        }).draw();
                    }, this);
                }
            }
            return this;
        },

        toBase64Image: function() {
            return this.chart.canvas.toDataURL.apply(this.chart.canvas, arguments);
        }
    });

    Chart.Type.extend = function(extensions) {
        var parent = this;

        var ChartType = function() {
            return parent.apply(this, arguments);
        };

        // Copy the prototype object of the this class
        ChartType.prototype = helpers.clone(parent.prototype);
        // Now overwrite some of the properties in the base class with the new extensions
        helpers.extend(ChartType.prototype, extensions);

        ChartType.extend = Chart.Type.extend;

        if (extensions.name || parent.prototype.name) {
            var chartName = extensions.name || parent.prototype.name;
            // Assign any potential default values of the new chart type
            // If none are defined, we'll use a clone of the chart type this is being extended from.
            // I.e. if we extend a line chart, we'll use the defaults from the line chart if our new chart
            // doesn't define some defaults of their own.

            var baseDefaults = (Chart.defaults[parent.prototype.name]) ? helpers.clone(Chart.defaults[parent.prototype.name]) : {};
            Chart.defaults[chartName] = helpers.extend(baseDefaults, extensions.defaults);
            Chart.types[chartName] = ChartType;

            // Register this new chart type in the Chart prototype
            Chart.prototype[chartName] = function(data, options) {
                var config = helpers.merge(Chart.defaults.global, Chart.defaults[chartName], options || {});
                return new ChartType(data, config, this);
            };
        } else {
            root.console.warn('Name not provided for this chart, so it hasnt been registered');
        }
        return parent;
    };

    Chart.Element = function(configuration) {
        helpers.extend(this, configuration);
        this.initialize.apply(this, arguments);
        this.save();
    };

    helpers.extend(Chart.Element.prototype, {
        initialize: function() { },
        restore: function(props) {
            if (!props) {
                helpers.extend(this, this._saved);
            } else {
                helpers.each(props, function(key) {
                    this[key] = this._saved[key];
                }, this);
            }
            return this;
        },
        save: function() {
            this._saved = helpers.clone(this);
            delete this._saved._saved;
            return this;
        },
        update: function(newProps) {
            helpers.each(newProps, function(value, key) {
                this._saved[key] = this[key];
                this[key] = value;
            }, this);
            return this;
        },
        transition: function(props, ease) {
            helpers.each(props, function(value, key) {
                this[key] = ((value - this._saved[key]) * ease) + this._saved[key];
            }, this);
            return this;
        },
        tooltipPosition: function() {
            return {
                x: this.x,
                y: this.y
            };
        },
        hasValue: function() {
            return helpers.isNumber(this.value);
        }
    });

    Chart.Element.extend = helpers.inherits;

    Chart.Point = Chart.Element.extend({
        inRange: function(chartX, chartY) {
            return ((Math.pow(chartX - this.x, 2) + Math.pow(chartY - this.y, 2)) < Math.pow(this.hitDetectionRadius + this.radius, 2));
        },
        draw: function() {
            var ctx = this.ctx;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.closePath();

            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;
            ctx.fillStyle = this.fillColor;
            ctx.fill();
            ctx.stroke();
        }
    });

    Chart.Arc = Chart.Element.extend({
        inRange: function(chartX, chartY) {
            var pointRelativePosition = helpers.getAngleFromPoint(this, {
                x: chartX,
                y: chartY
            });

            // Normalize all angles to 0 - 2*PI (0 - 360°)
            var pointRelativeAngle = pointRelativePosition.angle % (Math.PI * 2),
                startAngle = (Math.PI * 2 + this.startAngle) % (Math.PI * 2),
                endAngle = (Math.PI * 2 + this.endAngle) % (Math.PI * 2) || 360;

            // Calculate wether the pointRelativeAngle is between the start and the end angle
            var betweenAngles = (endAngle < startAngle) ?
                pointRelativeAngle <= endAngle || pointRelativeAngle >= startAngle :
                pointRelativeAngle >= startAngle && pointRelativeAngle <= endAngle;

            // Check if within the range of the open/close angle
            var withinRadius = (pointRelativePosition.distance >= this.innerRadius && pointRelativePosition.distance <= this.outerRadius);

            // Ensure within the outside of the arc centre, but inside arc outer
            return (betweenAngles && withinRadius);
        },
        tooltipPosition: function() {
            var centreAngle = this.startAngle + ((this.endAngle - this.startAngle) / 2),
                rangeFromCentre = (this.outerRadius - this.innerRadius) / 2 + this.innerRadius;
            return {
                x: this.x + (Math.cos(centreAngle) * rangeFromCentre),
                y: this.y + (Math.sin(centreAngle) * rangeFromCentre)
            };
        },
        draw: function() {
            var ctx = this.ctx;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.outerRadius < 0 ? 0 : this.outerRadius, this.startAngle, this.endAngle);
            ctx.arc(this.x, this.y, this.innerRadius < 0 ? 0 : this.innerRadius, this.endAngle, this.startAngle, true);
            ctx.closePath();

            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;
            ctx.fillStyle = this.fillColor;
            ctx.fill();
            ctx.lineJoin = 'bevel';

            if (this.showStroke) {
                ctx.stroke();
            }
        }
    });

    Chart.Rectangle = Chart.Element.extend({
        draw: function() {
            var ctx = this.ctx,
                halfWidth = this.width / 2,
                leftX = this.x - halfWidth,
                rightX = this.x + halfWidth,
                top = this.base - (this.base - this.y),
                halfStroke = this.strokeWidth / 2;

            // Canvas doesn't allow us to stroke inside the width so we can adjust the sizes to fit if we're setting a stroke on the line
            if (this.showStroke) {
                leftX += halfStroke;
                rightX -= halfStroke;
                top += halfStroke;
            }

            ctx.beginPath();
            ctx.fillStyle = this.fillColor;
            ctx.strokeStyle = this.strokeColor;
            ctx.lineWidth = this.strokeWidth;

            // It'd be nice to keep this class totally generic to any rectangle and simply specify which border to miss out.
            ctx.moveTo(leftX, this.base);
            ctx.lineTo(leftX, top);
            ctx.lineTo(rightX, top);
            ctx.lineTo(rightX, this.base);
            ctx.fill();
            if (this.showStroke) {
                ctx.stroke();
            }
        },
        height: function() {
            return this.base - this.y;
        },
        inRange: function(chartX, chartY) {
            return (chartX >= this.x - this.width / 2 && chartX <= this.x + this.width / 2) && (chartY >= this.y && chartY <= this.base);
        }
    });

    Chart.Tooltip = Chart.Element.extend({
        draw: function() {
            var ctx = this.chart.ctx;
            ctx.font = helpers.fontString(this.fontSize, this.fontStyle, this.fontFamily);

            this.xAlign = 'center';
            this.yAlign = 'above';

            // Distance between the actual element.y position and the start of the tooltip caret
            var caretPadding = this.caretPadding = 2;
            var tooltipWidth = ctx.measureText(this.text).width + 2 * this.xPadding,
                tooltipRectHeight = this.fontSize + 2 * this.yPadding,
                tooltipHeight = tooltipRectHeight + this.caretHeight + caretPadding;

            if (this.x + tooltipWidth / 2 > this.chart.width) {
                this.xAlign = 'left';
            } else if (this.x - tooltipWidth / 2 < 0) {
                this.xAlign = 'right';
            }

            if (this.y - tooltipHeight < 0) {
                this.yAlign = 'below';
            }

            var tooltipX = this.x - tooltipWidth / 2,
                tooltipY = this.y - tooltipHeight;

            ctx.fillStyle = this.fillColor;

            // Custom Tooltips
            if (this.custom) {
                this.custom(this);
            } else {
                switch (this.yAlign) {
                    case 'above':
                        // Draw a caret above the x/y
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y - caretPadding);
                        ctx.lineTo(this.x + this.caretHeight, this.y - (caretPadding + this.caretHeight));
                        ctx.lineTo(this.x - this.caretHeight, this.y - (caretPadding + this.caretHeight));
                        ctx.closePath();
                        ctx.fill();
                        break;
                    case 'below':
                        tooltipY = this.y + caretPadding + this.caretHeight;
                        // Draw a caret below the x/y
                        ctx.beginPath();
                        ctx.moveTo(this.x, this.y + caretPadding);
                        ctx.lineTo(this.x + this.caretHeight, this.y + caretPadding + this.caretHeight);
                        ctx.lineTo(this.x - this.caretHeight, this.y + caretPadding + this.caretHeight);
                        ctx.closePath();
                        ctx.fill();
                        break;
                }

                switch (this.xAlign) {
                    case 'left':
                        tooltipX = this.x - tooltipWidth + (this.cornerRadius + this.caretHeight);
                        break;
                    case 'right':
                        tooltipX = this.x - (this.cornerRadius + this.caretHeight);
                        break;
                }

                helpers.drawRoundedRectangle(ctx, tooltipX, tooltipY, tooltipWidth, tooltipRectHeight, this.cornerRadius);
                ctx.fill();
                ctx.fillStyle = this.textColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.text, tooltipX + tooltipWidth / 2, tooltipY + tooltipRectHeight / 2);
            }
        }
    });

    Chart.MultiTooltip = Chart.Element.extend({
        initialize: function() {
            this.font = helpers.fontString(this.fontSize, this.fontStyle, this.fontFamily);
            this.titleFont = helpers.fontString(this.titleFontSize, this.titleFontStyle, this.titleFontFamily);
            this.titleHeight = this.title ? this.titleFontSize * 1.5 : 0;
            this.height = (this.labels.length * this.fontSize) + ((this.labels.length - 1) * (this.fontSize / 2)) + (this.yPadding * 2) + this.titleHeight;
            this.ctx.font = this.titleFont;

            var titleWidth = this.ctx.measureText(this.title).width,
                //Label has a legend square as well so account for this.
                labelWidth = helpers.longestText(this.ctx, this.font, this.labels) + this.fontSize + 3,
                longestTextWidth = helpers.max([labelWidth, titleWidth]);

            this.width = longestTextWidth + (this.xPadding * 2);

            var halfHeight = this.height / 2;
            // Check to ensure the height will fit on the canvas
            if (this.y - halfHeight < 0) {
                this.y = halfHeight;
            } else if (this.y + halfHeight > this.chart.height) {
                this.y = this.chart.height - halfHeight;
            }

            // Decide whether to align left or right based on position on canvas
            if (this.x > this.chart.width / 2) {
                this.x -= this.xOffset + this.width;
            } else {
                this.x += this.xOffset;
            }
        },
        getLineHeight: function(index) {
            var baseLineHeight = this.y - (this.height / 2) + this.yPadding,
                afterTitleIndex = index - 1;
            // If the index is zero, we're getting the title
            return index === 0 ? (baseLineHeight + this.titleHeight / 3) :
                (baseLineHeight + ((this.fontSize * 1.5 * afterTitleIndex) + this.fontSize / 2) + this.titleHeight);
        },
        draw: function() {
            // Custom Tooltips
            if (this.custom) {
                this.custom(this);
            } else {
                helpers.drawRoundedRectangle(this.ctx, this.x, this.y - this.height / 2, this.width, this.height, this.cornerRadius);
                var ctx = this.ctx;
                ctx.fillStyle = this.fillColor;
                ctx.fill();
                ctx.closePath();
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = this.titleTextColor;
                ctx.font = this.titleFont;
                ctx.fillText(this.title, this.x + this.xPadding, this.getLineHeight(0));
                ctx.font = this.font;

                helpers.each(this.labels, function(label, index) {
                    ctx.fillStyle = this.textColor;
                    ctx.fillText(label, this.x + this.xPadding + this.fontSize + 3, this.getLineHeight(index + 1));
                    ctx.clearRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize / 2, this.fontSize, this.fontSize);
                    ctx.fillStyle = this.legendColors[index].fill;
                    ctx.fillRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize / 2, this.fontSize, this.fontSize);
                }, this);
            }
        }
    });

    Chart.Scale = Chart.Element.extend({
        initialize: function() {
            this.fit();
        },
        buildYLabels: function() {
            this.yLabels = [];

            var stepDecimalPlaces = helpers.getDecimalPlaces(this.stepValue);
            for (var i = 0; i <= this.steps; i++) {
                this.yLabels.push(helpers.template(this.templateString, { value: (this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces) }));
            }
            this.yLabelWidth = (this.display && this.showLabels) ? helpers.longestText(this.ctx, this.font, this.yLabels) + 10 : 0;
        },
        addXLabel: function(label) {
            this.xLabels.push(label);
            this.valuesCount++;
            this.fit();
        },
        removeXLabel: function() {
            this.xLabels.shift();
            this.valuesCount--;
            this.fit();
        },
        // Fitting loop to rotate x Labels and figure out what fits there, and also calculate how many Y steps to use
        fit: function() {
            // First we need the width of the yLabels, assuming the xLabels aren't rotated

            // To do that we need the base line at the top and base of the chart, assuming there is no x label rotation
            this.startPoint = (this.display) ? this.fontSize : 0;
            this.endPoint = (this.display) ? this.height - (this.fontSize * 1.5) - 5 : this.height; // -5 to pad labels

            // Apply padding settings to the start and end point.
            this.startPoint += this.padding;
            this.endPoint -= this.padding;

            // Cache the starting endpoint, excluding the space for x labels
            var cachedEndPoint = this.endPoint;

            // Cache the starting height, so can determine if we need to recalculate the scale yAxis
            var cachedHeight = this.endPoint - this.startPoint,
                cachedYLabelWidth;

            // Build the current yLabels so we have an idea of what size they'll be to start
            /*
			 *	This sets what is returned from calculateScaleRange as static properties of this class:
			 *
				this.steps;
				this.stepValue;
				this.min;
				this.max;
			 *
			 */
            this.calculateYRange(cachedHeight);

            // With these properties set we can now build the array of yLabels and also the width of the largest yLabel
            this.buildYLabels();

            this.calculateXLabelRotation();

            while ((cachedHeight > this.endPoint - this.startPoint)) {
                cachedHeight = this.endPoint - this.startPoint;
                cachedYLabelWidth = this.yLabelWidth;

                this.calculateYRange(cachedHeight);
                this.buildYLabels();

                // Only go through the xLabel loop again if the yLabel width has changed
                if (cachedYLabelWidth < this.yLabelWidth) {
                    this.endPoint = cachedEndPoint;
                    this.calculateXLabelRotation();
                }
            }

        },
        calculateXLabelRotation: function() {
            //Get the width of each grid by calculating the difference
            //between x offsets between 0 and 1.

            this.ctx.font = this.font;

            var firstWidth = this.ctx.measureText(this.xLabels[0]).width,
                lastWidth = this.ctx.measureText(this.xLabels[this.xLabels.length - 1]).width,
                firstRotated;


            this.xScalePaddingRight = lastWidth / 2 + 3;
            this.xScalePaddingLeft = (firstWidth / 2 > this.yLabelWidth) ? firstWidth / 2 : this.yLabelWidth;

            this.xLabelRotation = 0;
            if (this.display) {
                var originalLabelWidth = helpers.longestText(this.ctx, this.font, this.xLabels),
                    cosRotation;
                this.xLabelWidth = originalLabelWidth;
                //Allow 3 pixels x2 padding either side for label readability
                var xGridWidth = Math.floor(this.calculateX(1) - this.calculateX(0)) - 6;

                //Max label rotate should be 90 - also act as a loop counter
                while ((this.xLabelWidth > xGridWidth && this.xLabelRotation === 0) || (this.xLabelWidth > xGridWidth && this.xLabelRotation <= 90 && this.xLabelRotation > 0)) {
                    cosRotation = Math.cos(helpers.toRadians(this.xLabelRotation));
                    firstRotated = cosRotation * firstWidth;

                    // We're right aligning the text now.
                    if (firstRotated + this.fontSize / 2 > this.yLabelWidth) {
                        this.xScalePaddingLeft = firstRotated + this.fontSize / 2;
                    }
                    this.xScalePaddingRight = this.fontSize / 2;
                    this.xLabelRotation++;
                    this.xLabelWidth = cosRotation * originalLabelWidth;
                }
                if (this.xLabelRotation > 0) {
                    this.endPoint -= Math.sin(helpers.toRadians(this.xLabelRotation)) * originalLabelWidth + 3;
                }
            } else {
                this.xLabelWidth = 0;
                this.xScalePaddingRight = this.padding;
                this.xScalePaddingLeft = this.padding;
            }

        },
        // Needs to be overidden in each Chart type. Otherwise we need to pass all the data into the scale class
        calculateYRange: helpers.noop,
        drawingArea: function() {
            return this.startPoint - this.endPoint;
        },
        calculateY: function(value) {
            var scalingFactor = this.drawingArea() / (this.min - this.max);
            return this.endPoint - (scalingFactor * (value - this.min));
        },
        calculateX: function(index) {
            var innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
                valueWidth = innerWidth / Math.max((this.valuesCount - ((this.offsetGridLines) ? 0 : 1)), 1),
                valueOffset = (valueWidth * index) + this.xScalePaddingLeft;
            if (this.offsetGridLines) {
                valueOffset += (valueWidth / 2);
            }
            return Math.round(valueOffset);
        },
        update: function(newProps) {
            helpers.extend(this, newProps);
            this.fit();
        },
        draw: function() {
            var ctx = this.ctx,
                yLabelGap = (this.endPoint - this.startPoint) / this.steps,
                xStart = Math.round(this.xScalePaddingLeft);
            if (this.display) {
                ctx.fillStyle = this.textColor;
                ctx.font = this.font;
                helpers.each(this.yLabels, function(labelString, index) {
                    var yLabelCenter = this.endPoint - (yLabelGap * index),
                        linePositionY = Math.round(yLabelCenter),
                        drawHorizontalLine = this.showHorizontalLines;

                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    if (this.showLabels) {
                        ctx.fillText(labelString, xStart - 10, yLabelCenter);
                    }

                    // This is X axis, so draw it
                    if (index === 0 && !drawHorizontalLine) {
                        drawHorizontalLine = true;
                    }

                    if (drawHorizontalLine) {
                        ctx.beginPath();
                    }

                    if (index > 0) {
                        // This is a grid line in the centre, so drop that
                        ctx.lineWidth = this.gridLineWidth;
                        ctx.strokeStyle = this.gridLineColor;
                    } else {
                        // This is the first line on the scale
                        ctx.lineWidth = this.lineWidth;
                        ctx.strokeStyle = this.lineColor;
                    }

                    linePositionY += helpers.aliasPixel(ctx.lineWidth);

                    if (drawHorizontalLine) {
                        ctx.moveTo(xStart, linePositionY);
                        ctx.lineTo(this.width, linePositionY);
                        ctx.stroke();
                        ctx.closePath();
                    }

                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.lineColor;
                    ctx.beginPath();
                    ctx.moveTo(xStart - 5, linePositionY);
                    ctx.lineTo(xStart, linePositionY);
                    ctx.stroke();
                    ctx.closePath();

                }, this);

                //  xLabelsSkipper is a number which if gives 0 as remainder [ indexof(xLabel)/xLabelsSkipper ], we print xLabels, otherwise, we skip it
                //                   if number then divide and determine                                        | else, if true, print all labels, else we never print
                this.xLabelsSkipper = helpers.isNumber(this.showXLabels) ? Math.ceil(this.xLabels.length / this.showXLabels) : (this.showXLabels === true) ? 1 : this.xLabels.length + 1;
                helpers.each(this.xLabels, function(label, index) {
                    var xPos = this.calculateX(index) + helpers.aliasPixel(this.lineWidth),
                        // Check to see if line/bar here and decide where to place the line
                        linePos = this.calculateX(index - (this.offsetGridLines ? 0.5 : 0)) + helpers.aliasPixel(this.lineWidth),
                        isRotated = (this.xLabelRotation > 0),
                        drawVerticalLine = this.showVerticalLines;

                    // This is Y axis, so draw it
                    if (index === 0 && !drawVerticalLine) {
                        drawVerticalLine = true;
                    }

                    if (drawVerticalLine) {
                        ctx.beginPath();
                    }

                    if (index > 0) {
                        // This is a grid line in the centre, so drop that
                        ctx.lineWidth = this.gridLineWidth;
                        ctx.strokeStyle = this.gridLineColor;
                    } else {
                        // This is the first line on the scale
                        ctx.lineWidth = this.lineWidth;
                        ctx.strokeStyle = this.lineColor;
                    }

                    if (drawVerticalLine) {
                        ctx.moveTo(linePos, this.endPoint);
                        ctx.lineTo(linePos, this.startPoint - 3);
                        ctx.stroke();
                        ctx.closePath();
                    }

                    ctx.lineWidth = this.lineWidth;
                    ctx.strokeStyle = this.lineColor;

                    // Small lines at the bottom of the base grid line
                    if (index % this.xLabelsSkipper === 0) {
                        ctx.beginPath();
                        ctx.moveTo(linePos, this.endPoint);
                        ctx.lineTo(linePos, this.endPoint + 5);
                        ctx.stroke();
                        ctx.closePath();
                    }

                    ctx.save();
                    ctx.translate(xPos, this.endPoint + (isRotated ? 12 : 8));
                    ctx.rotate(helpers.toRadians(this.xLabelRotation) * -1);
                    ctx.font = this.font;
                    ctx.textAlign = isRotated ? 'right' : 'center';
                    ctx.textBaseline = isRotated ? 'middle' : 'top';
                    if (index % this.xLabelsSkipper === 0) {
                        ctx.fillText(label, 0, 0);
                    }
                    ctx.restore();
                }, this);
            }
        }
    });

    Chart.RadialScale = Chart.Element.extend({
        initialize: function() {
            this.size = helpers.min([this.height, this.width]);
            this.drawingArea = (this.display) ? (this.size / 2) - (this.fontSize / 2 + this.backdropPaddingY) : (this.size / 2);
        },
        calculateCenterOffset: function(value) {
            // Take into account half font size + the yPadding of the top value
            return (value - this.min) * (this.drawingArea / (this.max - this.min));
        },
        update: function() {
            if (!this.lineArc) {
                this.setScaleSize();
            } else {
                this.drawingArea = (this.display) ? (this.size / 2) - (this.fontSize / 2 + this.backdropPaddingY) : (this.size / 2);
            }
            this.buildYLabels();
        },
        buildYLabels: function() {
            this.yLabels = [];
            var stepDecimalPlaces = helpers.getDecimalPlaces(this.stepValue);
            for (var i = 0; i <= this.steps; i++) {
                this.yLabels.push(helpers.template(this.templateString, { value: (this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces) }));
            }
        },
        getCircumference: function() {
            return ((Math.PI * 2) / this.valuesCount);
        },
        setScaleSize: function() {
            /*
			 * Right, this is really confusing and there is a lot of maths going on here
			 * The gist of the problem is here: https://gist.github.com/nnnick/696cc9c55f4b0beb8fe9
			 *
			 * Reaction: https://dl.dropboxusercontent.com/u/34601363/toomuchscience.gif
			 *
			 * Solution:
			 *
			 * We assume the radius of the polygon is half the size of the canvas at first
			 * at each index we check if the text overlaps.
			 *
			 * Where it does, we store that angle and that index.
			 *
			 * After finding the largest index and angle we calculate how much we need to remove
			 * from the shape radius to move the point inwards by that x.
			 *
			 * We average the left and right distances to get the maximum shape radius that can fit in the box
			 * along with labels.
			 *
			 * Once we have that, we can find the centre point for the chart, by taking the x text protrusion
			 * on each side, removing that from the size, halving it and adding the left x protrusion width.
			 *
			 * This will mean we have a shape fitted to the canvas, as large as it can be with the labels
			 * and position it in the most space efficient manner
			 *
			 * https://dl.dropboxusercontent.com/u/34601363/yeahscience.gif
			 */

            // Get maximum radius of the polygon. Either half the height (minus the text width) or half the width.
            // Use this to calculate the offset + change. - Make sure L/R protrusion is at least 0 to stop issues with centre points
            var largestPossibleRadius = helpers.min([(this.height / 2 - this.pointLabelFontSize - 5), this.width / 2]),
                pointPosition,
                i,
                textWidth,
                halfTextWidth,
                furthestRight = this.width,
                furthestRightIndex,
                furthestRightAngle,
                furthestLeft = 0,
                furthestLeftIndex,
                furthestLeftAngle,
                xProtrusionLeft,
                xProtrusionRight,
                radiusReductionRight,
                radiusReductionLeft;
            this.ctx.font = helpers.fontString(this.pointLabelFontSize, this.pointLabelFontStyle, this.pointLabelFontFamily);
            for (i = 0; i < this.valuesCount; i++) {
                // 5px to space the text slightly out - similar to what we do in the draw function.
                pointPosition = this.getPointPosition(i, largestPossibleRadius);
                textWidth = this.ctx.measureText(helpers.template(this.templateString, { value: this.labels[i] })).width + 5;
                if (i === 0 || i === this.valuesCount / 2) {
                    // If we're at index zero, or exactly the middle, we're at exactly the top/bottom
                    // of the radar chart, so text will be aligned centrally, so we'll half it and compare
                    // w/left and right text sizes
                    halfTextWidth = textWidth / 2;
                    if (pointPosition.x + halfTextWidth > furthestRight) {
                        furthestRight = pointPosition.x + halfTextWidth;
                        furthestRightIndex = i;
                    }
                    if (pointPosition.x - halfTextWidth < furthestLeft) {
                        furthestLeft = pointPosition.x - halfTextWidth;
                        furthestLeftIndex = i;
                    }
                } else if (i < this.valuesCount / 2) {
                    // Less than half the values means we'll left align the text
                    if (pointPosition.x + textWidth > furthestRight) {
                        furthestRight = pointPosition.x + textWidth;
                        furthestRightIndex = i;
                    }
                } else if (i > this.valuesCount / 2) {
                    // More than half the values means we'll right align the text
                    if (pointPosition.x - textWidth < furthestLeft) {
                        furthestLeft = pointPosition.x - textWidth;
                        furthestLeftIndex = i;
                    }
                }
            }

            xProtrusionLeft = furthestLeft;
            xProtrusionRight = Math.ceil(furthestRight - this.width);
            furthestRightAngle = this.getIndexAngle(furthestRightIndex);
            furthestLeftAngle = this.getIndexAngle(furthestLeftIndex);
            radiusReductionRight = xProtrusionRight / Math.sin(furthestRightAngle + Math.PI / 2);
            radiusReductionLeft = xProtrusionLeft / Math.sin(furthestLeftAngle + Math.PI / 2);

            // Ensure we actually need to reduce the size of the chart
            radiusReductionRight = helpers.isNumber(radiusReductionRight) ? radiusReductionRight : 0;
            radiusReductionLeft = helpers.isNumber(radiusReductionLeft) ? radiusReductionLeft : 0;

            this.drawingArea = largestPossibleRadius - (radiusReductionLeft + radiusReductionRight) / 2;
            this.setCenterPoint(radiusReductionLeft, radiusReductionRight);
        },
        setCenterPoint: function(leftMovement, rightMovement) {
            var maxRight = this.width - rightMovement - this.drawingArea,
                maxLeft = leftMovement + this.drawingArea;
            this.xCenter = (maxLeft + maxRight) / 2;
            // Always vertically in the center as the text height doesn't change
            this.yCenter = (this.height / 2);
        },

        getIndexAngle: function(index) {
            // Start from the top instead of right, so remove a quarter of the circle
            return index * ((Math.PI * 2) / this.valuesCount) - (Math.PI / 2);
        },
        getPointPosition: function(index, distanceFromCenter) {
            var thisAngle = this.getIndexAngle(index);
            return {
                x: (Math.cos(thisAngle) * distanceFromCenter) + this.xCenter,
                y: (Math.sin(thisAngle) * distanceFromCenter) + this.yCenter
            };
        },
        draw: function() {
            if (this.display) {
                var ctx = this.ctx;
                helpers.each(this.yLabels, function(label, index) {
                    // Don't draw a centre value
                    if (index > 0) {
                        var yCenterOffset = index * (this.drawingArea / this.steps),
                            yHeight = this.yCenter - yCenterOffset,
                            pointPosition;

                        // Draw circular lines around the scale
                        if (this.lineWidth > 0) {
                            ctx.strokeStyle = this.lineColor;
                            ctx.lineWidth = this.lineWidth;

                            if (this.lineArc) {
                                ctx.beginPath();
                                ctx.arc(this.xCenter, this.yCenter, yCenterOffset, 0, Math.PI * 2);
                                ctx.closePath();
                                ctx.stroke();
                            } else {
                                ctx.beginPath();
                                for (var i = 0; i < this.valuesCount; i++) {
                                    pointPosition = this.getPointPosition(i, this.calculateCenterOffset(this.min + (index * this.stepValue)));
                                    if (i === 0) {
                                        ctx.moveTo(pointPosition.x, pointPosition.y);
                                    } else {
                                        ctx.lineTo(pointPosition.x, pointPosition.y);
                                    }
                                }
                                ctx.closePath();
                                ctx.stroke();
                            }
                        }
                        if (this.showLabels) {
                            ctx.font = helpers.fontString(this.fontSize, this.fontStyle, this.fontFamily);
                            if (this.showLabelBackdrop) {
                                var labelWidth = ctx.measureText(label).width;
                                ctx.fillStyle = this.backdropColor;
                                ctx.fillRect(
                                    this.xCenter - labelWidth / 2 - this.backdropPaddingX,
                                    yHeight - this.fontSize / 2 - this.backdropPaddingY,
                                    labelWidth + this.backdropPaddingX * 2,
                                    this.fontSize + this.backdropPaddingY * 2
                                );
                            }
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = this.fontColor;
                            ctx.fillText(label, this.xCenter, yHeight);
                        }
                    }
                }, this);

                if (!this.lineArc) {
                    ctx.lineWidth = this.angleLineWidth;
                    ctx.strokeStyle = this.angleLineColor;
                    for (var i = this.valuesCount - 1; i >= 0; i--) {
                        var centerOffset = null, outerPosition = null;

                        if (this.angleLineWidth > 0 && (i % this.angleLineInterval === 0)) {
                            centerOffset = this.calculateCenterOffset(this.max);
                            outerPosition = this.getPointPosition(i, centerOffset);
                            ctx.beginPath();
                            ctx.moveTo(this.xCenter, this.yCenter);
                            ctx.lineTo(outerPosition.x, outerPosition.y);
                            ctx.stroke();
                            ctx.closePath();
                        }

                        if (this.backgroundColors && this.backgroundColors.length === this.valuesCount) {
                            if (centerOffset === null) {
                                centerOffset = this.calculateCenterOffset(this.max);
                            }
                            if (outerPosition === null) {
                                outerPosition = this.getPointPosition(i, centerOffset);
                            }
                            var previousOuterPosition = this.getPointPosition(i === 0 ? this.valuesCount - 1 : i - 1, centerOffset);
                            var nextOuterPosition = this.getPointPosition(i === this.valuesCount - 1 ? 0 : i + 1, centerOffset);
                            var previousOuterHalfway = { x: (previousOuterPosition.x + outerPosition.x) / 2, y: (previousOuterPosition.y + outerPosition.y) / 2 };
                            var nextOuterHalfway = { x: (outerPosition.x + nextOuterPosition.x) / 2, y: (outerPosition.y + nextOuterPosition.y) / 2 };

                            ctx.beginPath();
                            ctx.moveTo(this.xCenter, this.yCenter);
                            ctx.lineTo(previousOuterHalfway.x, previousOuterHalfway.y);
                            ctx.lineTo(outerPosition.x, outerPosition.y);
                            ctx.lineTo(nextOuterHalfway.x, nextOuterHalfway.y);
                            ctx.fillStyle = this.backgroundColors[i];
                            ctx.fill();
                            ctx.closePath();
                        }

                        // Extra 3px out for some label spacing
                        var pointLabelPosition = this.getPointPosition(i, this.calculateCenterOffset(this.max) + 5);
                        ctx.font = helpers.fontString(this.pointLabelFontSize, this.pointLabelFontStyle, this.pointLabelFontFamily);
                        ctx.fillStyle = this.pointLabelFontColor;

                        var labelsCount = this.labels.length,
                            halfLabelsCount = this.labels.length / 2,
                            quarterLabelsCount = halfLabelsCount / 2,
                            upperHalf = (i < quarterLabelsCount || i > labelsCount - quarterLabelsCount),
                            exactQuarter = (i === quarterLabelsCount || i === labelsCount - quarterLabelsCount);
                        if (i === 0) {
                            ctx.textAlign = 'center';
                        } else if (i === halfLabelsCount) {
                            ctx.textAlign = 'center';
                        } else if (i < halfLabelsCount) {
                            ctx.textAlign = 'left';
                        } else {
                            ctx.textAlign = 'right';
                        }

                        // Set the correct text baseline based on outer positioning
                        if (exactQuarter) {
                            ctx.textBaseline = 'middle';
                        } else if (upperHalf) {
                            ctx.textBaseline = 'bottom';
                        } else {
                            ctx.textBaseline = 'top';
                        }

                        ctx.fillText(this.labels[i], pointLabelPosition.x, pointLabelPosition.y);
                    }
                }
            }
        }
    });

    // Attach global event to resize each chart instance when the browser resizes
    helpers.addEvent(window, "resize", (function() {
        // Basic debounce of resize function so it doesn't hurt performance when resizing browser.
        var timeout;
        return function() {
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                each(Chart.instances, function(instance) {
                    // If the responsive flag is set in the chart instance config
                    // Cascade the resize event down to the chart.
                    if (instance.options.responsive) {
                        instance.resize(instance.render, true);
                    }
                });
            }, 50);
        };
    })());


    if (typeof define === 'function' && define.amd) {
        define('Chart', [], function() {
            return Chart;
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = Chart;
    }

    root.Chart = Chart;

    Chart.noConflict = function() {
        root.Chart = previous;
        return Chart;
    };

}).call(this);
