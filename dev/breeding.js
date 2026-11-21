var breedableRange = 1; 
var QUARK_IS_64_BIT = CoreKit.Engine.is64Bit();
var QuarkNative = QUARK_IS_64_BIT ? WRAP_JAVA("com.quark.baseautomation.nativebridge.QuarkNative") : null;
if (QUARK_IS_64_BIT) {
    debugLog_breed("native bridge loaded");
}

function breedEntitiesInRange(x, y, z, EntityType, dim) {

    var entityList = Entity.getAllInRange({x: x, y: y, z: z}, breedableRange, EntityType);
    entityList = filterByDimension(entityList, dim);

    	var entity = {
    		uniqueID: 0,
    		found: false
    	}
        
        SearchBreedable(entityList, entity, dim);
        
 	if(entity.found){
        applyInLove(entity.uniqueID);
        return true;
	}
    return false;
} 

function setEntityBreedCooldown(uid, ticks) {
    if (QUARK_IS_64_BIT) {
        if (!QuarkNative || !QuarkNative.setBreedCooldown) return false;
        try {
            return !!QuarkNative.setBreedCooldown(uid, ticks);
        } catch (e) {
            debugLog_breed("setBreedCooldown error: " + e);
            return false;
        }
    }
    var nbtData = Entity.getCompoundTag(uid);
    if (!nbtData) return false;
    nbtData.putInt("BreedCooldown", ticks);
    try {
        Entity.setCompoundTag(uid, nbtData);
        return true;
    } catch (e) {
        debugLog_breed("setCompoundTag BreedCooldown error: " + e);
        return false;
    }
}

function filterByDimension(entityList, dim) {
    if (dim === undefined || dim === null) return entityList;
    var filtered = [];
    for (var i = 0; i < entityList.length; i++) {
        if (!Entity.isExist(entityList[i])) continue;
        if (Entity.getDimension(entityList[i]) === dim) {
            filtered.push(entityList[i]);
        }
    }
    return filtered;
}

function SearchBreedable(entityList, entity, dim){
	for (var i = 0; i < entityList.length; i++) {
	    var uid = entityList[i];
	    if (dim !== undefined && dim !== null) {
	        if (Entity.getDimension(uid) !== dim) continue;
	    }
	    var nbtData = Entity.getCompoundTag(uid);
	    if (!nbtData) {
	        debugLog_breed("search uid=" + uid + " nbt=null");
	        continue;
	    }
	    var inLove = nbtData.getInt("InLove");
	    var cooldown = nbtData.getInt("BreedCooldown");
	    var age = nbtData.getInt("Age");
	    debugLog_breed("search uid=" + uid + " InLove=" + inLove + " BreedCooldown=" + cooldown + " Age=" + age);
	    if (inLove === 0 && cooldown === 0 && age >= 0){
	        entity.uniqueID = uid;
	        entity.found = true;
	        debugLog_breed("search uid=" + uid + " FOUND");
	        break;
	    }
	}
}

function readBreedingState(uid, type) {
    if (type === undefined) type = Entity.getType(uid);
    var nbtData = Entity.getCompoundTag(uid);
    return {
        type: type,
        inLove: nbtData.getInt("InLove"),
        cooldown: nbtData.getInt("BreedCooldown"),
        age: nbtData.getInt("Age")
    };
}

function applyInLove(uid) {
    if (QUARK_IS_64_BIT) {
        return !!QuarkNative.setInLove(uid);
    }
    var nbtData = Entity.getCompoundTag(uid);
    nbtData.putInt("InLove", IN_LOVE_DURATION);
    Entity.setCompoundTag(uid, nbtData);
    debugLog_breed("set InLove (no LoveCause) on entity=" + uid);
    return true;
}

function applyBreedCooldown(uid, ticks) {
    if (QUARK_IS_64_BIT) {
        QuarkNative.setBreedCooldown(uid, ticks);
        return;
    }
    var nbtData = Entity.getCompoundTag(uid);
    nbtData.putInt("BreedCooldown", ticks);
    Entity.setCompoundTag(uid, nbtData);
    debugLog_breed("set BreedCooldown=" + ticks + " on entity=" + uid);
}

function moveToTargetCoords(entityList, targetX, targetY, targetZ, dim) {
    if (targetX === 0 && targetY === 0 && targetZ === 0) {
        debugLog_breed("move skipped: target=0,0,0");
        return;
    }
    entityList = filterByDimension(entityList, dim);
    for (var i = 0; i < entityList.length; i++) {
      var uid = entityList[i];
        var nbtData = Entity.getCompoundTag(uid);
        if (!nbtData) {
          debugLog_breed("move uid=" + uid + " nbt=null");
          continue;
        }
        var inLove = nbtData.getInt("InLove");
        var cooldown = nbtData.getInt("BreedCooldown");
        var age = nbtData.getInt("Age");
        var eligible = (age >= 0);
        debugLog_breed("move uid=" + uid + " InLove=" + inLove + " BreedCooldown=" + cooldown + " Age=" + age + " eligible=" + eligible);
        if (!eligible) continue;
        var pathNavigation = Entity.getPathNavigation(uid);
        if (!pathNavigation) {
          debugLog_breed("move uid=" + uid + " pathNavigation=null");
          continue;
        }
        pathNavigation.moveToCoords(targetX, targetY, targetZ, MOVE_SPEED);
        debugLog_breed("move uid=" + uid + " path set -> " + targetX + "," + targetY + "," + targetZ);
    }
}

function stopEntityMovement(entityList) {
    for (var i = 0; i < entityList.length; i++) {
        Entity.getPathNavigation(entityList[i]).stop();
    }
}


function finishBreed(entity, item, entityPos, dim) {
    var newCount = item.count - 1;

    Entity.remove(entity);

    if (newCount > 0) {
        var region = BlockSource.getDefaultForDimension(dim);
        region.spawnDroppedItem(entityPos.x, entityPos.y, entityPos.z, item.id, newCount, item.data, item.extra);
    }

    TickScheduler.global.defer(function () {
        var orbs = Entity.getAllInRange({x: entityPos.x, y: entityPos.y, z: entityPos.z}, 4, EEntityType.EXPERIENCE_ORB);
        for (var i = 0; i < orbs.length; i++) {
            if (Entity.getDimension(orbs[i]) !== dim) continue;
            Entity.remove(orbs[i]);
        }
    }, { ticks: 10, retries: 0, reason: "throw-to-breed xp cleanup" });
}

function mainBreedingFunction(entity, EntityTypes, dim) {
    if (!EntityTypes || !EntityTypes.length) {
        return false;
    }

    var item = Entity.getDroppedItem(entity);

    var entityPos = Entity.getPosition(entity);
    if (!entityPos || (entityPos.x === 0 && entityPos.y === 0 && entityPos.z === 0)) {
        return false;
    }

    var breeded = false;
    var t;
    var list;

    for (t = 0; t < EntityTypes.length; t++) {
        list = filterByDimension(
            Entity.getAllInRange({x: entityPos.x, y: entityPos.y, z: entityPos.z}, BREEDING_RANGE, EntityTypes[t]),
            dim
        );
        if (list.length > 0) {
            moveToTargetCoords(list, entityPos.x, entityPos.y, entityPos.z, dim);
        }
        if (breedEntitiesInRange(entityPos.x, entityPos.y, entityPos.z, EntityTypes[t], dim)) {
            breeded = true;
            debugLog_breed("throw-to-breed success type=" + EntityTypes[t]);
            break;
        }
    }

    debugLog_breed("throw-to-breed item=" + item.id + " count=" + item.count +
        " types=" + EntityTypes.length + " pos=(" + entityPos.x + "," + entityPos.y + "," + entityPos.z + ")" +
        " dim=" + dim + " bred=" + breeded);

    if (breeded) {
        finishBreed(entity, item, entityPos, dim);
        return true;
    }

    debugLog_breed("no breedable found nearby — starting delayed retry chain");

    var tick = 20;

    Updatable.addUpdatable({
        update: function() {
            if (!Entity.isExist(entity)) {
                debugLog_breed("throw-to-breed: entity despawned — stopping retry");
                this.remove = true;
                return;
            }

            tick--;
            if (tick > 0) return;

            entityPos = Entity.getPosition(entity);
            if (!entityPos || (entityPos.x === 0 && entityPos.y === 0 && entityPos.z === 0)) {
                debugLog_breed("throw-to-breed: position 0,0,0 — stopping retry");
                this.remove = true;
                return;
            }

            for (t = 0; t < EntityTypes.length; t++) {
                list = filterByDimension(
                    Entity.getAllInRange({x: entityPos.x, y: entityPos.y, z: entityPos.z}, BREEDING_RANGE, EntityTypes[t]),
                    dim
                );
                if (list.length > 0) {
                    moveToTargetCoords(list, entityPos.x, entityPos.y, entityPos.z, dim);
                }
            }

            var bred = false;
            for (t = 0; t < EntityTypes.length; t++) {
                if (breedEntitiesInRange(entityPos.x, entityPos.y, entityPos.z, EntityTypes[t], dim)) {
                    bred = true;
                    debugLog_breed("delayed breed success type=" + EntityTypes[t]);
                    break;
                }
            }

            if (bred) {
                finishBreed(entity, item, entityPos, dim);
                this.remove = true;
                return;
            }

            tick = 30;
        }
    });

    return false;
}


function readFoodStock(container) {
    var stock = {};
    for (var i = 0; i < 9; i++) {
        var slot = container.getSlot("slot" + i);
        if (slot.id === 0) continue;
        if (!FOOD_TO_TYPES[slot.id]) continue;
        stock[slot.id] = (stock[slot.id] || 0) + slot.count;
    }
    return stock;
}

function hasFoodStock(stock) {
    for (var i = 0; i < FOOD_IDS.length; i++) {
        if (stock[FOOD_IDS[i]] > 0) return true;
    }
    return false;
}

function typeHasFood(type, stock) {
    var foods = ENTITY_FOODS[type];
    for (var i = 0; i < foods.length; i++) {
        if (stock[foods[i]] > 0) return true;
    }
    return false;
}

function pickFoodId(type, stock) {
    var foods = ENTITY_FOODS[type];
    for (var i = 0; i < foods.length; i++) {
        if (stock[foods[i]] > 0) return foods[i];
    }
    return -1;
}

function findFoodSlot(container, foodId, fromIndex) {
    for (var i = fromIndex; i < 9; i++) {
        var slot = container.getSlot("slot" + i);
        if (slot.id === foodId) return i;
    }
    return -1;
}

function consumeFood(container, slotIndex, foodId) {
    var slot = container.getSlot("slot" + slotIndex);
    slot.count--;
    if (slot.count <= 0) {
        slot.id = 0;
        slot.data = 0;
        slot.extra = null;
    }
    container.setSlot("slot" + slotIndex, slot.id, slot.count, slot.data, slot.extra);
    if (slot.id === 0) {
        container.validateSlot("slot" + slotIndex);
    }
}

function collectEligible(tile, radius, stock) {
    var all = Entity.getAllInRange({x: tile.x, y: tile.y, z: tile.z}, radius);
    var eligible = [];
    for (var i = 0; i < all.length; i++) {
        var uid = all[i];
        if (typeof Entity.getTypeAddon(uid) === "string") continue;
        if (Entity.getDimension(uid) !== tile.dimension) continue;
        var type = Entity.getType(uid);
        if (!ENTITY_FOODS[type]) continue;
        if (!typeHasFood(type, stock)) continue;
        var state = readBreedingState(uid, type);
        if (state.inLove === 0 && state.cooldown === 0 && state.age >= 0) {
            eligible.push({uid: uid, type: type, state: state});
        }
    }
    return eligible;
}

function cleanupXp(tile) {
    var orbs = Entity.getAllInRange({x: tile.x, y: tile.y, z: tile.z}, BREEDING_RANGE, EEntityType.EXPERIENCE_ORB);
    for (var i = 0; i < orbs.length; i++) {
        if (Entity.getDimension(orbs[i]) !== tile.dimension) continue;
        Entity.remove(orbs[i]);
    }
}
