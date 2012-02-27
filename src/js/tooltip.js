/*jshint browser: true, bitwise: false, indent: 4*/
/*global $*/
(function () {

    var FLAG_HOVER_TOOLTIP = 1,
        FLAG_HOVER_TARGET = 2,
        FADE_IN_DELAY = 300,
        FADE_OUT_DELAY = 1000;

    function Tooltip(tooltip) {
        this.$tooltip = $(tooltip);
        this.fadeInDelay = FADE_IN_DELAY;
        this.fadeOutDelay = FADE_OUT_DELAY;
        this.offsetLeft = 0;
        this.offsetTop = 25;
        this.state = 0;

        var self = this;

        this.$tooltip.hover(
            // Hover in
            function () {
                self.state = self.state | FLAG_HOVER_TOOLTIP;
            },

            // Hover out
            function () {
                self.state = self.state & ~FLAG_HOVER_TOOLTIP;

                window.setTimeout(function () {
                    if (self.state === 0 && self.$tooltip.is(':visible')) {
                        self.$tooltip.fadeOut();
                    }
                }, self.fadeOutDelay);
            }
        );
    }

    Tooltip.prototype.attachTo = function (target) {
        var $target = $(target),
            self = this;

        $target.hover(
            // Hover in
            function (evt) {
                var offset = $target.offset();

                self.state = self.state | FLAG_HOVER_TARGET;

                self.$tooltip.css({
                    'left': offset.left + self.offsetLeft + 'px',
                    'top': offset.top + self.offsetTop + 'px'
                });

                window.setTimeout(function () {
                    if (self.state !== 0 && !self.$tooltip.is(':visible')) {
                        self.$tooltip.fadeIn();
                    }
                }, self.fadeInDelay);
            },

            // Hover out
            function (evt) {
                self.state = self.state & ~FLAG_HOVER_TARGET;

                window.setTimeout(function () {
                    if (self.state === 0) {
                        self.$tooltip.fadeOut();
                    }
                }, self.fadeOutDelay);
            }
        );

        return this;
    };

    Tooltip.prototype.show = function () {
        this.$tooltip.fadeIn();
    };

    Tooltip.prototype.hide = function (immediatly) {
        if (immediatly) {
            this.$tooltip.hide();
        } else {
            this.$tooltip.fadeOut();
        }
    };

    window.Tooltip = Tooltip;

}());
