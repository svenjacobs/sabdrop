/*jshint browser: true, regexp: false, bitwise: false, indent: 4*/
/*global $, chrome*/
(function () {

    var FLAG_IN_TOOLTIP = 1,
        FLAG_IN_SLOT = 2,
        FADE_IN_DELAY = 300,
        FADE_OUT_DELAY = 1000,

        $tooltip = $('#tooltip'),
        tooltipState = 0,
        sorting = false;

    $tooltip.hover(
        function () {
            tooltipState = tooltipState | FLAG_IN_TOOLTIP;
        },
        function () {
            tooltipState = tooltipState & ~FLAG_IN_TOOLTIP;

            window.setTimeout(function () {
                if (tooltipState === 0) {
                    $tooltip.fadeOut();
                }
            }, FADE_OUT_DELAY);
        }
    );

    function color(p) {
        var red = p < 50 ? 255 : Math.round(256 - (p - 50) * 5.12),
            green = p > 50 ? 255 : Math.round(p * 5.12);
            
        return "rgb(" + red + "," + green + ",0)";
    }

    //function id(filename) {
    //    return 'slot_' + filename.replace(/[^A-Z0-9_\-]/gi, '');
    //}

    function updateSlots(slots) {
        if (sorting) {
            // Don't update while user is sorting
            return;
        }
        
        var $slots = $('#slots');
        $slots.empty();

        slots.forEach(function (s) {
            var percent = parseInt(s.percentage, 10),
                percentTxt = percent + '%',
                mb = parseFloat(s.mb),
                mbLeft = parseFloat(s.mbleft),

                el = newSlotElement({
                    id: s.nzo_id,
                    name: s.filename,
                    percentage: percent,
                    mb: mb,
                    mbLeft: mbLeft
                });
                
            $slots.append(el);
        });
    }

    function newSlotElement(s) {
        var mbDownloaded = (s.mb - s.mbLeft).toFixed(2),
            completed = s.percentage === 100,
            el = $('<li>')
                .attr('id', s.id)
                .addClass('ui-state-default')
                .append(
                    $('<div>').addClass('progress').css({
                        'width': s.percentage + '%',
                        'background-color': color(s.percentage)
                    })
                )
                .append(
                    $('<span>')
                        .addClass('name')
                        .text(s.name)
                )
                .append(
                    $('<span>')
                        .addClass('percent')
                        .text(s.percentage + '%')
                )
                .append(
                    $('<img>').attr('src', 'images/tick.png')
                );

        if (completed) {
            el.addClass('completed');
        }

        el.hover(
            function (evt) {
                if (sorting) {
                    return;
                }

                var offset = el.offset();

                tooltipState = tooltipState | FLAG_IN_SLOT;

                $tooltip
                    .css({
                        'left': offset.left + 10 + 'px',
                        'top': offset.top + 10 + 'px'
                    })
                    .children('.name').text(s.name)
                    .end()
                    .children('.progress').text(mbDownloaded + ' MB of ' + s.mb + ' MB (' + s.percentage + '%)');

                if (completed) {
                    $tooltip.addClass('completed');
                } else {
                    $tooltip.removeClass('completed');
                }

                window.setTimeout(function () {
                    if (!$tooltip.is(':visible')) {
                        $tooltip.fadeIn();
                    }
                }, FADE_IN_DELAY);

            },
            function (evt) {
                tooltipState = tooltipState & ~FLAG_IN_SLOT;

                window.setTimeout(function () {
                    if (tooltipState === 0) {
                        $tooltip.fadeOut();
                    }
                }, FADE_OUT_DELAY);
            }
        );

        return el;
    }

    function getSlots(callback) {
        chrome.extension.sendRequest({action: 'getSlots'}, function (slots) {
            if (!slots) {
                console.error('Couldn\'t fetch slots');
                return;
            }

            callback(slots);
        });
    }

    getSlots(updateSlots);

    window.setInterval(function () {
        getSlots(updateSlots);
    }, 5000);


    $('#slots').sortable({
        placeholder: "ui-state-highlight",
        start: function () {
            sorting = true;
            $tooltip.hide();
        },
        stop: function () {
            sorting = false;
        }
    });

}());
