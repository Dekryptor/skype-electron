"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function forceLinksToDefaultBrowser() {
    document.addEventListener('DOMContentLoaded', function () {
        document.addEventListener('click', (ev) => {
            let el = ev.target;
            if (el.tagName.toUpperCase() === 'A') {
                el.setAttribute('target', '_blank');
            }
        });
    });
}
exports.forceLinksToDefaultBrowser = forceLinksToDefaultBrowser;
function disableDragAndDrop() {
    document.addEventListener('dragover', function (event) {
        event.preventDefault();
        return false;
    }, false);
    document.addEventListener('drop', function (event) {
        event.preventDefault();
        return false;
    }, false);
}
exports.disableDragAndDrop = disableDragAndDrop;
