var BREED_QUEUE = TickScheduler.global.createQueue("qba.breed", { maxPerTick: 16, lane: "normal" });

Callback.addCallback("EntityAdded", function (entity) {
    if (Entity.getType(entity) !== EEntityType.ITEM) return;

    var item = Entity.getDroppedItem(entity);
    var entityTypes = BREEDING_RECIPES[item.id];
    if (!entityTypes) return;

    var dim = Entity.getDimension(entity);
    debugLog_breed("throw-to-breed item=" + item.id + " count=" + item.count + " dim=" + dim + " targets=" + entityTypes.length);

    BREED_QUEUE.push("breed:" + entity, function () {
        if (!Entity.isExist(entity)) return;
        mainBreedingFunction(entity, entityTypes, dim);
    });
});
