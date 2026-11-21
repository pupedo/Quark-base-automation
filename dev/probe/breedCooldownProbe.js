(function () {
    var PREFIX = "[QCOOLDOWN] ";
    var ticks = 0;
    var done = false;

    function log(msg) {
        Logger.Log(PREFIX + msg, "Quark");
    }

    function readCooldown(uid) {
        try {
            var tag = Entity.getCompoundTag(uid);
            if (tag) return tag.getInt("BreedCooldown");
        } catch (e) {
            log("read error uid=" + uid + ": " + e);
        }
        return -1;
    }

    function findEligibleCow() {
        try {
            var all = Entity.getAll();
            for (var i = 0; i < all.length; i++) {
                var uid = all[i];
                if (!Entity.isExist(uid)) continue;
                if (Entity.getType(uid) !== EEntityType.COW) continue;
                var tag = Entity.getCompoundTag(uid);
                if (!tag) continue;
                if (tag.getInt("InLove") === 0 &&
                    tag.getInt("BreedCooldown") === 0 &&
                    tag.getInt("Age") >= 0) {
                    return uid;
                }
            }
        } catch (e) {
            log("find error: " + e);
        }
        return -1;
    }

    function searchFound(uid) {
        var entity = { uniqueID: 0, found: false };
        SearchBreedable([uid], entity);
        return entity.found;
    }

    Callback.addCallback("tick", function () {
        if (done) return;
        ticks++;
        if (ticks < 200) return;

        var cow = findEligibleCow();
        if (cow === -1) {
            if (ticks % 200 === 0) log("no eligible cow yet");
            return;
        }

        done = true;

        var before = readCooldown(cow);
        var beforeFound = searchFound(cow);
        var set1200 = setEntityBreedCooldown(cow, 1200);
        var after = readCooldown(cow);
        var afterFound = searchFound(cow);
        var set0 = setEntityBreedCooldown(cow, 0);
        var cleared = readCooldown(cow);
        var clearedFound = searchFound(cow);

        log("cow=" + cow +
            " before=" + before + " found=" + beforeFound +
            " set1200=" + set1200 + " after=" + after + " found=" + afterFound +
            " set0=" + set0 + " cleared=" + cleared + " found=" + clearedFound);
    });

    log("probe loaded");
})();
