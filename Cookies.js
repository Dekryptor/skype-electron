"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("./logger/Logger");
function removeMSACookies(session) {
    if (!session) {
        Logger_1.getInstance().info('Null session when removing MSA cookies');
        return;
    }
    if (!session.cookies) {
        Logger_1.getInstance().info('Null cookies when removing MSA cookies');
        return;
    }
    function deleteCookie(cookie) {
        if (!cookie) {
            return;
        }
        let url = 'http' + (cookie.secure ? 's' : '') + '://' + cookie.domain + cookie.path;
        try {
            session.cookies.remove(url, cookie.name, function (error) {
                if (error) {
                    Logger_1.getInstance().error('Removing cookie: ', error);
                }
            });
        }
        catch (e) {
            Logger_1.getInstance().error(e.message);
        }
    }
    session.cookies.get({ name: 'WLSSC' }, function (error, cookies) {
        if (error) {
            Logger_1.getInstance().error('getCookies error: ', error);
            return;
        }
        if (cookies) {
            for (let cookie of cookies) {
                deleteCookie(cookie);
            }
        }
        else {
            Logger_1.getInstance().info('WLSSC not found');
        }
    });
}
exports.removeMSACookies = removeMSACookies;
