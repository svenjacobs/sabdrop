/*jshint browser: true, bitwise: false, plusplus: false, indent: 4*/
/*global Tooltip, $, chrome*/
(function () {

    var INTERVAL = 5000,

        $slotTooltipContainer = $('#slot_tooltip'),
        $graphTooltipContainer = $('#graph_tooltip'),
        slotTooltip = new Tooltip($slotTooltipContainer),
        graphTooltip = new Tooltip($graphTooltipContainer).attachTo('#graph'),
        $slots = $('#slots'),
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

        $el.mouseenter(
            function (evt) {
                if (sorting) {
                    return;
                }

                var offset = $el.offset(),
                    paused = $el.hasClass('paused');

                // Adjust tooltip to slot currently hovered

                $slotTooltipContainer
                    .data('target', s.nzo_id)
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
                            $slotTooltipContainer.children('button.resume').show();
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
                            $slotTooltipContainer.children('button.pause').show();
                            $el.removeClass('paused');
                            resumeDownload(s.nzo_id);
                            resetInterval();
                        })
                    .end()

                    // Delete button
                    .children('button.delete')
                        .off('click')
                        .click(function () {
                            slotTooltip.hide();
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
            }
        );

        slotTooltip.attachTo($el);

        return $el;
    }

    function updateGraph(history) {
        var i = 0,
            series = [],
            speed,
            speedText;

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

        if (history.length > 0) {
            speed = history[history.length - 1];
        } else {
            speed = 0;
        }

        if (speed >= 1000) {
            speedText = (speed / 1000).toFixed(2) + ' MB/s';
        } else {
            speedText = speed.toFixed(2) + ' kB/s'; 
        }
        
        $graphTooltipContainer.children('div.speed').text(chrome.i18n.getMessage('speed', speedText));
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

    graphTooltip.offsetTop = 0;
    graphTooltip.offsetLeft = 40;

    $slotTooltipContainer
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
            slotTooltip.hide(true);
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

    $('#slider_container div.slider').slider({
        orientation: 'vertical',
        range: 'min',
        min: 250,
        max: 10000,
        value: 10000,
        step: 250,
        slide: function (evt, ui) {
            $('#slider_container div.value').text(ui.value + ' kB/s');  
        }
    });

    $('#empty span').text(chrome.i18n.getMessage('no_downloads'));

    refresh();
    resetInterval();

}());
