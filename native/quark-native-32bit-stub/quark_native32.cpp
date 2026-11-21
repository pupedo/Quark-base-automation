#include <jni.h>

struct ModLibrary;
extern "C" int modmain(void*) asm("_Z10__mod_mainP10ModLibrary");

extern "C" __attribute__((visibility("default"))) jint JNI_OnLoad(JavaVM*, void*) {
    return 0x00010004;
}

extern "C" __attribute__((visibility("default"))) int modmain(void*) {
    return 0;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_available(JNIEnv*, jclass) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_hasWrap(JNIEnv*, jclass) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_hasIsInLove(JNIEnv*, jclass) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_hasSetInLove(JNIEnv*, jclass) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setInLoveKind(JNIEnv*, jclass) {
    return 0;
}

extern "C" JNIEXPORT jlong JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_wrap(JNIEnv*, jclass, jlong) {
    return 0;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_isInLove(JNIEnv*, jclass, jlong) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setInLove(JNIEnv*, jclass, jlong) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setBreedCooldown(JNIEnv*, jclass, jlong, jint) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setInLovePartner(JNIEnv*, jclass, jlong, jlong) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_hasComponentApi(JNIEnv*, jclass) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setLoveTimerComponent(JNIEnv*, jclass, jlong, jlong) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setInLoveComponent(JNIEnv*, jclass, jlong, jlong) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_hasAccessor(JNIEnv*, jclass) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jlong JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_componentPtr(JNIEnv*, jclass, jlong) {
    return 0;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setInLoveAuto(JNIEnv*, jclass, jlong) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setLoveTimerAt(JNIEnv*, jclass, jlong, jlong) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_probeCount(JNIEnv*, jclass) {
    return 0;
}

extern "C" JNIEXPORT jint JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_handleCount(JNIEnv*, jclass) {
    return 0;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_probeName(JNIEnv* env, jclass, jint) {
    return env->NewStringUTF("");
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_handleName(JNIEnv* env, jclass, jint) {
    return env->NewStringUTF("");
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_probeSupported(JNIEnv*, jclass, jint, jint) {
    return JNI_FALSE;
}

extern "C" JNIEXPORT jlong JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_probe(JNIEnv*, jclass, jint, jint) {
    return 0;
}
