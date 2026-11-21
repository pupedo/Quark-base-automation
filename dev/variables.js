var BLOCK_TYPE_WOOD = Block.createSpecialType({
    base: 5
});

var BREEDING_RECIPES = {};
BREEDING_RECIPES[296]                         = [EEntityType.COW, EEntityType.MUSHROOM_COW, EEntityType.SHEEP]; // wheat item; VanillaItemID has no wheat
BREEDING_RECIPES[VanillaItemID.carrot]        = [EEntityType.PIG];
BREEDING_RECIPES[VanillaItemID.potato]        = [EEntityType.PIG];
BREEDING_RECIPES[457]                         = [EEntityType.PIG]; // beetroot item; VanillaItemID has no beetroot
BREEDING_RECIPES[VanillaItemID.wheat_seeds]   = [EEntityType.CHICKEN];
BREEDING_RECIPES[VanillaItemID.pumpkin_seeds] = [EEntityType.CHICKEN];
BREEDING_RECIPES[VanillaItemID.melon_seeds]   = [EEntityType.CHICKEN];
BREEDING_RECIPES[VanillaItemID.beetroot_seeds]= [EEntityType.CHICKEN];

var ENTITY_FOODS = {};
var ENTITY_FOOD_TYPES = [];
var FOOD_TO_TYPES = {};
var FOOD_IDS = [];

var ENTITY_SCAN_WHITELIST = {};
var ENTITY_SCAN_WHITELIST_STRINGS = {};

for (var defaultWhitelistType = EEntityType.CHICKEN; defaultWhitelistType <= EEntityType.DOLPHIN; defaultWhitelistType++) {
    ENTITY_SCAN_WHITELIST[defaultWhitelistType] = true;
}

function whitelistHasNumeric(type) {
    return ENTITY_SCAN_WHITELIST[type] === true;
}

function whitelistHasString(type) {
    return ENTITY_SCAN_WHITELIST_STRINGS[type] === true;
}

function registerEntityScanWhiteList(type) {
    if (typeof type === "number") {
        ENTITY_SCAN_WHITELIST[type] = true;
        return;
    }
    if (typeof type === "string") {
        var trimmed = type.trim();
        if (trimmed.length > 0) {
            ENTITY_SCAN_WHITELIST_STRINGS[trimmed] = true;
        }
    }
}

function buildEntityFoods() {
    ENTITY_FOODS = {};
    ENTITY_FOOD_TYPES = [];
    FOOD_TO_TYPES = {};
    FOOD_IDS = [];
    for (var itemId in BREEDING_RECIPES) {
        if (!BREEDING_RECIPES.hasOwnProperty(itemId)) continue;
        var foodId = parseInt(itemId, 10);
        if (!isFinite(foodId) || foodId <= 0) continue;
        if (foodId !== Math.floor(foodId)) continue;
        var types = BREEDING_RECIPES[itemId];
        if (!types || typeof types.length !== "number") continue;
        for (var t = 0; t < types.length; t++) {
            var et = types[t];
            if (typeof et !== "number" || !isFinite(et) || et !== Math.floor(et)) continue;
            if (!ENTITY_FOODS[et]) ENTITY_FOODS[et] = [];
            if (ENTITY_FOODS[et].indexOf(foodId) === -1) {
                ENTITY_FOODS[et].push(foodId);
            }
        }
    }
    for (var typeKey in ENTITY_FOODS) {
        if (!ENTITY_FOODS.hasOwnProperty(typeKey)) continue;
        var typeId = parseInt(typeKey, 10);
        if (!isFinite(typeId)) continue;
        if (!ENTITY_FOODS[typeId]) continue;
        ENTITY_FOOD_TYPES.push(typeId);
    }
    for (var i = 0; i < ENTITY_FOOD_TYPES.length; i++) {
        var entityType = ENTITY_FOOD_TYPES[i];
        var foods = ENTITY_FOODS[entityType];
        for (var f = 0; f < foods.length; f++) {
            var id = foods[f];
            if (!FOOD_TO_TYPES[id]) {
                FOOD_TO_TYPES[id] = [];
                FOOD_IDS.push(id);
            }
            if (FOOD_TO_TYPES[id].indexOf(entityType) === -1) {
                FOOD_TO_TYPES[id].push(entityType);
            }
        }
    }
}

buildEntityFoods();

function registerBreedingFood(itemId, entityTypes) {
    if (!BREEDING_RECIPES[itemId]) BREEDING_RECIPES[itemId] = [];
    for (var i = 0; i < entityTypes.length; i++) {
        if (BREEDING_RECIPES[itemId].indexOf(entityTypes[i]) === -1) {
            BREEDING_RECIPES[itemId].push(entityTypes[i]);
        }
        if (typeof entityTypes[i] === "number") {
            ENTITY_SCAN_WHITELIST[entityTypes[i]] = true;
        }
    }
    buildEntityFoods();
}

function readConfigNumber(key, min, max, integer) {
    var value = CONFIG[key];

    if (typeof value !== "number" || !isFinite(value)) {
        throw new Error("Quark config: " + key + " must be a finite number");
    }

    if (integer && value !== Math.floor(value)) {
        throw new Error("Quark config: " + key + " must be an integer");
    }

    if (value < min || value > max) {
        throw new Error("Quark config: " + key + " out of range [" + min + ", " + max + "]");
    }

    return value;
}

var INVENTORY_RATE = readConfigNumber("inventoryRate", 1, 1200, true);
var SLOW_INVENTORY_RATE = readConfigNumber("slowInventoryRate", 1, 1200, true);
var SCAN_RATE = readConfigNumber("scanRate", 1, 1200, true);
var SLOW_SCAN_RATE = readConfigNumber("slowScanRate", 1, 1200, true);
var CALL_RATE = readConfigNumber("callRate", 1, 1200, true);
var SLOW_CALL_RATE = readConfigNumber("slowCallRate", 1, 1200, true);
var FEED_RATE = readConfigNumber("feedRate", 1, 1200, true);
var SLOW_FEED_RATE = readConfigNumber("slowFeedRate", 1, 1200, true);
var XP_CLEANUP_INTERVAL = readConfigNumber("xpCleanupInterval", 1, 1200, true);
var BREEDING_RANGE = readConfigNumber("breedingRange", 1, 32, true);
var TROUGH_RANGE = readConfigNumber("troughRange", 1, 8, true);
var ENTITY_CAP = readConfigNumber("entityCap", 1, 512, true);
var TROUGH_BREEDING_CHANCE = readConfigNumber("troughBreedingChance", 0, 1, false);
var IN_LOVE_DURATION = 600;
var BREED_COOLDOWN = 6000;
var MOVE_SPEED = 1.5;

ModAPI.registerAPI("QuarkAPI", {
    version: "1.0",
    registerEntityScanWhiteList: registerEntityScanWhiteList,
    registerBreedingFood: registerBreedingFood
});
