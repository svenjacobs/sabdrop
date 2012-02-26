/*jshint browser: true, bitwise: false, plusplus: false, indent: 4*/
/*global $, chrome*/
(function () {

    var FLAG_HOVER_TOOLTIP = 1,
        FLAG_HOVER_SLOT = 2,
        FADE_IN_DELAY = 300,
        FADE_OUT_DELAY = 1000,
        INTERVAL = 5000,

        $tooltip = $('#tooltip'),
        $slots = $('#slots'),
        tooltipState = 0,
        sorting = false,
        updateInterval = null;

    function color(p) {
        var red = p < 50 ? 255 : Math.round(256 - (p - 50) * 5.12),
            green = p > 50 ? 255 : Math.round(p * 5.12);

        return "rgb(" + red + "," + green + ",0)";
    }

    function updateSlots(queue) {
        if (sorting) {
            // Don't update while user is sorting
            return;
        }

        $slots.empty();

        $('#empty').toggle(queue.slots.length === 0);

        queue.slots.forEach(function (s) {
            $slots.append(newSlotElement(s));
        });

        if (queue.paused) {
            $slots.addClass('pausedAll');
        } else {
            $slots.removeClass('pausedAll');
        }

        $('#controls button.pause').toggle(!queue.paused);
        $('#controls button.resume').toggle(queue.paused);
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
                        'left': offset.left + 'px',
                        'top': offset.top + 25 + 'px'
                    })
                    .children('div.name').text(s.filename)
                    .end()
                    .children('div.progress').text(chrome.i18n.getMessage('mb_stats', [mbDownloaded, s.mb, percent]))
                    .end()
                    .children('div.eta').text(chrome.i18n.getMessage('eta_stats', s.timeleft === '0:00:00' ? '???' : s.timeleft))
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
                                $('#empty').toggle($slots.children('li').length === 0); // No downloads left?
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

    function updateGraph(history) {
        var i = 0,
            series = [];

        history.forEach(function (h) {
            series.push([i, h]);
            i++;
        });

        $.plot($('#graph'), [series], {
            series: {
                color: '#003366',
                lines: {
                    show: true,
                    fill: true,
                    fillColor: 'rgba(51, 102, 153, 0.8)'
                },
                shadowSize: 0
            },
            xaxis: {
                show: false
            },
            yaxis: {
                min: 0
                //tickFormatter: function (val, axis) {
                //    return (val / 1000).toFixed(2);
                //}
            },
            grid: {
                borderColor: '#CCC'
            }
        });
    }

    function refresh() {
        getQueue(updateSlots);
        getSpeedHistory(updateGraph);
    }

    function getQueue(callback) {
        chrome.extension.sendRequest({action: 'getQueue'}, function (queue) {
            if (!queue) {
                console.error('Couldn\'t fetch queue');
                return;
            }

            callback(queue);
        });
    }

    function getSpeedHistory(callback) {
        chrome.extension.sendRequest({action: 'getSpeedHistory'}, function (history) {
            if (!history) {
                console.error('Couldn\'t fetch history');
                return;
            }

            callback(history);
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
            refresh();
        }, 5000);
    }

    $tooltip
        .hover(
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
        )
        .find('button.resume span').text(chrome.i18n.getMessage('resume'))
        .end()
        .find('button.pause span').text(chrome.i18n.getMessage('pause'))
        .end()
        .find('button.delete span').text(chrome.i18n.getMessage('delete'));

    $('#controls button.pause')
        .click(function () {
            $(this).hide();
            $('#controls button.resume').show();
            $slots.addClass('pausedAll');
            resetInterval();
            chrome.extension.sendRequest({action: 'pauseAll'});
        })
        .children('span').text(chrome.i18n.getMessage('pause_all'));

    $('#controls button.resume')
        .click(function () {
            $(this).hide();
            $('#controls button.pause').show();
            $slots.removeClass('pausedAll');
            resetInterval();
            chrome.extension.sendRequest({action: 'resumeAll'});
        })
        .children('span').text(chrome.i18n.getMessage('resume_all'));

    $('#controls button.delete')
        .click(function () {
            $slots.empty();
            $('#empty').show();
            resetInterval();
            chrome.extension.sendRequest({action: 'deleteAll'});
        })
        .children('span').text(chrome.i18n.getMessage('delete_all'));

    $slots.sortable({
        placeholder: 'ui-state-highlight',
        axis: 'y',
        start: function () {
            sorting = true;
            $tooltip.hide();
        },
        stop: function (evt, ui) {
            sorting = false;

            $slots.children('li').each(function (pos, item) {
                if ($(ui.item).attr('id') === $(item).attr('id')) {
                    chrome.extension.sendRequest({
                        action: 'moveDownload',
                        id: $(ui.item).attr('id'),
                        position: pos
                    });

                    resetInterval();

                    return false;
                }
            });
        }
    });

    $('#empty span').text(chrome.i18n.getMessage('no_downloads'));

    refresh();
    resetInterval();

}());
