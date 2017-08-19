"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const constants = require("../Constants");
class FileLogRetentionUtility {
    static removeOldLogs(logsPath, appConfig, logger) {
        let logsToClean = [logsPath];
        if (appConfig.log.additionalLogPathsToClean) {
            logsToClean = logsToClean.concat(appConfig.log.additionalLogPathsToClean);
        }
        logsToClean.forEach(p => {
            if (!p.startsWith(constants.appDataDir)) {
                p = path.join(constants.appDataDir, p);
            }
            FileLogRetentionUtility.removeOldLogsInDirectory(logger, p);
        });
    }
    static removeOldLogsInDirectory(logger, logsDir) {
        fs.readdir(logsDir, (readDirError, files) => {
            if (readDirError) {
                logger.error('[FileLogRetentionUtility] Error listing logs to delete.', readDirError);
                return;
            }
            logger.info('[FileLogRetentionUtility] Listing existing log files in ', logsDir);
            files.forEach((name) => {
                let filePath = path.join(logsDir, name);
                if (name.indexOf('.log') === -1) {
                    return;
                }
                fs.lstat(filePath, (fileStatsError, stats) => {
                    if (fileStatsError) {
                        logger.error('[FileLogRetentionUtility] Error getting a log file details', fileStatsError);
                        return;
                    }
                    if (stats.mtime.getTime() < Date.now() - FileLogRetentionUtility.defaultRetentionTime) {
                        logger.info(`[FileLogRetentionUtility] Deleting ${filePath}, because of its age`);
                        fs.unlink(filePath, unlinkError => {
                            if (unlinkError) {
                                logger.error('[FileLogRetentionUtility] Error deleting the file', fileStatsError);
                            }
                        });
                    }
                });
            });
        });
    }
}
FileLogRetentionUtility.defaultRetentionTime = 1000 * 60 * 60 * 24 * 14;
exports.FileLogRetentionUtility = FileLogRetentionUtility;
