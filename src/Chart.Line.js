(function(Chart, helpers) {
    'use strict';

    Chart.Type.extend({
        name: 'Line',
        defaults: {
            // Boolean - Whether grid lines are shown across the chart
            scaleShowGridLines: true,

            // String - Colour of the grid lines
            scaleGridLineColor: 'rgba(0,0,0,.05)',

            // Number - Width of the grid lines
            scaleGridLineWidth: 1,

            // Boolean - Whether to show horizontal lines (except X axis)
            scaleShowHorizontalLines: true,

            // Boolean - Whether to show vertical lines (except Y axis)
            scaleShowVerticalLines: true,

            // Number - Tension of the bezier curve between points
            bezierCurveTension: 0.4,

            // Boolean - Whether to show a dot for each point
            pointDot: true,

            // Number - Radius of each point dot in pixels
            pointDotRadius: 4,

            // Number - Pixel width of point dot stroke
            pointDotStrokeWidth: 1,

            // Number - amount extra to add to the radius to cater for hit detection outside the drawn point
            pointHitDetectionRadius: 10,

            // Number - Pixel width of dataset stroke
            datasetStrokeWidth: 2,

            // String - A legend template
            legendTemplate: '<ul class="chart-legend <%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span class="legend-icon" style="background-color:<%=datasets[i].strokeColor%>"></span><span class="legend-text"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>',

            // Boolean - Whether to horizontally center the label and point dot inside the grid
            offsetGridLines: false
        },

        initialize: function(data) {
            // Declare the extension of the default point, to cater for the options passed in to the constructor
            this.PointClass = Chart.Point.extend({
                offsetGridLines: this.options.offsetGridLines,
                strokeWidth: this.options.pointDotStrokeWidth,
                radius: this.options.pointDotRadius,
                display: this.options.pointDot,
                hitDetectionRadius: this.options.pointHitDetectionRadius,
                ctx: this.chart.ctx,
                inRange: function(mouseX) {
                    return (Math.pow(mouseX - this.x, 2) < Math.pow(this.radius + this.hitDetectionRadius, 2));
                }
            });

            this.datasets = [];

            // Set up tooltip events on the chart
            if (this.options.showTooltips) {
                helpers.bindEvents(this, this.options.tooltipEvents, function(evt) {
                    var activePoints = (evt.type !== 'mouseout') ? this.getPointsAtEvent(evt) : [];
                    this.eachPoints(function(point) {
                        point.restore(['fillColor', 'strokeColor']);
                    });
                    helpers.each(activePoints, function(activePoint) {
                        activePoint.fillColor = activePoint.highlightFill;
                        activePoint.strokeColor = activePoint.highlightStroke;
                    });
                    this.showTooltip(activePoints);
                });
            }

            // Iterate through each of the datasets, and build this into a property of the chart
            helpers.each(data.datasets, function(dataset) {
                var datasetObject = {
                    label: dataset.label || null,
                    fillColor: dataset.fillColor,
                    strokeColor: dataset.strokeColor,
                    pointColor: dataset.pointColor,
                    pointStrokeColor: dataset.pointStrokeColor,
                    points: []
                };
                this.datasets.push(datasetObject);

                helpers.each(dataset.data, function(dataPoint, index) {
                    // Add a new point for each piece of data, passing any required data to draw.
                    datasetObject.points.push(new this.PointClass({
                        value: dataPoint,
                        label: data.labels[index],
                        datasetLabel: dataset.label,
                        strokeColor: dataset.pointStrokeColor,
                        fillColor: dataset.pointColor,
                        highlightFill: dataset.pointHighlightFill || dataset.pointColor,
                        highlightStroke: dataset.pointHighlightStroke || dataset.pointStrokeColor
                    }));
                }, this);

                this.buildScale(data.labels);

                this.eachPoints(function(point, index) {
                    helpers.extend(point, {
                        x: this.scale.calculateX(index),
                        y: this.scale.endPoint
                    });
                    point.save();
                }, this);
            }, this);

            this.render();
        },

        update: function() {
            this.scale.update();
            // Reset any highlight colours before updating.
            helpers.each(this.activeElements, function(activeElement) {
                activeElement.restore(['fillColor', 'strokeColor']);
            });
            this.eachPoints(function(point) {
                point.save();
            });
            this.render();
        },

        eachPoints: function(callback) {
            helpers.each(this.datasets, function(dataset) {
                helpers.each(dataset.points, callback, this);
            }, this);
        },

        getPointsAtEvent: function(e) {
            var pointsArray = [],
                eventPosition = helpers.getRelativePosition(e);
            helpers.each(this.datasets, function(dataset) {
                helpers.each(dataset.points, function(point) {
                    if (point.inRange(eventPosition.x, eventPosition.y))
                        pointsArray.push(point);
                });
            }, this);
            return pointsArray;
        },

        buildScale: function(labels) {
            var self = this;

            var dataTotal = function() {
                var values = [];
                self.eachPoints(function(point) {
                    values.push(point.value);
                });
                return values;
            };

            this.scale = new Chart.Scale({
                templateString: this.options.scaleLabel,
                height: this.chart.height,
                width: this.chart.width,
                ctx: this.chart.ctx,
                textColor: this.options.scaleFontColor,
                offsetGridLines: this.options.offsetGridLines,
                fontSize: this.options.scaleFontSize,
                fontStyle: this.options.scaleFontStyle,
                fontFamily: this.options.fontFamily,
                valuesCount: labels.length,
                beginAtZero: this.options.scaleBeginAtZero,
                integersOnly: this.options.scaleIntegersOnly,
                calculateYRange: function(currentHeight) {
                    helpers.extend(this, helpers.calculateScaleRange(
                        dataTotal(),
                        currentHeight,
                        this.fontSize,
                        this.beginAtZero,
                        this.integersOnly
                    ));
                },
                xLabels: labels,
                showXLabels: (this.options.showXLabels) ? this.options.showXLabels : true,
                font: helpers.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.fontFamily),
                lineWidth: this.options.scaleLineWidth,
                lineColor: this.options.scaleLineColor,
                showHorizontalLines: this.options.scaleShowHorizontalLines,
                showVerticalLines: this.options.scaleShowVerticalLines,
                gridLineWidth: (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
                gridLineColor: (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : 'rgba(0,0,0,0)',
                padding: (this.options.showScale) ? 0 : this.options.pointDotRadius + this.options.pointDotStrokeWidth,
                showLabels: this.options.scaleShowLabels,
                display: this.options.showScale
            });
        },

        reflow: function() {
            this.scale.update(helpers.extend({
                height: this.chart.height,
                width: this.chart.width
            }));
        },

        draw: function(ease) {
            var easingDecimal = ease || 1;
            this.clear();

            var ctx = this.chart.ctx;

            // Some helper methods for getting the next/prev points
            var hasValue = function(item) { return item.value !== null; },
                nextPoint = function(point, collection, index) { return helpers.findNextWhere(collection, hasValue, index) || point; },
                previousPoint = function(point, collection, index) { return helpers.findPreviousWhere(collection, hasValue, index) || point; };

            if (!this.scale)
                return;
            this.scale.draw(easingDecimal);

            helpers.each(this.datasets, function(dataset) {
                var pointsWithValues = helpers.where(dataset.points, hasValue);

                // Transition each point first so that the line and point drawing isn't out of sync
                // We can use this extra loop to calculate the control points of this dataset also in this loop
                helpers.each(dataset.points, function(point, index) {
                    if (point.hasValue()) {
                        point.transition({
                            y: this.scale.calculateY(point.value),
                            x: this.scale.calculateX(index)
                        }, easingDecimal);
                    }
                }, this);

                // Control points need to be calculated in a separate loop, because we need to know the current x/y of the point
                // This would cause issues because the y of the next point would be 0, so beziers would be skewed
                helpers.each(pointsWithValues, function(point, index) {
                    point.controlPoints = helpers.splineCurve(
                        previousPoint(point, pointsWithValues, index),
                        point,
                        nextPoint(point, pointsWithValues, index),
                        index > 0 && index < pointsWithValues.length - 1 ? this.options.bezierCurveTension : 0
                    );

                    // Prevent the bezier going outside of the bounds of the graph
                    // Cap puter bezier handles to the upper/lower scale bounds
                    if (point.controlPoints.outer.y > this.scale.endPoint)
                        point.controlPoints.outer.y = this.scale.endPoint;
                    else if (point.controlPoints.outer.y < this.scale.startPoint)
                        point.controlPoints.outer.y = this.scale.startPoint;

                    // Cap inner bezier handles to the upper/lower scale bounds
                    if (point.controlPoints.inner.y > this.scale.endPoint)
                        point.controlPoints.inner.y = this.scale.endPoint;
                    else if (point.controlPoints.inner.y < this.scale.startPoint)
                        point.controlPoints.inner.y = this.scale.startPoint;
                }, this);

                // Draw the line between all the points
                ctx.lineWidth = this.options.datasetStrokeWidth;
                ctx.strokeStyle = dataset.strokeColor;
                ctx.beginPath();

                helpers.each(pointsWithValues, function(point, index) {
                    if (index === 0) {
                        ctx.moveTo(point.x, point.y);
                    } else {
                        var previous = previousPoint(point, pointsWithValues, index);
                        ctx.bezierCurveTo(
                            previous.controlPoints.outer.x,
                            previous.controlPoints.outer.y,
                            point.controlPoints.inner.x,
                            point.controlPoints.inner.y,
                            point.x,
                            point.y
                        );
                    }
                }, this);

                if (this.options.datasetStroke)
                    ctx.stroke();

                if (pointsWithValues.length > 0) {
                    // Round off the line by going to the base of the chart, back to the start, then fill.
                    ctx.lineTo(pointsWithValues[pointsWithValues.length - 1].x, this.scale.endPoint);
                    ctx.lineTo(pointsWithValues[0].x, this.scale.endPoint);
                    ctx.fillStyle = dataset.fillColor;
                    ctx.closePath();
                    ctx.fill();
                }

                // Now draw the points over the line
                // A little inefficient double looping, but better than the line
                // lagging behind the point positions
                helpers.each(pointsWithValues, function(point) {
                    point.draw();
                });
            }, this);
        }
    });
}(this.Chart, this.ChartHelpers));
