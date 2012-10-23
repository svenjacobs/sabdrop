/*jshint browser: true, bitwise: false, plusplus: false, indent: 4*/
/*global SABdrop, Tooltip, $, chrome*/
(function () {

    var SPEED_MAX = localStorage.speedSliderMax ? parseInt(localStorage.speedSliderMax, 10) : 10000, // kB
        SPEED_MIN = localStorage.speedSliderMin ? parseInt(localStorage.speedSliderMin, 10) : 500,
        SPEED_STEP = localStorage.speedSliderStep ? parseInt(localStorage.speedSliderStep, 10) : 500,
        SPEED_INFIN = SPEED_MAX + SPEED_STEP,

        $slotTooltipContainer = $('#slot_tooltip'),
        $graphTooltipContainer = $('#graph_tooltip'),
        slotTooltip = new Tooltip($slotTooltipContainer),
        graphTooltip = new Tooltip($graphTooltipContainer).attachTo('#graph'),
        $slots = $('#slots'),
        sorting = false,
        sliding = false,

        api = chrome.extension.getBackgroundPage().getApi();

    function color(p) {
        var red = p < 50 ? 255 : Math.round(256 - (p - 50) * 5.12),
            green = p > 50 ? 255 : Math.round(p * 5.12);

        return "rgb(" + red + "," + green + ",0)";
    }

    function refresh() {
        var queue = api.getQueue(),
            speedlimit = queue.speedlimit === '' ? SPEED_INFIN : parseInt(queue.speedlimit, 10);

        updateSlots(queue);

        $('#controls button.pause').toggle(!queue.paused);
        $('#controls button.resume').toggle(queue.paused);
       
        if (!sliding) {
            $('#slider_container div.slider').slider('value', speedlimit);
            setSliderText(speedlimit);
        }

        updateGraph(api.getSpeedHistory());
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
    }

    function newSlotElement(s) {
        var percent = parseInt(s.percentage, 10),
            percentTxt = percent + '%',

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

        // Update tooltip if currently visible and showing this slot element
        if ($slotTooltipContainer.is(':visible') && $slotTooltipContainer.data('target') === s.nzo_id) {
            updateSlotTooltip(s);
        }

        $el.mouseenter(
            function (evt) {
                if (sorting) {
                    return;
                }

                var offset = $el.offset(),
                    paused = $el.hasClass('paused');

                // Adjust tooltip to slot currently hovered

                updateSlotTooltip(s);

                $slotTooltipContainer
                    .data('target', s.nzo_id)

                    // Pause button
                    .children('button.pause')
                        .toggle(!paused)
                        .off('click')
                        .click(function () {
                            $(this).hide();
                            $slotTooltipContainer.children('button.resume').show();
                            $el.addClass('paused');
                            api.pauseDownload(s.nzo_id);
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
                            api.resumeDownload(s.nzo_id);
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
                            api.deleteDownload(s.nzo_id);
                        });
            }
        );

        slotTooltip.attachTo($el);

        return $el;
    }

    function updateSlotTooltip(s) {
        var percent = parseInt(s.percentage, 10),
            mb = parseFloat(s.mb),
            mbLeft = parseFloat(s.mbleft),
            mbDownloaded = (mb - mbLeft).maybeToFixed(2);

        $slotTooltipContainer
            .children('div.name').text(s.filename)
            .end()
            .children('div.progress').text(chrome.i18n.getMessage('mb_stats', [mbDownloaded, s.mb, percent]))
            .end()
            .children('div.eta').text(chrome.i18n.getMessage('eta_stats', s.timeleft === '0:00:00' ? '???' : s.timeleft));
    }

    function updateGraph(history) {
        var i = 0,
            series = [],
            speed,
            hspeed,
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

        hspeed = SABdrop.Common.humanizeBytes(speed * 1000, true);
        speedText = hspeed[0].maybeToFixed(2) + ' ' + hspeed[1] + '/s';
        
        $graphTooltipContainer.children('div.speed').text(chrome.i18n.getMessage('speed', speedText));
    }

    function setSliderText(kb) {
        var speed = SABdrop.Common.humanizeBytes(kb * 1000, true);
        $('#slider_container div.value').html(kb === SPEED_INFIN ? '&infin;' : speed[0].toFixed(1) + ' ' + speed[1] + '/s');  
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
            api.pauseAll();
        })
        .children('span').text(chrome.i18n.getMessage('pause_all'));

    $('#controls button.resume')
        .click(function () {
            $(this).hide();
            $('#controls button.pause').show();
            $slots.removeClass('pausedAll');
            api.resumeAll();
        })
        .children('span').text(chrome.i18n.getMessage('resume_all'));

    $('#controls button.delete')
        .click(function () {
            $slots.empty();
            $('#empty').show();
            api.deleteAll();
        })
        .children('span').text(chrome.i18n.getMessage('delete_all'));

    $('#controls button.sabnzbd')
        .click(function () {
            var url = api.getHost(),
                username = localStorage.username,
                password = localStorage.password,
                i = url.indexOf('://');

            // Insert HTTP Basic Auth params between protocol and hostname
            if (username && password && i > -1) {
                i += 3;
                url = url.substring(0, i) + username + ':' + password + '@' + url.substring(i);
            }

            chrome.tabs.create({
                url: url
            });
        })
        .children('span').text(chrome.i18n.getMessage('open_sabnzbd'));

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
                    api.moveDownload(
                        $(ui.item).attr('id'),
                        pos
                    );

                    return false;
                }
            });
        }
    });

    $('#slider_container div.slider').slider({
        orientation: 'vertical',
        range: 'min',
        min: SPEED_MIN,
        max: SPEED_INFIN,
        value: SPEED_INFIN,
        step: SPEED_STEP,
        slide: function (evt, ui) {
            setSliderText(ui.value);
        },
        start: function () {
            sliding = true;
        },
        stop: function (evt, ui) {
            var limit = ui.value;

            sliding = false;
            
            if (ui.value === SPEED_INFIN) {
                limit = 0;
            }

            api.setSpeedLimit(limit);
        }
    });

    $('#empty span').text(chrome.i18n.getMessage('no_downloads'));
    $('#error span').text(chrome.i18n.getMessage('connection_error'));

    api.verifyConnection(function (success) {
        if (success) {
            $('#error').hide();

            refresh();
            api.addSabQueryListener(refresh);
            
            $(window).unload(function () {
                api.removeSabQueryListener(refresh);
            });
        }
    });

    updateGraph([]);

}());
