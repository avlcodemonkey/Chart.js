(function(Chart, helpers) {
    'use strict';

    Chart.Type.extend({
        name: 'Radar',
        defaults: {
            // Boolean - Whether to show lines for each scale point
            scaleShowLine: true,

            // Boolean - Whether we show the angle lines out of the radar
            angleShowLineOut: true,

            // Boolean - Whether to show labels on the scale
            scaleShowLabels: false,

            // Boolean - Whether the scale should begin at zero
            scaleBeginAtZero: true,

            // String - Colour of the angle line
            angleLineColor: 'rgba(0,0,0,.1)',

            // Number - Pixel width of the angle line
            angleLineWidth: 1,

            // Number - Interval at which to draw angle lines ("every Nth point")
            angleLineInterval: 1,

            // String - Point label font weight
            pointLabelFontStyle: 'normal',

            // Number - Point label font size in pixels
            pointLabelFontSize: 10,

            // String - Point label font colour
            pointLabelFontColor: '#666',

            // Boolean - Whether to show a dot for each point
            pointDot: true,

            // Number - Radius of each point dot in pixels
            pointDotRadius: 3,

            // Number - Pixel width of point dot stroke
            pointDotStrokeWidth: 1,

            // Number - amount extra to add to the radius to cater for hit detection outside the drawn point
            pointHitDetectionRadius: 10,

            // Number - Pixel width of dataset stroke
            datasetStrokeWidth: 2,

            // String - A legend template
            legendTemplate: '<ul class="chart-legend <%=name.toLowerCase()%>-legend"><% for (var i=0; i<datasets.length; i++){%><li><span class="legend-icon" style="background-color:<%=datasets[i].strokeColor%>"></span><span class="legend-text"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>'
        },

        initialize: function(data) {
            this.PointClass = Chart.Point.extend({
                strokeWidth: this.options.pointDotStrokeWidth,
                radius: this.options.pointDotRadius,
                display: this.options.pointDot,
                hitDetectionRadius: this.options.pointHitDetectionRadius,
                ctx: this.chart.ctx
            });

            this.datasets = [];

            this.buildScale(data);

            // Set up tooltip events on the chart
            if (this.options.showTooltips) {
                helpers.bindEvents(this, this.options.tooltipEvents, function(evt) {
                    var activePointsCollection = (evt.type !== 'mouseout') ? this.getPointsAtEvent(evt) : [];

                    this.eachPoints(function(point) {
                        point.restore(['fillColor', 'strokeColor']);
                    });
                    helpers.each(activePointsCollection, function(activePoint) {
                        activePoint.fillColor = activePoint.highlightFill;
                        activePoint.strokeColor = activePoint.highlightStroke;
                    });

                    this.showTooltip(activePointsCollection);
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
                    var pointPosition = this.scale.getPointPosition(index, this.scale.calculateCenterOffset(dataPoint));
                    datasetObject.points.push(new this.PointClass({
                        value: dataPoint,
                        label: data.labels[index],
                        datasetLabel: dataset.label,
                        x: pointPosition.x,
                        y: pointPosition.y,
                        strokeColor: dataset.pointStrokeColor,
                        fillColor: dataset.pointColor,
                        highlightFill: dataset.pointHighlightFill || dataset.pointColor,
                        highlightStroke: dataset.pointHighlightStroke || dataset.pointStrokeColor
                    }));
                }, this);
            }, this);

            this.render();
        },

        eachPoints: function(callback) {
            helpers.each(this.datasets, function(dataset) {
                helpers.each(dataset.points, callback, this);
            }, this);
        },

        getPointsAtEvent: function(evt) {
            var mousePosition = helpers.getRelativePosition(evt),
                fromCenter = helpers.getAngleFromPoint({
                    x: this.scale.xCenter,
                    y: this.scale.yCenter
                }, mousePosition);

            var anglePerIndex = (Math.PI * 2) / this.scale.valuesCount,
                pointIndex = Math.round((fromCenter.angle - Math.PI * 1.5) / anglePerIndex),
                activePointsCollection = [];

            // If we're at the top, make the pointIndex 0 to get the first of the array.
            if (pointIndex >= this.scale.valuesCount || pointIndex < 0)
                pointIndex = 0;

            if (fromCenter.distance <= this.scale.drawingArea)
                helpers.each(this.datasets, function(dataset) {
                    activePointsCollection.push(dataset.points[pointIndex]);
                });

            return activePointsCollection;
        },

        buildScale: function(data) {
            this.scale = new Chart.RadialScale({
                display: this.options.showScale,
                fontStyle: this.options.scaleFontStyle,
                fontSize: this.options.scaleFontSize,
                fontFamily: this.options.fontFamily,
                fontColor: this.options.scaleFontColor,
                showLabels: this.options.scaleShowLabels,
                showLabelBackdrop: this.options.scaleShowLabelBackdrop,
                backdropColor: this.options.scaleBackdropColor,
                backgroundColors: this.options.scaleBackgroundColors,
                backdropPaddingY: this.options.scaleBackdropPaddingY,
                backdropPaddingX: this.options.scaleBackdropPaddingX,
                lineWidth: (this.options.scaleShowLine) ? this.options.scaleLineWidth : 0,
                lineColor: this.options.scaleLineColor,
                angleLineColor: this.options.angleLineColor,
                angleLineWidth: (this.options.angleShowLineOut) ? this.options.angleLineWidth : 0,
                angleLineInterval: (this.options.angleLineInterval) ? this.options.angleLineInterval : 1,
                // Point labels at the edge of each line
                pointLabelFontColor: this.options.pointLabelFontColor,
                pointLabelFontSize: this.options.pointLabelFontSize,
                pointLabelFontStyle: this.options.pointLabelFontStyle,
                height: this.chart.height,
                width: this.chart.width,
                xCenter: this.chart.width / 2,
                yCenter: this.chart.height / 2,
                ctx: this.chart.ctx,
                templateString: this.options.scaleLabel,
                labels: data.labels,
                valuesCount: data.datasets[0].data.length
            });

            this.scale.setScaleSize();
            this.updateScaleRange(data.datasets);
            this.scale.buildYLabels();
        },

        updateScaleRange: function(datasets) {
            var valuesArray = (function() {
                var totalDataArray = [];
                helpers.each(datasets, function(dataset) {
                    if (dataset.data)
                        totalDataArray = totalDataArray.concat(dataset.data);
                    else
                        helpers.each(dataset.points, function(point) {
                            totalDataArray.push(point.value);
                        });
                });
                return totalDataArray;
            })();

            helpers.extend(
                this.scale,
                helpers.calculateScaleRange(
                    valuesArray,
                    helpers.min([this.chart.width, this.chart.height]) / 2,
                    this.options.scaleFontSize,
                    this.options.scaleBeginAtZero,
                    this.options.scaleIntegersOnly
                )
            );
        },

        update: function() {
            this.eachPoints(function(point) {
                point.save();
            });
            this.reflow();
            this.render();
        },

        reflow: function() {
            helpers.extend(this.scale, {
                width: this.chart.width,
                height: this.chart.height,
                size: helpers.min([this.chart.width, this.chart.height]),
                xCenter: this.chart.width / 2,
                yCenter: this.chart.height / 2
            });
            this.updateScaleRange(this.datasets);
            this.scale.setScaleSize();
            this.scale.buildYLabels();
        },

        draw: function(ease) {
            var easeDecimal = ease || 1,
                ctx = this.chart.ctx;
            this.clear();
            this.scale.draw();

            helpers.each(this.datasets, function(dataset) {
                // Transition each point first so that the line and point drawing isn't out of sync
                helpers.each(dataset.points, function(point, index) {
                    if (point.hasValue()) {
                        point.transition(this.scale.getPointPosition(index, this.scale.calculateCenterOffset(point.value)), easeDecimal);
                    }
                }, this);

                // Draw the line between all the points
                ctx.lineWidth = this.options.datasetStrokeWidth;
                ctx.strokeStyle = dataset.strokeColor;
                ctx.beginPath();
                helpers.each(dataset.points, function(point, index) {
                    if (index === 0)
                        ctx.moveTo(point.x, point.y);
                    else
                        ctx.lineTo(point.x, point.y);
                }, this);
                ctx.closePath();
                ctx.stroke();

                ctx.fillStyle = dataset.fillColor;
                ctx.fill();

                // Now draw the points over the line
                // A little inefficient double looping, but better than the line
                // lagging behind the point positions
                helpers.each(dataset.points, function(point) {
                    if (point.hasValue())
                        point.draw();
                });
            }, this);
        }
    });
}(this.Chart, this.ChartHelpers));
