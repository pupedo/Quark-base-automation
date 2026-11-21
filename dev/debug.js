var CONFIG = FileTools.ReadJSON(__dir__ + "config.json");
var DEBUG = CONFIG["dev"] === true;

function log(msg) {
    Logger.Log("[Quark] " + msg, "Quark");
}

function debugLog(msg) {
    if (!DEBUG) return;
    Logger.Log(msg, "Quark");
}

function debugLog_breed(msg) {
    if (!DEBUG) return;
    Logger.Log("[BREED] " + msg, "Quark");
}

function debugLog_trough(msg) {
    if (!DEBUG) return;
    Logger.Log("[TROUGH] " + msg, "Quark");
}

function debugLog_chute(msg) {
    if (!DEBUG) return;
    Logger.Log("[CHUTE] " + msg, "Quark");
}
