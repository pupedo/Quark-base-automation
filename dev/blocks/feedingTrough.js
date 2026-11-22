IDRegistry.genBlockID("feedingTroughBlock");

Block.createBlock("feedingTroughBlock", [
    {
        name: "Feeding Trough", 
        texture: [["trough_bottom", 0], ["trough_top", 0], ["trough_side", 0], ["trough_side_inner", 0]],
         inCreative: true
    }
], BLOCK_TYPE_WOOD );

var troughSlots = {};
for (var slotIndex = 0; slotIndex < 9; slotIndex++) {
    troughSlots["slot" + slotIndex] = { input: true, output: false };
}
StorageInterface.createInterface(BlockID.feedingTroughBlock, { slots: troughSlots });

var feedingTroughModel = BlockRenderer.createModel();

feedingTroughModel.addBox(2/16, 0, 2/16, 14/16, 1/16, 14/16, [
    ["trough_bottom", 0],
    ["trough_bottom", 0],
]);

feedingTroughModel.addBox(0, 0, 0, 2/16, 7/16, 1, [
    ["trough_bottom", 0],
    ["trough_top", 0],
    ["trough_side", 0],
    ["trough_side", 0],
    ["trough_side", 0],
    ["trough_side_inner", 0]
]);

feedingTroughModel.addBox(14/16, 0, 0, 1, 7/16, 1, [
    ["trough_bottom", 0],
    ["trough_top", 0],
    ["trough_side", 0],
    ["trough_side", 0],
    ["trough_side_inner", 0],
    ["trough_side", 0]
]);

feedingTroughModel.addBox(2/16, 0, 0, 14/16, 7/16, 2/16, [
    ["trough_bottom", 0],
    ["trough_top", 0],
    ["trough_side", 0],
    ["trough_side_inner", 0],
    ["trough_side", 0],
    ["trough_side", 0]
]);

feedingTroughModel.addBox(2/16, 0, 14/16, 14/16, 7/16, 1, [
    ["trough_bottom", 0],
    ["trough_top", 0],
    ["trough_side_inner", 0],
    ["trough_side", 0],
    ["trough_side", 0],
    ["trough_side", 0]
]);

var feedingTroughRender = new ICRender.Model();
feedingTroughRender.addEntry(feedingTroughModel);

var feedingTroughModel_2 = BlockRenderer.createModel();

feedingTroughModel_2.addBox(2/16, 0, 2/16, 14/16, 5/16, 14/16, [
    ["trough_bottom", 0],
    ["hayblock_top", 0],
]);

feedingTroughModel_2.addBox(0, 0, 0, 2/16, 7/16, 1, [
    ["trough_bottom", 0],
    ["trough_top", 0],
    ["trough_side", 0],
    ["trough_side", 0],
    ["trough_side", 0],
    ["trough_side_inner", 0]
]);

feedingTroughModel_2.addBox(14/16, 0, 0, 1, 7/16, 1, [
    ["trough_bottom", 0],
    ["trough_top", 0],
    ["trough_side", 0],
    ["trough_side", 0],
    ["trough_side_inner", 0],
    ["trough_side", 0]
]);

feedingTroughModel_2.addBox(2/16, 0, 0, 14/16, 7/16, 2/16, [
    ["trough_bottom", 0],
    ["trough_top", 0],
    ["trough_side", 0],
    ["trough_side_inner", 0],
    ["trough_side", 0],
    ["trough_side", 0]
]);

feedingTroughModel_2.addBox(2/16, 0, 14/16, 14/16, 7/16, 1, [
    ["trough_bottom", 0],
    ["trough_top", 0],
    ["trough_side_inner", 0],
    ["trough_side", 0],
    ["trough_side", 0],
    ["trough_side", 0]
]);

var feedingTroughRender_2 = new ICRender.Model();
feedingTroughRender_2.addEntry(feedingTroughModel_2);

BlockRenderer.enableCoordMapping(BlockID.feedingTroughBlock, -1, feedingTroughRender);

Recipes.addShaped({
    id: BlockID.feedingTroughBlock,
    count: 1,
    data: 0
}, [
    "f f",
    "ppp"
], ['p', VanillaBlockID.planks, 0, 'f', VanillaBlockID.fence_gate, 0]);

var guiFeedingTroughBlock = new UI.StandardWindow({
    standard: {
        header: {text: {text: "Feeding Trough"}},
        inventory: {standard: true},
        background: {standard: true}
    },
    drawing: [],
    elements: {
        "slot0": {type: "slot", x: 320, y: 60, size: 120},
        "slot1": {type: "slot", x: 440, y: 60, size: 120},
        "slot2": {type: "slot", x: 560, y: 60, size: 120},
        "slot3": {type: "slot", x: 320, y: 180, size: 120},
        "slot4": {type: "slot", x: 440, y: 180, size: 120},
        "slot5": {type: "slot", x: 560, y: 180, size: 120},
        "slot6": {type: "slot", x: 320, y: 300, size: 120},
        "slot7": {type: "slot", x: 440, y: 300, size: 120},
        "slot8": {type: "slot", x: 560, y: 300, size: 120}
    }
});

function inventoryRateForMode(mode) {
    return mode === "ACTIVE" ? INVENTORY_RATE : SLOW_INVENTORY_RATE;
}

function scanRateForMode(mode) {
    return mode === "ACTIVE" ? SCAN_RATE : SLOW_SCAN_RATE;
}

function callRateForMode(mode) {
    return mode === "ACTIVE" ? CALL_RATE : SLOW_CALL_RATE;
}

function feedRateForMode(mode) {
    return mode === "ACTIVE" ? FEED_RATE : SLOW_FEED_RATE;
}

function setMode(tile, next) {
    if (tile._mode === next) return false;
    tile._mode = next;
    if (DEBUG) {
        Game.message("Feeding Trough " + tile.x + "," + tile.y + "," + tile.z + ": " + next);
    }
    if (next === "ACTIVE") {
        tile._inventoryCooldown = 0;
        tile._callCooldown = 0;
        tile._feedCooldown = 0;
    } else if (next === "CAP") {
        tile._callCooldown = 0;
        tile._feedCooldown = 0;
    } else if (next === "INACTIVE") {
        tile._eligibleList = [];
    }
    return true;
}

function inventoryScan(tile) {
    var stock = {};
    var hasAnyItem = false;

    for (var i = 0; i < 9; i++) {
        var slot = tile.container.getSlot("slot" + i);
        if (slot.id === 0) continue;
        hasAnyItem = true;
        if (FOOD_TO_TYPES[slot.id]) {
            stock[slot.id] = (stock[slot.id] || 0) + slot.count;
        }
    }

    tile._foodStock = stock;

    var activeFoods = [];
    for (var f = 0; f < FOOD_IDS.length; f++) {
        if (stock[FOOD_IDS[f]] > 0) activeFoods.push(FOOD_IDS[f]);
    }
    tile._activeFoods = activeFoods;

    if (tile._lastHasItems !== hasAnyItem) {
        tile._lastHasItems = hasAnyItem;
        tile.networkData.putBoolean("hasItems", hasAnyItem);
        tile.networkData.sendChanges();
    }

    var hasAnyFood = activeFoods.length > 0;
    if (!hasAnyFood) {
        setMode(tile, "INACTIVE");
        return;
    }

    if (tile._mode === "INACTIVE") {
        setMode(tile, "SLOW");
        tile._scanCooldown = 0;
    }
}

function entityScan(tile) {
    var all = Entity.getAllInRange({x: tile.x, y: tile.y, z: tile.z}, BREEDING_RANGE);
    var count = 0;
    var eligible = [];

    for (var i = 0; i < all.length; i++) {
        var uid = all[i];
        var addonType = Entity.getTypeAddon(uid);

        if (typeof addonType === "string") {
            if (Entity.isExist(uid) && whitelistHasString(addonType.trim()) &&
                Entity.getDimension(uid) === tile.dimension) {
                count++;
            }
            continue;
        }

        var type = Entity.getType(uid);

        if (Entity.getDimension(uid) !== tile.dimension) continue;

        if (whitelistHasNumeric(type)) {
            count++;
        }

        var state = readBreedingState(uid, type);

        if (ENTITY_FOODS[type] &&
            typeHasFood(type, tile._foodStock) &&
            state.inLove === 0 && state.cooldown === 0 && state.age >= 0) {
            eligible.push({uid: uid, type: type, state: state});
        }
    }

    tile._whitelistCount = count;
    tile._eligibleList = eligible;

    if (tile._activeFoods.length === 0) {
        setMode(tile, "INACTIVE");
    } else if (eligible.length === 0) {
        setMode(tile, "SLOW");
    } else if (count >= ENTITY_CAP) {
        setMode(tile, "CAP");
    } else {
        setMode(tile, "ACTIVE");
    }
}

function callEligible(tile) {
    var uids = [];
    for (var i = 0; i < tile._eligibleList.length; i++) {
        uids.push(tile._eligibleList[i].uid);
    }
    moveToTargetCoords(uids, tile.x, tile.y, tile.z, tile.dimension);
}

function feedPass(tile) {
    var feedStock = readFoodStock(tile.container);
    if (!hasFoodStock(feedStock)) return;

    var near = collectEligible(tile, TROUGH_RANGE, feedStock);
    if (!near.length) return;

    var uids = [];
    for (var n = 0; n < near.length; n++) {
        uids.push(near[n].uid);
    }
    stopEntityMovement(uids);

    var consumedAny = false;

    for (var i = 0; i < near.length; i++) {
        var entry = near[i];

        var foodId = pickFoodId(entry.type, feedStock);
        if (foodId === -1) break;

        var slotIndex = findFoodSlot(tile.container, foodId, 0);
        if (slotIndex === -1) break;

        consumeFood(tile.container, slotIndex, foodId);
        feedStock[foodId]--;
        consumedAny = true;

        if (tile._mode === "ACTIVE") {
            if (Math.random() <= TROUGH_BREEDING_CHANCE) {
                if (!tile._xpHitThisTick) {
                    tile._xpCountdownWasRunning = tile.data.xpCleanCountdown > 0;
                    tile._xpHadPendingBeforeHit = tile.data.xpCleanRemaining > 0;
                }
                tile.data.xpCleanRemaining = 2;
                if (tile.data.xpCleanCountdown <= 0 && !tile._xpHadPendingBeforeHit) {
                    tile.data.xpCleanCountdown = XP_CLEANUP_INTERVAL;
                }
                tile._xpHitThisTick = true;
                applyInLove(entry.uid);
            }
        } else if (tile._mode === "CAP") {
            applyBreedCooldown(entry.uid, BREED_COOLDOWN);
        }
    }

    if (consumedAny) {
        tile.container.sendChanges();
    }
}

function xpCleanTick(tile) {
    var remaining = tile.data.xpCleanRemaining;
    var countdown = tile.data.xpCleanCountdown;

    if (remaining <= 0) return;

    if (tile._xpHitThisTick && !tile._xpCountdownWasRunning && !tile._xpHadPendingBeforeHit) {
        return;
    }

    if (countdown > 0) {
        countdown--;
        tile.data.xpCleanCountdown = countdown;

        if (countdown === 0) {
            cleanupXp(tile);
            remaining--;
            tile.data.xpCleanRemaining = remaining;

            if (remaining > 0) {
                tile.data.xpCleanCountdown = XP_CLEANUP_INTERVAL;
            }
        }
        return;
    }

    cleanupXp(tile);
    remaining--;
    tile.data.xpCleanRemaining = remaining;

    if (remaining > 0) {
        tile.data.xpCleanCountdown = XP_CLEANUP_INTERVAL;
    }
}

TileEntity.registerPrototype(BlockID.feedingTroughBlock, {
    defaultValues: {},

    getScreenName: function(player, coords) {
        return "master"; 
    },

    getScreenByName: function(screenName) {
        return screenName === "master" ? guiFeedingTroughBlock : null;  
    },

    useNetworkItemContainer: true,

    init: function () {
        this._mode = "INACTIVE";
        if (DEBUG) {
            Game.message("Feeding Trough " + this.x + "," + this.y + "," + this.z + ": INACTIVE");
        }
        this._inventoryCooldown = 0;
        this._scanCooldown = 0;
        this._callCooldown = 0;
        this._feedCooldown = 0;
        this._foodStock = {};
        this._activeFoods = [];
        this._eligibleList = [];
        this._whitelistCount = 0;
        this._lastHasItems = null;
        this._xpHitThisTick = false;
        this._xpCountdownWasRunning = false;
        this._xpHadPendingBeforeHit = false;

        if (typeof this.data.xpCleanRemaining !== "number" || !isFinite(this.data.xpCleanRemaining) ||
            this.data.xpCleanRemaining < 0 || this.data.xpCleanRemaining > 2) {
            this.data.xpCleanRemaining = 0;
        }
        if (typeof this.data.xpCleanCountdown !== "number" || !isFinite(this.data.xpCleanCountdown) ||
            this.data.xpCleanCountdown < 0 || this.data.xpCleanCountdown > XP_CLEANUP_INTERVAL) {
            this.data.xpCleanCountdown = 0;
        }

        delete this.data.tick;
        delete this.data._lastTroughBreedTick;
        delete this.data._renderSynced;
        delete this.data.lastHasAnyItem;
    },

    tick: function() {
        StorageInterface.checkHoppers(this);

        this._xpHitThisTick = false;

        if (this._inventoryCooldown > 0) this._inventoryCooldown--;
        if (this._scanCooldown > 0) this._scanCooldown--;
        if (this._callCooldown > 0) this._callCooldown--;
        if (this._feedCooldown > 0) this._feedCooldown--;

        if (this._inventoryCooldown <= 0) {
            inventoryScan(this);
            this._inventoryCooldown = inventoryRateForMode(this._mode);
        }

        if (this._mode !== "INACTIVE" && this._scanCooldown <= 0 && this._activeFoods.length > 0) {
            entityScan(this);
            this._scanCooldown = scanRateForMode(this._mode);
        }

        if ((this._mode === "ACTIVE" || this._mode === "CAP") &&
            this._callCooldown <= 0 && this._eligibleList.length > 0) {
            callEligible(this);
            this._callCooldown = callRateForMode(this._mode);
        }

        if ((this._mode === "ACTIVE" || this._mode === "CAP") && this._feedCooldown <= 0) {
            feedPass(this);
            this._feedCooldown = feedRateForMode(this._mode);
        }

        xpCleanTick(this);
    },
    
    client: {
        load: function() {
            var that = this;
            var updateRender = function() {
                var hasItems = that.networkData.getBoolean("hasItems", false);
                BlockRenderer.mapAtCoords(that.x, that.y, that.z, hasItems ? feedingTroughRender_2 : feedingTroughRender, false);
            };
            var listener = function(data, key, isExternal) {
                if (isExternal && (key === undefined || key === null || key === "hasItems")) {
                    updateRender();
                }
            };
            this._dataListener = listener;
            this._updateRender = updateRender;
            this._renderDelay = 5;
            this.networkData.addOnDataChangedListener(listener);
            updateRender();
        },
        tick: function() {
            if (this._renderDelay > 0) {
                this._renderDelay--;
                if (this._renderDelay === 0 && this._updateRender) {
                    this._updateRender();
                }
            }
        },
        unload: function() {
            if (this._dataListener && this.networkData.removeOnDataChangedListener) {
                this.networkData.removeOnDataChangedListener(this._dataListener);
            }
            BlockRenderer.unmapAtCoords(this.x, this.y, this.z);
            this._updateRender = null;
            this._dataListener = null;
        }
    },

    destroy: function() {
    }
});
