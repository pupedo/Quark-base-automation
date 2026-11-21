LIBRARY({
    name: "CoreKit",
    version: 3,
    shared: true,
    api: "CoreEngine"
});

var CoreKit = {};

/*
 * ============================================================================
 * CoreKit — base utilities + item identity + engine feature detection
 * ============================================================================
 * Unifies number formatting, coordinate helpers, item identity (uid/extra key),
 * extra matching across incompatible mod conventions, block facing/boxes, and
 * engine feature detection (chunk-load safety).
 * ============================================================================
 */

/* ----------------------------------------------------------------- util --- */

CoreKit.util = {};

CoreKit.util.clamp = function (value, min, max) {
    if (typeof value != "number" || isNaN(value)) return min;
    return value < min ? min : (value > max ? max : value);
};

CoreKit.util.cutNumber = function (num, forGrid) {
    return num > 999 ? (num > 999999 ? (num > 999999999 ?
        ((num / 1000000000) % 1 && (!forGrid || num / 1000000000 <= 9.95) ?
            (num / 1000000000).toFixed(1) : Math.round(num / 1000000000)) + "B" :
        ((num / 1000000) % 1 && (!forGrid || num / 1000000 <= 9.95) ?
            (num / 1000000).toFixed(1) : Math.round(num / 1000000)) + "M") :
        ((num / 1000) % 1 && (!forGrid || num / 1000 <= 9.95) ?
            (num / 1000).toFixed(1) : Math.round(num / 1000)) + "K") : num;
};

CoreKit.util.numberWithCommas = function (num) {
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

var _ckUidCounter = 0;

CoreKit.util.uid = function (prefix) {
    _ckUidCounter++;
    return (prefix || "uid") + "_" + Date.now() + "_" + _ckUidCounter + "_" +
        Math.floor(Math.random() * 1000000);
};

CoreKit.util.deepClone = function (value, seen) {
    if (value === null || typeof value != "object") return value;
    if (typeof value.clone == "function") {
        try { return value.clone(); } catch (e) {}
    }
    seen = seen || [];
    for (var i = 0; i < seen.length; i++) {
        if (seen[i][0] === value) return seen[i][1];
    }
    var result;
    if (Array.isArray(value)) {
        result = [];
        seen.push([value, result]);
        for (var a = 0; a < value.length; a++) {
            result.push(CoreKit.util.deepClone(value[a], seen));
        }
    } else {
        result = {};
        seen.push([value, result]);
        var keys = Object.keys(value);
        for (var k = 0; k < keys.length; k++) {
            result[keys[k]] = CoreKit.util.deepClone(value[keys[k]], seen);
        }
    }
    return result;
};

/** Shallow-fill missing keys of `obj` from `src`. Returns obj. */
CoreKit.util.fillDefaults = function (obj, src) {
    if (!obj || !src) return obj;
    for (var key in src) {
        if (obj[key] === undefined) obj[key] = src[key];
    }
    return obj;
};

/** MD5 hex digest of a byte array/string (engine only); null without Java. */
CoreKit.util.md5 = function (bytes) {
    if (typeof java == "undefined" || !java.security || !java.security.MessageDigest) return null;
    try {
        var digest = java.security.MessageDigest.getInstance("md5");
        digest.update(bytes);
        var byted = digest.digest();
        var sb = new java.lang.StringBuilder();
        for (var i = 0; i < byted.length; i++) {
            var h = java.lang.Integer.toHexString(0xFF & byted[i]);
            if (h.length < 2) h = "0" + h;
            sb.append(h);
        }
        return String(sb.toString());
    } catch (e) {
        return null;
    }
};

/* --------------------------------------------------------------- locale --- */

CoreKit.locale = {};

/**
 * Translation.translate + printf-style formatting (%s/%d). When the Java APIs
 * are unavailable (tests) falls back to a plain placeholder replacement.
 */
CoreKit.locale.translate = function (str, args) {
    var text = String(str == undefined ? "" : str);
    try {
        if (typeof Translation != "undefined" && Translation.translate) text = String(Translation.translate(text));
    } catch (e) {}
    if (args === undefined) return text;
    if (!Array.isArray(args)) args = [args];
    try {
        if (typeof java != "undefined" && java.lang && java.lang.String) {
            return String(java.lang.String.format(text, args.map(function (v) { return "" + v; })));
        }
    } catch (e) {}
    var i = 0;
    return text.replace(/%[sd]/g, function () {
        return i < args.length ? "" + args[i++] : "";
    });
};

/** European numeral-verb form (count % 10 = 1, except 11). */
CoreKit.locale.isNumeralVerb = function (count) {
    count = Math.abs(Number(count) || 0);
    return count % 10 == 1 && count % 100 != 11;
};

/** European numeral-many form (count % 10 = 0 or >= 5, except the teens). */
CoreKit.locale.isNumeralMany = function (count) {
    count = Math.abs(Number(count) || 0);
    return count % 10 == 0 || count % 10 >= 5 || count % 100 - count % 10 == 10;
};

/**
 * Pick the form by count (zero / verb / many / little) and translate it,
 * formatting with `args` (default `[count]`).
 */
CoreKit.locale.translateCounter = function (count, whenZero, whenVerb, whenLittle, whenMany, args) {
    count = Number(count) || 0;
    var key = count == 0 ? whenZero
        : CoreKit.locale.isNumeralVerb(count) ? whenVerb
        : CoreKit.locale.isNumeralMany(count) ? whenMany
        : whenLittle;
    return CoreKit.locale.translate(key, args === undefined ? [count] : args);
};

/**
 * Case-insensitive search normalization — the single JS implementation for
 * search call-sites. No trim(), to stay behaviour-identical with the Java
 * search in the mod's native path.
 */
CoreKit.locale.normalizeSearch = function (value) {
    if (value === null || value === undefined) return "";
    return String(value).toLowerCase();
};

/* ------------------------------------------------------------------ net --- */

CoreKit.net = {};

/** Decode a Base64 string to a Java string (engine only); null without Java. */
CoreKit.net.base64Decode = function (encoded) {
    try {
        if (typeof android != "undefined" && android.util && android.util.Base64) {
            return String(android.util.Base64.decode(String(encoded).replace(/\\n/g, "").replace(/\n/g, ""), 0));
        }
    } catch (e) {}
    return null;
};

/**
 * GitHub contents API client over the (blocking) `sendHttp`.
 * options: { ref }. Each method returns null on any failure; when the transport is
 * unavailable (tests) every method returns null.
 */
CoreKit.net.github = function (user, repo, options) {
    options = options || {};
    var base = "https://api.github.com/repos/" + user + "/" + repo + "/contents/";
    function read(path) {
        try {
            if (typeof sendHttp == "undefined") return null;
            var raw = sendHttp(base + path + (options.ref ? "?ref=" + options.ref : ""));
            if (!raw) return null;
            var data = JSON.parse(raw);
            return data && data.content && data.encoding == "base64" ? data : null;
        } catch (e) {
            return null;
        }
    }
    function contentOf(path) {
        var data = read(path);
        return data ? String(data.content).replace(/\\n/g, "").replace(/\n/g, "") : null;
    }
    return {
        getJson: function (path) {
            var text = CoreKit.net.base64Decode(contentOf(path));
            if (text == null) return null;
            try { return JSON.parse(text); } catch (e) { return null; }
        },
        getFile: function (path) {
            return CoreKit.net.base64Decode(contentOf(path));
        },
        /** Raw Base64 for image registration (e.g. UiCore.registerTexture). */
        getImageBase64: function (path) {
            return contentOf(path);
        }
    };
};

/* --------------------------------------------------------------- coords --- */

CoreKit.coords = {};

CoreKit.coords.sides = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 0, 1],
    [0, 0, -1],
    [0, 1, 0],
    [0, -1, 0]
];

CoreKit.coords.cts = function (coords) {
    return coords.x + (coords.y != null ? "," + coords.y : "") + "," + coords.z;
};

CoreKit.coords.parseCts = function (str) {
    var parts = String(str).split(",");
    if (parts.length == 2) {
        var x2 = parseInt(parts[0]), z2 = parseInt(parts[1]);
        if (isNaN(x2) || isNaN(z2)) return null;
        return { x: x2, z: z2 };
    }
    if (parts.length == 3) {
        var x3 = parseInt(parts[0]), y3 = parseInt(parts[1]), z3 = parseInt(parts[2]);
        if (isNaN(x3) || isNaN(y3) || isNaN(z3)) return null;
        return { x: x3, y: y3, z: z3 };
    }
    return null;
};

/**
 * Dimension-safe coordinate key: "<dim>:<x[,y],z>".
 * Accepts `key(dim, {x,y,z})`, `key(dim, x, y, z)` or `key(dim, "x,y,z")`.
 * null/undefined dimension normalizes to 0 (the engine default dimension).
 * The dimension is NOT part of cts() — this is the additive key for maps that
 * must not collide across dimensions.
 */
CoreKit.coords.key = function (dim, coordsOrX, y, z) {
    var coordsPart;
    if (typeof coordsOrX == "string") coordsPart = coordsOrX;
    else if (coordsOrX && typeof coordsOrX == "object") coordsPart = CoreKit.coords.cts(coordsOrX);
    else coordsPart = CoreKit.coords.cts({ x: coordsOrX, y: y, z: z });
    return (dim === undefined || dim === null ? 0 : dim) + ":" + coordsPart;
};

CoreKit.coords.compare = function (coords1, coords2) {
    if (!coords1 || !coords2) return false;
    return coords1.x == coords2.x && coords1.y == coords2.y && coords1.z == coords2.z;
};

/* ---------------------------------------------------------------- Items --- */

CoreKit.Items = {};

/* ---------------------------------------------------------- ItemContent --- */

/*
 * Canonical projection of an extra to a deterministic string: enchants, $mod
 * custom data, $rs.nbt (or a readable compound tag) and the custom name.
 * content() returns "" for a missing extra and null for unsupported content
 * (byte/int array compounds). fold() copies a readable compound tag into
 * $rs.nbt so it survives save/network; fold() does not change keyOf().
 */
CoreKit.ItemContent = (function () {
    var RESERVED_PREFIX = "$rs";
    var RS_NBT_KEY = "$rs.nbt";
    var LEGACY_DISK_KEY = "rsDiskUuid";
    var MAX_JSON_DEPTH = 32;

    /** $rs* and the legacy disk key are control keys, not content. */
    function isReservedKey(key) {
        key = String(key);
        if (key === LEGACY_DISK_KEY) return true;
        if (key.indexOf(RESERVED_PREFIX) !== 0) return false;
        return key !== RS_NBT_KEY;
    }

    /** Deterministic JSON: keys sorted recursively. */
    function canonJson(value) {
        if (value === null || value === undefined) return "null";
        var type = typeof value;
        if (type === "number") return isFinite(value) ? String(value) : "null";
        if (type === "boolean") return value ? "true" : "false";
        if (type === "string") return JSON.stringify(value);
        if (Object.prototype.toString.call(value) === "[object Array]") {
            var items = [];
            for (var i = 0; i < value.length; i++) items.push(canonJson(value[i]));
            return "[" + items.join(",") + "]";
        }
        if (type === "object") {
            var keys = [];
            for (var key in value) if (Object.prototype.hasOwnProperty.call(value, key)) keys.push(key);
            keys.sort();
            var parts = [];
            for (var ki = 0; ki < keys.length; ki++) {
                parts.push(JSON.stringify(keys[ki]) + ":" + canonJson(value[keys[ki]]));
            }
            return "{" + parts.join(",") + "}";
        }
        return "null";
    }

    function canonicalJsonFailure(reason, onCycle) {
        if (onCycle === "throw") {
            throw new Error("CoreKit.ItemContent.canonicalJson: " + reason);
        }
        return "null";
    }

    function canonicalJsonValue(value, depth, ancestors, maxDepth, onCycle) {
        if (value === null || value === undefined) return "null";
        var type = typeof value;
        if (type === "number") return isFinite(value) ? String(value) : "null";
        if (type === "boolean") return value ? "true" : "false";
        if (type === "string") return JSON.stringify(value);
        if (type !== "object") return "null";
        if (depth > maxDepth) return canonicalJsonFailure("max depth exceeded", onCycle);
        for (var a = 0; a < ancestors.length; a++) {
            if (ancestors[a] === value) return canonicalJsonFailure("cycle detected", onCycle);
        }
        ancestors.push(value);
        var out;
        if (Object.prototype.toString.call(value) === "[object Array]") {
            var items = [];
            for (var i = 0; i < value.length; i++) {
                items.push(canonicalJsonValue(value[i], depth + 1, ancestors, maxDepth, onCycle));
            }
            out = "[" + items.join(",") + "]";
        } else {
            var keys = [];
            for (var key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) keys.push(key);
            }
            keys.sort();
            var parts = [];
            for (var ki = 0; ki < keys.length; ki++) {
                parts.push(JSON.stringify(keys[ki]) + ":" +
                    canonicalJsonValue(value[keys[ki]], depth + 1, ancestors, maxDepth, onCycle));
            }
            out = "{" + parts.join(",") + "}";
        }
        ancestors.pop();
        return out;
    }

    /**
     * Public canonJson with a cycle/depth guard; content() keeps using the
     * unguarded internal canonJson. options: { maxDepth: 32, onCycle:
     * "null" | "throw" }. A cycle or an object deeper than maxDepth serializes
     * as "null" (onCycle "null") or raises a controlled Error ("throw").
     */
    function canonicalJson(value, options) {
        options = options || {};
        var maxDepth = typeof options.maxDepth === "number" && isFinite(options.maxDepth) &&
            options.maxDepth >= 0 ? Math.floor(options.maxDepth) : MAX_JSON_DEPTH;
        return canonicalJsonValue(value, 0, [], maxDepth,
            options.onCycle === "throw" ? "throw" : "null");
    }

    /** Drops control keys and $rs.nbt; returns null when nothing is left. */
    function filterMod(mod) {
        if (mod == null || typeof mod !== "object") return null;
        if (Object.prototype.toString.call(mod) === "[object Array]") return null;
        var out = {}, count = 0;
        for (var key in mod) {
            if (!Object.prototype.hasOwnProperty.call(mod, key)) continue;
            if (isReservedKey(key) || key === RS_NBT_KEY) continue;
            out[key] = mod[key];
            count++;
        }
        return count ? out : null;
    }

    function nbtNumber(value) {
        var num = Number(value);
        return isFinite(num) ? num : 0;
    }

    /** Typed NBT value; holder is a compound (string ref) or list (index ref). */
    function nbtTypedEntry(holder, ref, type) {
        switch (type) {
            case 1: return { t: "b", v: nbtNumber(holder.getByte(ref)) };
            case 2: return { t: "s", v: nbtNumber(holder.getShort(ref)) };
            case 3: return { t: "i", v: nbtNumber(holder.getInt(ref)) };
            case 4: return { t: "l", v: String(holder.getInt64(ref)) };
            case 5: return { t: "f", v: String(holder.getFloat(ref)) };
            case 6: return { t: "d", v: String(holder.getDouble(ref)) };
            case 8: return { t: "str", v: String(holder.getString(ref)) };
            case 9: {
                var list = nbtTypedList(holder.getListTag(ref));
                return list ? { t: "list", v: list } : false;
            }
            case 10: {
                var compound = nbtTypedCompound(holder.getCompoundTag(ref), true);
                return compound ? { t: "cmp", v: compound } : false;
            }
            default: return false;
        }
    }

    function nbtTypedList(listTag) {
        if (listTag == null) return null;
        var length;
        try { length = listTag.length(); } catch (e) { return null; }
        var out = [];
        for (var i = 0; i < length; i++) {
            var typed;
            try { typed = nbtTypedEntry(listTag, i, listTag.getValueType(i)); } catch (e) { return null; }
            if (typed === false) return null;
            out.push(typed);
        }
        return out;
    }

    function nbtTypedCompound(tag, allowEmpty) {
        if (tag == null) return null;
        var keys;
        try { keys = tag.getAllKeys(); } catch (e) { return null; }
        if (keys == null || typeof keys.length !== "number") return null;
        if (keys.length === 0) return allowEmpty ? {} : null;
        var out = {};
        for (var i = 0; i < keys.length; i++) {
            var key = String(keys[i]), typed;
            try { typed = nbtTypedEntry(tag, key, tag.getValueType(key)); } catch (e) { return null; }
            if (typed === false) return null;
            out[key] = typed;
        }
        return out;
    }

    function nbtCanonical(tag) {
        var compound = nbtTypedCompound(tag, false);
        return compound == null ? null : canonJson(compound);
    }

    function content(extra) {
        if (!extra) return "";
        var cached = extra.__rsContent;
        if (cached !== undefined) return cached;
        var name = null;
        try {
            if (typeof extra.getCustomName == "function") {
                var customName = extra.getCustomName();
                if (customName != null && String(customName).length > 0) name = String(customName);
            }
        } catch (e) {}
        var enchants = [];
        try {
            if (typeof extra.getEnchants == "function") {
                var map = extra.getEnchants();
                for (var key in map) {
                    var id = Number(key), level = Number(map[key]);
                    if (isFinite(id) && isFinite(level) && level > 0) enchants.push([id, level]);
                }
            }
        } catch (e) {}
        enchants.sort(function (a, b) { return a[0] - b[0]; });
        var mod = null, modUnsupported = false;
        try {
            if (typeof extra.getAllCustomData == "function") {
                var raw = extra.getAllCustomData();
                if (raw != null && String(raw).length > 0) {
                    var parsed = null, parsedOk = true;
                    try {
                        parsed = JSON.parse(String(raw));
                    } catch (e) {
                        parsedOk = false;
                    }
                    if (!parsedOk || parsed === null || typeof parsed !== "object" ||
                        Object.prototype.toString.call(parsed) === "[object Array]") {
                        modUnsupported = true;
                    } else {
                        mod = filterMod(parsed);
                    }
                }
            }
        } catch (e) { modUnsupported = true; }
        /* Corrupt custom data cannot be keyed: mark it unsupported. */
        if (modUnsupported) {
            try { extra.__rsContent = null; } catch (e) {}
            return null;
        }
        var compound = null;
        try {
            if (typeof extra.getString == "function") {
                var folded = extra.getString(RS_NBT_KEY);
                if (folded != null && String(folded).length > 0) compound = String(folded);
            }
            if (compound == null && typeof extra.getCompoundTag == "function") {
                var tag = extra.getCompoundTag();
                if (tag != null) {
                    compound = nbtCanonical(tag);
                    if (compound == null) { try { extra.__rsContent = null; } catch (e) {} return null; }
                }
            }
        } catch (e) { try { extra.__rsContent = null; } catch (e2) {} return null; }
        var out = "v1|" + canonJson({ e: enchants, m: mod, c: compound, n: name });
        try { extra.__rsContent = out; } catch (e) {}
        return out;
    }

    /**
     * Debug projection of the cached content() string: { version, e, m, c, n,
     * unsupported }. No NBT is read again; the "v1|" tail is parsed once. An
     * empty extra and unsupported content are reported instead of parsed.
     */
    function contentInfo(extra) {
        var value = content(extra);
        if (value === "") return { version: 1, empty: true, unsupported: false };
        if (value == null) return { version: 1, empty: false, unsupported: true };
        if (value.slice(0, 3) !== "v1|") {
            return { version: 1, content: value, parseError: true };
        }
        var parsed;
        try { parsed = JSON.parse(value.slice(3)); } catch (e) {
            return { version: 1, content: value, parseError: true };
        }
        if (parsed == null || typeof parsed !== "object") {
            return { version: 1, content: value, parseError: true };
        }
        return {
            version: 1,
            e: parsed.e,
            m: parsed.m,
            c: parsed.c,
            n: parsed.n,
            unsupported: false
        };
    }

    function keyOf(item) {
        if (!item) return "";
        var value = content(item.extra);
        if (value == null) return item.id + ":" + item.data + ":!unsupported";
        return item.id + ":" + item.data + ":" + value;
    }

    function same(a, b) {
        return keyOf(a) === keyOf(b);
    }

    /** Content equality for two extras; unsupported content never matches. */
    function sameExtra(a, b) {
        var ca = content(a), cb = content(b);
        if (ca == null || cb == null) return false;
        return ca === cb;
    }

    function fold(extra) {
        if (!extra) return true;
        var tag = null;
        try { if (typeof extra.getCompoundTag == "function") tag = extra.getCompoundTag(); } catch (e) { return false; }
        if (tag == null) return true;
        var canonical = nbtCanonical(tag);
        if (canonical == null) return false;
        try {
            var current = (typeof extra.getString == "function") ? extra.getString(RS_NBT_KEY) : null;
            if (current != null && String(current) === canonical) return true;
            if (typeof extra.putString != "function") return false;
            extra.putString(RS_NBT_KEY, canonical);
            /* The wrapper changed: drop the memoized content. */
            try { extra.__rsContent = undefined; } catch (e) {}
            return true;
        } catch (e) { return false; }
    }

    /**
     * Drop the memoized content projection after a direct mutation.
     * Returns true when the extra exists and the cache could be cleared.
     */
    function invalidate(extra) {
        if (!extra) return false;
        try { extra.__rsContent = undefined; } catch (e) { return false; }
        return true;
    }

    /**
     * fold() on a private copy: the caller's extra is never mutated.
     * Returns the folded copy, or null when copy/fold is unavailable or fails.
     */
    function foldCopy(extra) {
        if (!extra || typeof extra.copy != "function") return null;
        var copy;
        try { copy = extra.copy(); } catch (e) { return null; }
        if (!copy || copy === extra) return null;
        if (!fold(copy)) return null;
        return copy;
    }

    /**
     * Plain JSON shape { e, n, m } compatible with the RSE storage codec.
     * Reads from a folded COPY whenever the extra carries a compound tag, so
     * the live extra is never mutated and $rs.nbt ends up in the raw `m`.
     * `e` is sorted by enchant id; `m` stays the raw getAllCustomData() string.
     * options: { fold: true, includeEmpty: false }.
     * Returns null when a getter fails or a required copy cannot be made.
     */
    function toPlain(extra, options) {
        if (!extra) return null;
        options = options || {};
        var includeEmpty = options.includeEmpty === true;
        var source = extra;
        if (options.fold !== false) {
            var hasCompound;
            try {
                hasCompound = typeof extra.getCompoundTag == "function" &&
                    extra.getCompoundTag() != null;
            } catch (e) {
                return null;
            }
            if (hasCompound) {
                source = foldCopy(extra);
                if (!source) return null;
            }
        }
        var enchants = [];
        try {
            if (typeof source.getEnchants == "function") {
                var enchantMap = source.getEnchants();
                if (enchantMap != null) {
                    for (var key in enchantMap) {
                        if (!Object.prototype.hasOwnProperty.call(enchantMap, key)) continue;
                        var id = Number(key), level = Number(enchantMap[key]);
                        if (isFinite(id) && isFinite(level) && level > 0) enchants.push([id, level]);
                    }
                }
            }
        } catch (e2) {
            return null;
        }
        enchants.sort(function (a, b) { return a[0] - b[0]; });
        var name = "";
        try {
            if (typeof source.getCustomName == "function") {
                var customName = source.getCustomName();
                if (customName != null && String(customName).length > 0) name = String(customName);
            }
        } catch (e3) {
            return null;
        }
        var mod = "";
        try {
            if (typeof source.getAllCustomData == "function") {
                var raw = source.getAllCustomData();
                if (raw != null && String(raw).length > 0) mod = String(raw);
            }
        } catch (e4) {
            return null;
        }
        var plain = {};
        if (enchants.length || includeEmpty) plain.e = enchants;
        if (name.length || includeEmpty) plain.n = name;
        if (mod.length || includeEmpty) plain.m = mod;
        return plain;
    }

    /** Build a fresh ItemExtraData from a plain { e, n, m } object; null when invalid. */
    function fromPlain(plain) {
        if (!plain || typeof plain !== "object" ||
            Object.prototype.toString.call(plain) === "[object Array]") return null;
        var extra;
        try { extra = new ItemExtraData(); } catch (e) { return null; }
        if (!extra) return null;
        if (Object.prototype.toString.call(plain.e) === "[object Array]") {
            for (var i = 0; i < plain.e.length; i++) {
                var pair = plain.e[i];
                if (!pair || typeof pair.length !== "number" || pair.length < 2) continue;
                var id = Number(pair[0]), level = Number(pair[1]);
                if (!isFinite(id) || !isFinite(level)) continue;
                try {
                    if (typeof extra.addEnchant != "function") return null;
                    extra.addEnchant(id, level);
                } catch (e2) {
                    return null;
                }
            }
        }
        if (plain.n != null) {
            try {
                if (String(plain.n).length > 0) {
                    if (typeof extra.setCustomName != "function") return null;
                    extra.setCustomName(String(plain.n));
                }
            } catch (e3) { return null; }
        }
        if (plain.m != null && (typeof plain.m === "string" || typeof plain.m === "object")) {
            try {
                var mod = typeof plain.m === "string" ? plain.m : JSON.stringify(plain.m);
                if (mod == null) return null;
                if (mod.length > 0) {
                    if (typeof extra.setAllCustomData != "function") return null;
                    extra.setAllCustomData(mod);
                }
            } catch (e4) { return null; }
        }
        return extra;
    }

    /** True when the value is strict JSON (no undefined/functions/cycles/NaN). */
    function isCleanJson(value, depth, ancestors) {
        if (value === null) return true;
        var type = typeof value;
        if (type === "boolean" || type === "string") return true;
        if (type === "number") return isFinite(value);
        if (type !== "object") return false;
        if (depth > MAX_JSON_DEPTH) return false;
        for (var a = 0; a < ancestors.length; a++) {
            if (ancestors[a] === value) return false;
        }
        ancestors.push(value);
        var clean = true;
        if (Object.prototype.toString.call(value) === "[object Array]") {
            for (var i = 0; i < value.length; i++) {
                if (!isCleanJson(value[i], depth + 1, ancestors)) { clean = false; break; }
            }
        } else if (Object.prototype.toString.call(value) === "[object Object]") {
            for (var key in value) {
                if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
                if (!isCleanJson(value[key], depth + 1, ancestors)) { clean = false; break; }
            }
        } else {
            clean = false;
        }
        ancestors.pop();
        return clean;
    }

    /**
     * Write a JSON value under a non-reserved key. Top-level strings use
     * putString(JSON.stringify()) because putSerializable omits the quotes and
     * getSerializable would fail. Objects/arrays use putSerializable when
     * available, otherwise the putString(JSON.stringify()) fallback.
     * putObject is never used (private, not injected on b128).
     */
    function putJson(extra, key, value) {
        if (!extra || key === undefined || key === null) return false;
        key = String(key);
        if (!key) return false;
        if (isReservedKey(key) || key === RS_NBT_KEY) return false;
        try {
            if (!isCleanJson(value, 0, [])) return false;
        } catch (e) {
            return false;
        }
        try {
            if (typeof value === "string" || value === null || typeof value !== "object") {
                if (typeof extra.putString != "function") return false;
                extra.putString(key, JSON.stringify(value));
            } else if (typeof extra.putSerializable == "function") {
                extra.putSerializable(key, value);
            } else if (typeof extra.putString == "function") {
                extra.putString(key, JSON.stringify(value));
            } else {
                return false;
            }
        } catch (e2) {
            return false;
        }
        invalidate(extra);
        return true;
    }

    /** Read a JSON value; invalid JSON / missing key / any failure -> fallback. */
    function getJson(extra, key, fallback) {
        if (!extra || key === undefined || key === null) return fallback;
        key = String(key);
        if (!key) return fallback;
        try {
            if (typeof extra.getSerializable == "function") {
                var parsed = extra.getSerializable(key);
                if (parsed !== undefined && parsed !== null) return parsed;
            }
        } catch (e) {}
        try {
            if (typeof extra.getString == "function") {
                var raw = extra.getString(key);
                if (raw !== undefined && raw !== null && String(raw).length > 0) {
                    return JSON.parse(String(raw));
                }
            }
        } catch (e2) {}
        return fallback;
    }

    function isSupported(extra) {
        if (!extra) return true;
        try {
            if (typeof extra.getString == "function") {
                var folded = extra.getString(RS_NBT_KEY);
                if (folded != null && String(folded).length > 0) return true;
            }
            if (typeof extra.getCompoundTag == "function") {
                var tag = extra.getCompoundTag();
                if (tag != null && nbtCanonical(tag) == null) return false;
            }
        } catch (e) { return false; }
        return true;
    }

    var DISPLAY = {
        groupKey: function (item) { return keyOf(item); }
    };

    return {
        content: content,
        contentInfo: contentInfo,
        keyOf: keyOf,
        same: same,
        sameExtra: sameExtra,
        fold: fold,
        foldCopy: foldCopy,
        invalidate: invalidate,
        toPlain: toPlain,
        fromPlain: fromPlain,
        putJson: putJson,
        getJson: getJson,
        canonicalJson: canonicalJson,
        nbtCanonical: nbtCanonical,
        isSupported: isSupported,
        isReservedKey: isReservedKey,
        DISPLAY: DISPLAY
    };
})();

/** Parse a uid into { id, data, content }; accepts "id:data:content" and legacy "id_data[_rest]". */
CoreKit.Items.parseUid = function (uid) {
    uid = String(uid || "");
    var colon = uid.indexOf(":");
    if (colon !== -1) {
        var second = uid.indexOf(":", colon + 1);
        var idNum = parseInt(uid.slice(0, colon), 10);
        var dataNum = second === -1 ? parseInt(uid.slice(colon + 1), 10) : parseInt(uid.slice(colon + 1, second), 10);
        return {
            id: isFinite(idNum) ? idNum : 0,
            data: isFinite(dataNum) ? dataNum : 0,
            content: second === -1 ? "" : uid.slice(second + 1)
        };
    }
    var parts = uid.split("_");
    return {
        id: parseInt(parts[0], 10) || 0,
        data: parseInt(parts[1], 10) || 0,
        content: parts.length > 2 ? parts.slice(2).join("_") : ""
    };
};

CoreKit.Items.extraKey = function (extra) {
    var value = CoreKit.ItemContent.content(extra);
    return value == null ? "" : value;
};

CoreKit.Items.uidOf = function (item) {
    return CoreKit.ItemContent.keyOf(item);
};

CoreKit.Items.uidInfo = function (item) {
    if (!item) return { uid: "", extraKey: "", extra: null };
    var value = CoreKit.ItemContent.content(item.extra);
    return {
        uid: CoreKit.ItemContent.keyOf(item),
        extraKey: value == null ? "" : value,
        extra: item.extra || null
    };
};

/**
 * The three UID shapes used across the ecosystem, without changing
 * uidOf()/parseUid(): canonical "id:data:content", legacy "id_data[_value]"
 * (getValue() only when the engine injects it; otherwise id_data) and the
 * requester prefix "id:data:".
 */
CoreKit.Items.uidVariants = function (item) {
    var id = item && item.id !== undefined ? item.id : 0;
    var data = item && item.data !== undefined ? item.data : 0;
    var legacy = id + "_" + data;
    try {
        if (item && item.extra && typeof item.extra.getValue == "function") {
            var extraValue = item.extra.getValue();
            if (extraValue !== undefined && extraValue !== null && extraValue != 0) {
                legacy += "_" + extraValue;
            }
        }
    } catch (e) {}
    return {
        canonical: CoreKit.ItemContent.keyOf(item),
        legacy: legacy,
        prefix: id + ":" + (data || 0) + ":"
    };
};

CoreKit.Items.fullExtraToString = function (extra) {
    var value = CoreKit.ItemContent.content(extra);
    return value == null ? "" : value;
};

CoreKit.Items.isExtraEmpty = function (extra) {
    var value = CoreKit.ItemContent.content(extra);
    return value == null || value === "";
};

CoreKit.Items.match = function (a, b, options) {
    options = options || {};
    if (!a || !b) return false;
    if (a.id !== b.id) return false;
    if (options.wildcardData === false) {
        if (a.data !== b.data) return false;
    } else {
        if (a.data !== b.data && a.data !== -1 && b.data !== -1) return false;
    }
    if (options.matchExtra === false) return true;
    return CoreKit.ItemContent.sameExtra(a.extra, b.extra);
};

/**
 * Predicate factory over item identity. policy: { id, data, extra,
 * ignoreItemData, matchExtra }. data -1 is a wildcard; extra is "ignore"
 * (default), "match" or "strict"; matchExtra true is an alias for "match";
 * ignoreItemData skips id/data and compares extra only. match/strict need a
 * reference item (second argument, or policy.item/policy.reference) and throw
 * when it is missing, instead of silently matching.
 */
CoreKit.Items.filter = function (policy, referenceItem) {
    policy = policy || {};
    var extraPolicy = policy.extra || (policy.matchExtra === true ? "match" : "ignore");
    if (extraPolicy !== "ignore" && extraPolicy !== "match" && extraPolicy !== "strict") {
        throw new Error("CoreKit.Items.filter: unknown extra policy '" + extraPolicy + "'");
    }
    var reference = referenceItem || policy.item || policy.reference || null;
    if (extraPolicy !== "ignore" && !reference) {
        throw new Error("CoreKit.Items.filter: extra policy '" + extraPolicy + "' requires a reference item");
    }
    var id = policy.id;
    var hasIdConstraint = policy.id !== undefined && policy.id !== null;
    var data = policy.data === undefined ? -1 : policy.data;
    var ignoreItemData = policy.ignoreItemData === true;
    return function (item) {
        if (!item) return false;
        if (!ignoreItemData) {
            if (hasIdConstraint && item.id !== id) return false;
            if (data !== -1 && item.data !== data) return false;
        }
        if (extraPolicy === "ignore") return true;
        if (extraPolicy === "strict" && item.extra === reference.extra) return true;
        return CoreKit.ItemContent.sameExtra(item.extra, reference.extra);
    };
};

CoreKit.Items.mergeable = function (a, b) {
    if (!a || !b || a.id !== b.id || a.data !== b.data) return false;
    return CoreKit.ItemContent.sameExtra(a.extra, b.extra);
};

/* ------------------------------------------------------------- Inventory - */

/**
 * Player inventory scan, generalized via Items.match. Supported signatures:
 *   scan(player, id, data, extra, list, reverse)
 *   scan(player, id, data, list, reverse)
 *   scan(player, matcher, list, reverse)
 */
CoreKit.Inventory = {
    scan: function (player, id, data, extra, list, reverse) {
        if (typeof id == "function") {
            var matcher = id;
            list = data;
            reverse = extra;
            var result = [];
            var direction = reverse ? -1 : 1;
            for (var i = reverse ? 35 : 0; reverse ? i >= 0 : i <= 35; i += direction) {
                var slot = player.getInventorySlot(i);
                if (slot.id != 0 && matcher(slot, i)) {
                    if (list) result.push({ id: slot.id, data: slot.data, extra: slot.extra, count: slot.count, slot: i });
                    else return { id: slot.id, data: slot.data, extra: slot.extra, count: slot.count, slot: i };
                }
            }
            return list ? result : null;
        }
        if (typeof data != "number") data = -1;
        if (typeof id != "number") id = -1;
        if (typeof extra == "boolean") {
            reverse = list;
            list = extra;
            extra = -1;
        }
        if (extra === undefined) extra = -1;
        var matcher2 = function (item) {
            return (item.id == id || (id == -1 && item.id != 0)) &&
                (item.data == data || data == -1) &&
                (extra === -1 || CoreKit.Items.match(item, { id: item.id, data: item.data, extra: extra }, { wildcardData: false, matchExtra: true }));
        };
        return CoreKit.Inventory.scan(player, matcher2, list, reverse);
    }
};

/* ---------------------------------------------------------------- Engine -- */

CoreKit.Engine = {};

var _ckPackVersion = null;
var _ckPackVersionRead = false;

/** Pack version (packVersionCode), read lazily from the manifest. 0 when undetermined. */
CoreKit.Engine.packVersion = function () {
    if (_ckPackVersionRead) return _ckPackVersion;
    _ckPackVersionRead = true;
    try {
        var pack = FileTools.ReadJSON(__packdir__ + "manifest.json");
        _ckPackVersion = pack && typeof pack.packVersionCode == "number" ? pack.packVersionCode : 0;
    } catch (e) {
        _ckPackVersion = 0;
    }
    return _ckPackVersion;
};

var _ckFeatures = Object.create(null);

/**
 * Feature detection with cache (a test runs only once).
 * Engine.hasFeature("isChunkLoadedAt", function(){ ...test... })
 */
CoreKit.Engine.hasFeature = function (name, testFn) {
    name = String(name);
    if (Object.prototype.hasOwnProperty.call(_ckFeatures, name)) return _ckFeatures[name];
    var value = false;
    try { value = !!testFn(); } catch (e) { value = false; }
    _ckFeatures[name] = value;
    return value;
};

/**
 * Safe chunk-loaded check on any BlockSource wrapper (some lack the method).
 */
CoreKit.Engine.safeIsChunkLoadedAt = function (blockSource, x, y, z) {
    if (blockSource && typeof blockSource.isChunkLoadedAt == "function") {
        return blockSource.isChunkLoadedAt(x, z);
    }
    if (typeof World != "undefined" && World && typeof World.isChunkLoadedAt == "function") {
        return World.isChunkLoadedAt(x, y !== null && y !== undefined ? y : 64, z);
    }
    if (blockSource && typeof blockSource.isChunkLoaded == "function") {
        return blockSource.isChunkLoaded(x >> 4, z >> 4);
    }
    if (typeof World != "undefined" && World && typeof World.isChunkLoaded == "function") {
        return World.isChunkLoaded(x >> 4, z >> 4);
    }
    return true;
};

/**
 * Runtime bitness: same detection as Utils+ flacon.
 * Environment.is64Bit() is the only signal; on 32-bit the method is
 * absent/throws and the call is treated as 32-bit.
 */
CoreKit.Engine.is64Bit = function () {
    try {
        var Environment = WRAP_JAVA("com.zhekasmirnov.horizon.compiler.packages.Environment");
        return !!Environment.is64Bit();
    } catch (e) {
        return false;
    }
};

/* ------------------------------------------------------------- blocks --- */

CoreKit.Blocks = {};

/**
 * 6-way facing meta from the delta between the placed block and the player
 * (Bedrock face convention — meta 0=SOUTH, 1=NORTH, 2=EAST, 3=WEST, 4=down,
 * 5=up). Returns 0..5.
 */
CoreKit.Blocks.facingMetaFromDelta = function (dx, dy, dz) {
    var ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
    if (ay >= ax && ay >= az) return dy > 0 ? 5 : 4;
    if (ax >= az) return dx > 0 ? 2 : 3;
    return dz > 0 ? 0 : 1;
};

/**
 * Convenience: delta from coords + player position, then the facing meta.
 * playerPos: {x, y, z} (Entity.getPosition).
 */
CoreKit.Blocks.facingMetaFromPlayer = function (coords, playerPos) {
    return CoreKit.Blocks.facingMetaFromDelta(
        playerPos.x - (coords.x + 0.5),
        playerPos.y - (coords.y + 0.5),
        playerPos.z - (coords.z + 0.5)
    );
};

/**
 * Wire/cable boxes: 6 directional quarter-width boxes + the center box, all in
 * block units (0..1). width default 0.25.
 * centerWidth is optional and applies to the center box only; it defaults to
 * width, so a single-argument call keeps the historical geometry.
 * Returns { wires: [{ side, box }], center: [x1,y1,z1,x2,y2,z2] }.
 */
CoreKit.Blocks.wireBoxes = function (width, centerWidth) {
    width = width || 0.25;
    if (centerWidth === undefined || centerWidth === null) centerWidth = width;
    var w2 = width / 2;
    var cw2 = centerWidth / 2;
    var wires = [
        { side: [1, 0, 0], box: [0.5 + w2, 0.5 - w2, 0.5 - w2, 1, 0.5 + w2, 0.5 + w2] },
        { side: [-1, 0, 0], box: [0, 0.5 - w2, 0.5 - w2, 0.5 - w2, 0.5 + w2, 0.5 + w2] },
        { side: [0, 1, 0], box: [0.5 - w2, 0.5 + w2, 0.5 - w2, 0.5 + w2, 1, 0.5 + w2] },
        { side: [0, -1, 0], box: [0.5 - w2, 0, 0.5 - w2, 0.5 + w2, 0.5 - w2, 0.5 + w2] },
        { side: [0, 0, 1], box: [0.5 - w2, 0.5 - w2, 0.5 + w2, 0.5 + w2, 0.5 + w2, 1] },
        { side: [0, 0, -1], box: [0.5 - w2, 0.5 - w2, 0, 0.5 + w2, 0.5 + w2, 0.5 - w2] }
    ];
    return {
        wires: wires,
        center: [0.5 - cw2, 0.5 - cw2, 0.5 - cw2, 0.5 + cw2, 0.5 + cw2, 0.5 + cw2]
    };
};

EXPORT("CoreKit", CoreKit);
