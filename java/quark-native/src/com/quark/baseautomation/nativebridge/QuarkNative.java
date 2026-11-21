package com.quark.baseautomation.nativebridge;

import java.util.HashMap;

public final class QuarkNative {
    private QuarkNative() {}

    public static native boolean setInLove(long entityUid);

    public static native boolean setBreedCooldown(long entityUid, int ticks);

    public static void boot(HashMap<?, ?> map) {
    }
}
