/*jshint browser: true, indent: 4*/
/*global $, chrome*/
(function () {

    function color(p) {
        var red = p < 50 ? 255 : Math.round(256 - (p - 50) * 5.12),
            green = p > 50 ? 255 : Math.round(p * 5.12);
            
        return "rgb(" + red + "," + green + ",0)";
    }

    function updateSlots(slots) {
        var $slots = $('#slots');
        $slots.empty();

        slots.forEach(function (s) {
            var percent = parseInt(s.percentage, 10);

            $slots.append(
                $('<li>')
                    .addClass('ui-state-default')
                    .attr('title', percent + '%')
                    .append(
                        $('<div>').addClass('progress').css({
                            'width': percent + '%',
                            'background-color': color(percent)
                        })
                    )
                    .append(
                        $('<span>').text(s.filename)
                    )
            );
        });
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

}());
