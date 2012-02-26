/*jshint browser: true, bitwise: false, indent: 4*/
/*global $, chrome*/
(function () {

    var FLAG_HOVER_TOOLTIP = 1,
        FLAG_HOVER_SLOT = 2,
        FADE_IN_DELAY = 300,
        FADE_OUT_DELAY = 1000,
        INTERVAL = 5000,

        $tooltip = $('#tooltip'),
        tooltipState = 0,
        sorting = false,
        updateInterval = null;

    function color(p) {
        var red = p < 50 ? 255 : Math.round(256 - (p - 50) * 5.12),
            green = p > 50 ? 255 : Math.round(p * 5.12);
            
        return "rgb(" + red + "," + green + ",0)";
    }

    function updateSlots(slots) {
        if (sorting) {
            // Don't update while user is sorting
            return;
        }
        
        var $slots = $('#slots');
        $slots.empty();

        $('#empty').toggle(slots.length === 0);

        slots.forEach(function (s) {
            $slots.append(newSlotElement(s));
        });
    }

    function newSlotElement(s) {
        var percent = parseInt(s.percentage, 10),
            percentTxt = percent + '%',
            mb = parseFloat(s.mb),
            mbLeft = parseFloat(s.mbleft),
            mbDownloaded = (mb - mbLeft).toFixed(2),

            $el = $('<li>')
                .attr('id', s.nzo_id)
                .addClass('ui-state-default')
                .addClass(s.status.toLowerCase())
                .append(
                    $('<div>').addClass('progress').css({
                        'width': percentTxt,
                        'background-color': color(percent)
                    })
                )
                .append($('<span>').addClass('name').text(s.filename))
                .append($('<span>').addClass('percent').text(percentTxt))
                .append($('<img>').attr('src', 'images/pause.png'));

        $el.hover(
            // Hover in
            function (evt) {
                if (sorting) {
                    return;
                }

                var offset = $el.offset(),
                    paused = $el.hasClass('paused');

                tooltipState = tooltipState | FLAG_HOVER_SLOT;

                // Adjust tooltip to slot currently hovered and then display it

                $tooltip
                    .data('target', s.nzo_id)
                    .css({
                        'left': offset.left + 10 + 'px',
                        'top': offset.top + 10 + 'px'
                    })
                    .children('div.name').text(s.filename)
                    .end()
                    .children('div.progress').text(mbDownloaded + ' MB of ' + s.mb + ' MB (' + percentTxt + ')')
                    .end()

                    // Pause button
                    .children('button.pause')
                        .toggle(!paused)
                        .off('click')
                        .click(function () {
                            $(this).hide();
                            $tooltip.children('button.resume').show();
                            $el.addClass('paused');
                            pauseDownload(s.nzo_id);
                            resetInterval();
                        })
                    .end()

                    // Resume button
                    .children('button.resume')
                        .toggle(paused)
                        .off('click')
                        .click(function () {
                            $(this).hide();
                            $tooltip.children('button.pause').show();
                            $el.removeClass('paused');
                            resumeDownload(s.nzo_id);
                            resetInterval();
                        })
                    .end()

                    // Delete button
                    .children('button.delete')
                        .off('click')
                        .click(function () {
                            $tooltip.fadeOut();
                            tooltipState = 0;
                            $el.hide('drop', {
                                direction: 'right',
                                speed: 'fast',
                            }, function () {
                                $el.remove();
                                $('#empty').toggle($('#slots li').length === 0); // No downloads left?
                            });
                            deleteDownload(s.nzo_id);
                            resetInterval();
                        });

                window.setTimeout(function () {
                    if (!$tooltip.is(':visible')) {
                        $tooltip.fadeIn();
                    }
                }, FADE_IN_DELAY);

            },

            // Hover out
            function (evt) {
                tooltipState = tooltipState & ~FLAG_HOVER_SLOT;

                window.setTimeout(function () {
                    if (tooltipState === 0) {
                        $tooltip.fadeOut();
                    }
                }, FADE_OUT_DELAY);
            }
        );

        return $el;
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

    function pauseDownload(id) {
        chrome.extension.sendRequest({action: 'pauseDownload', id: id});
    }

    function resumeDownload(id) {
        chrome.extension.sendRequest({action: 'resumeDownload', id: id});
    }

    function deleteDownload(id) {
        chrome.extension.sendRequest({action: 'deleteDownload', id: id});
    }

    function resetInterval() {
        if (updateInterval) {
            window.clearInterval(updateInterval);
        }

        updateInterval = window.setInterval(function () {
            getSlots(updateSlots);
        }, 5000);
    }

    $tooltip.hover(
        function () {
            tooltipState = tooltipState | FLAG_HOVER_TOOLTIP;
        },
        function () {
            tooltipState = tooltipState & ~FLAG_HOVER_TOOLTIP;

            window.setTimeout(function () {
                if (tooltipState === 0) {
                    $tooltip.fadeOut();
                }
            }, FADE_OUT_DELAY);
        }
    );

    $('#slots').sortable({
        placeholder: 'ui-state-highlight',
        axis: 'y',
        start: function () {
            sorting = true;
            $tooltip.hide();
        },
        stop: function () {
            sorting = false;
        }
    });

    getSlots(updateSlots);
    resetInterval();

}());
