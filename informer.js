(function(window, document) {
    var oprossoDomain = ".oprosso.local";
    var hostReplaceRegex = new RegExp("^(https?)(:\\/\\/)([a-zA-Zа-яА-ЯёЁ0-9\\-_.]+)(\\S*)$", 'g');

    function trySendMessage(payload) {
        if (parent) {
            parent.postMessage({type: 1, payload: payload}, "http://oprosso.local");
        }
    }

    function moveUrlsOnSubdomain() {
        var aList = document.getElementsByTagName("a");

        for (var i = 0; i < aList.length; i++) {
            aList[i].setAttribute("target", "_self");
            aList[i].setAttribute("href", addOprossoSubdomain(aList[i].getAttribute("href")))
        }
    }

    function addOprossoSubdomain(url) {
        if (typeof url === "string" && url.match(/^https?/)) {
            var regxResult = hostReplaceRegex.exec(url);

            if (!regxResult || regxResult.length < 4 || regxResult[3].match(/.oprosso.local$/)) {
                return url;
            }

            url = url.replace(
                hostReplaceRegex,
                "$1$2$3"
                + oprossoDomain
                + "$4"
            );
        }

        return url;
    }

    function wrapFetch() {
        var defaultFetch = window.fetch;

        window.fetch = function (input, init) {
            if (typeof input !== "string") {
                return defaultFetch(input, init);
            }

            input = addOprossoSubdomain(input);

            return defaultFetch.apply(this, [input, init]);
        };
    }

    function wrapXmlHttpOpen() {
        var defaultOpen = XMLHttpRequest.prototype.open;

        XMLHttpRequest.prototype.open = function (method, url, async, username, password) {

            url = addOprossoSubdomain(url);

            return defaultOpen.apply(this, [method, url, async, username, password]);
        }
    }

    function wrapWebSocket() {
        var ws = window.WebSocket;

        window.WebSocket = function (url, protocols) {
            url = url.replace(oprossoDomain, "");
            return new ws(url, protocols);
        };

        window.WebSocket.prototype = ws.prototype;
    }

    wrapWebSocket();

    if (!window.location.hostname.match(/figma.com/)) {
        wrapFetch();
        wrapXmlHttpOpen();
    }

    window.addEventListener("DOMContentLoaded", function() {
        document.domain = "oprosso.local";
        trySendMessage(window.location.href);
    });

    window.addEventListener("popstate", function(e) {
        trySendMessage(window.location.href);

        console.log("who petushok? me petushok? no!", e)
    });

    /* @badcode для реактивных страниц ничего умнее не придумалось */
    setInterval(moveUrlsOnSubdomain, 2000);

})(window, document);

