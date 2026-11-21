(function () {
    var PREFIX = "[QNATIVE] ";
    var ticks = 0;
    var loggedUid = -1;
    var loggedCount = 0;
    var autoTestDone = false;

    function log(msg) { Logger.Log(PREFIX + msg, "Quark"); }

    var QN = null;
    try {
        QN = WRAP_JAVA("com.quark.baseautomation.nativebridge.QuarkNative");
        log("bridge loaded");
    } catch (e) {
        log("bridge load error: " + e);
    }

    function dumpProbe() {
        if (!QN) return;
        try {
            log("flags available=" + QN.available() +
                " wrap=" + QN.hasWrap() +
                " isInLove=" + QN.hasIsInLove() +
                " setInLove=" + QN.hasSetInLove() +
                " kind=" + QN.setInLoveKind());
            var pn = QN.probeCount();
            var hn = QN.handleCount();
            for (var i = 0; i < pn; i++) {
                var name = QN.probeName(i);
                for (var h = 0; h < hn; h++) {
                    if (!QN.probeSupported(i, h)) continue;
                    var p = QN.probe(i, h);
                    if (p) log("sym " + QN.handleName(h) + " " + name + " -> " + p);
                }
            }
            log("sym dump done");
        } catch (e) {
            log("dump error: " + e);
        }
    }
    dumpProbe();

    function dumpElf(lib, sub, limit) {
        try {
            var res = QN.elfProbe(lib, sub, limit);
            if (!res) { log("elf " + lib + " " + sub + " -> null"); return; }
            var lines = String(res).split("\n");
            for (var i = 0; i < lines.length; i++) {
                if (lines[i]) log("elf " + lines[i]);
            }
        } catch (e) {
            log("elf error " + lib + " " + sub + ": " + e);
        }
    }
    dumpElf("libminecraftpe.so", "setInLove", 40);
    dumpElf("libminecraftpe.so", "InLove", 40);
    dumpElf("libminecraftpe.so", "BreedableComponent", 30);
    dumpElf("libminecraftpe.so", "AgeableComponent", 30);
    dumpElf("libminecraftpe.so", "tryGetComponent", 60);
    dumpElf("libinnercore.so", "VTable", 30);

    function pickCow() {
        try {
            var all = Entity.getAll();
            for (var i = 0; i < all.length; i++) {
                var uid = all[i];
                if (!Entity.isExist(uid)) continue;
                if (Entity.getType(uid) === EEntityType.COW) return uid;
            }
        } catch (e) {
            log("pickCow error: " + e);
        }
        return -1;
    }

    function cowList() {
        var out = [];
        try {
            var all = Entity.getAll();
            for (var i = 0; i < all.length; i++) {
                var uid = all[i];
                if (!Entity.isExist(uid)) continue;
                if (Entity.getType(uid) === EEntityType.COW) out.push(uid);
            }
        } catch (e) {
            log("cowList error: " + e);
        }
        return out;
    }

    function readInLove(uid) {
        try {
            var tag = Entity.getCompoundTag(uid);
            if (tag) return tag.getInt("InLove");
        } catch (e) {}
        return -1;
    }

    Callback.addCallback("tick", function () {
        if (!QN) return;
        ticks++;
        if (!autoTestDone && ticks >= 200) {
            var cowsA = cowList();
            if (cowsA.length >= 2) {
                autoTestDone = true;
                var aA = cowsA[0];
                var bA = cowsA[1];
                var pa = 0;
                var pb = 0;
                var ao = false;
                var bo = false;
                try { pa = QN.componentPtr(aA); } catch (e) { log("ptr error: " + e); }
                try { pb = QN.componentPtr(bA); } catch (e) { log("ptr error: " + e); }
                try { ao = QN.setInLoveAuto(aA); } catch (e) { log("auto error: " + e); }
                try { bo = QN.setInLoveAuto(bA); } catch (e) { log("auto error: " + e); }
                log("auto a=" + aA + " b=" + bA + " ptr=" + pa + "/" + pb +
                    " ok=" + ao + "/" + bo +
                    " isInLove=" + QN.isInLove(aA) + "/" + QN.isInLove(bA) +
                    " InLove=" + readInLove(aA) + "/" + readInLove(bA) +
                    " api=" + QN.hasAccessor());
                var inA = readInLove(aA);
                var inB = readInLove(bA);
                if (inA !== 600 || inB !== 600) {
                    var t1 = false;
                    var t2 = false;
                    var q1 = false;
                    var q2 = false;
                    try { t1 = QN.setLoveTimerAt(aA, 600); } catch (e) { log("timerAt error: " + e); }
                    try { t2 = QN.setLoveTimerAt(bA, 600); } catch (e) { log("timerAt error: " + e); }
                    try { q1 = QN.setInLovePartner(aA, bA); } catch (e) { log("partner error: " + e); }
                    try { q2 = QN.setInLovePartner(bA, aA); } catch (e) { log("partner error: " + e); }
                    log("fallback timer=" + t1 + "/" + t2 + " partner=" + q1 + "/" + q2 +
                        " isInLove=" + QN.isInLove(aA) + "/" + QN.isInLove(bA) +
                        " InLove=" + readInLove(aA) + "/" + readInLove(bA));
                }
            }
        }
        if (ticks % 100 !== 0) return;

        var cow = pickCow();
        if (cow === -1) return;
        if (cow === loggedUid && loggedCount >= 3) return;

        loggedUid = cow;
        loggedCount++;
        try {
            log("cow=" + cow + " available=" + QN.available() +
                " wrap=" + QN.wrap(cow) +
                " isInLove=" + QN.isInLove(cow));
        } catch (e) {
            log("call error: " + e);
        }
    });

    log("probe loaded");
})();
