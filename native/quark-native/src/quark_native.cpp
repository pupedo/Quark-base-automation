#include <jni.h>

extern "C" void* hz_get_symbol(const char*, const char*, bool)
    asm("_Z31hz_get_symbol_from_named_handlePKcS0_b");
extern "C" void hz_init_lib_handle(const char*, const char*, int, bool)
    asm("_Z18hz_init_lib_handlePKcS0_ib");
extern "C" int modmain(void*) asm("_Z10__mod_mainP10ModLibrary");

typedef void* (*ActorWrapFn)(long long);
typedef void* (*OwnerGetStackRefFn)(void*);
typedef void* (*StackRefEnttRegistryFn)(void*);
typedef void* (*RegistryAssureBreedableFn)(void*);
typedef void (*BreedableSetInLoveFn)(void*, void*, void*);

static ActorWrapFn g_wrap = 0;
static OwnerGetStackRefFn g_getStackRef = 0;
static StackRefEnttRegistryFn g_enttRegistry = 0;
static RegistryAssureBreedableFn g_assureBreedable = 0;
static BreedableSetInLoveFn g_compSetInLove = 0;
static int g_resolveState = 0;

static void resolveSymbols() {
    if (g_resolveState != 0) return;
    hz_init_lib_handle("mcpe", "libminecraftpe.so", 2, false);
    hz_init_lib_handle("innercore", "libinnercore.so", 2, false);
    g_wrap = (ActorWrapFn) hz_get_symbol("innercore", "_ZN5Actor4wrapEl", false);
    g_getStackRef = (OwnerGetStackRefFn) hz_get_symbol(
        "mcpe", "_ZNK18OwnerStorageEntity12_getStackRefEv", false);
    g_enttRegistry = (StackRefEnttRegistryFn) hz_get_symbol(
        "mcpe", "_ZNK17EntityContextBase13_enttRegistryEv", false);
    g_assureBreedable = (RegistryAssureBreedableFn) hz_get_symbol(
        "mcpe",
        "_ZNK4entt14basic_registryI8EntityIdE6assureI18BreedableComponentEERKNS2_12pool_handlerIT_EEv",
        false);
    g_compSetInLove = (BreedableSetInLoveFn) hz_get_symbol(
        "mcpe", "_ZN18BreedableComponent9setInLoveER5ActorPK6Player", false);
    g_resolveState = (g_wrap && g_getStackRef && g_enttRegistry && g_assureBreedable && g_compSetInLove) ? 1 : -1;
}

static void* getBreedable(void* actor) {
    if (g_resolveState != 1 || !actor) return 0;
    void* owner = (char*) actor + 0x8;
    void* ref = g_getStackRef(owner);
    if (!ref) return 0;
    void* registry = g_enttRegistry(ref);
    if (!registry) return 0;
    void* pool = g_assureBreedable(registry);
    if (!pool) return 0;
    unsigned int id = *(unsigned int*)((char*) ref + 0x8);
    unsigned int page = (id >> 13) & 0x7f;
    unsigned int slot = id & 0x1fff;
    void* sparse = *(void**)((char*) pool + 0x8);
    if (!sparse) return 0;
    void* pagePtr = *(void**)((char*) sparse + ((unsigned long long) page << 3));
    if (!pagePtr) return 0;
    unsigned int packed = *(unsigned int*)((char*) pagePtr + ((unsigned long long) slot << 2));
    if ((~packed & 0xfffffU) == 0) return 0;
    void* packedArray = *(void**)((char*) pool + 0x38);
    if (!packedArray) return 0;
    return (void*)((char*) packedArray + ((unsigned long long) packed << 5));
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setInLove(JNIEnv*, jclass, jlong uid) {
    resolveSymbols();
    if (g_resolveState != 1) return JNI_FALSE;
    void* actor = g_wrap((long long) uid);
    if (!actor) return JNI_FALSE;
    void* comp = getBreedable(actor);
    if (!comp) return JNI_FALSE;
    g_compSetInLove(comp, actor, 0);
    return JNI_TRUE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_quark_baseautomation_nativebridge_QuarkNative_setBreedCooldown(
        JNIEnv*, jclass, jlong uid, jint ticks) {
    resolveSymbols();
    if (g_resolveState != 1) return JNI_FALSE;
    void* actor = g_wrap((long long) uid);
    if (!actor) return JNI_FALSE;
    void* comp = getBreedable(actor);
    if (!comp) return JNI_FALSE;
    if (ticks < 0) ticks = 0;
    *(int*)((char*) comp + 0xc) = (int) ticks;
    return JNI_TRUE;
}

extern "C" __attribute__((visibility("default"))) int JNI_OnLoad(JavaVM*, void*) {
    return 0x00010004;
}

extern "C" __attribute__((visibility("default"))) int modmain(void*) {
    return 0;
}
