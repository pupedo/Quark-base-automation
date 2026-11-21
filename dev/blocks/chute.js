IDRegistry.genBlockID("chuteBlock");

Block.createBlock("chuteBlock", [
    {
        name: "Chute", 
        texture: [["chute_bottom", 0], ["chute_top", 0], ["chute_side", 0]],
        inCreative: true
    }
],BLOCK_TYPE_WOOD );

Recipes.addShaped({
    id: BlockID.chuteBlock,
    count: 1,
    data: 0
}, [
    "ppp",
    "p p",
    " p "
], ['p', VanillaBlockID.planks, 0]);

var chuteModel = BlockRenderer.createModel();

chuteModel.addBox(0, 10/16, 0, 1, 1, 1, BlockID.chuteBlock, 0); 

chuteModel.addBox(4/16, 4/16, 4/16, 12/16, 10/16, 12/16, BlockID.chuteBlock, 0); 

chuteModel.addBox(6/16, 0, 6/16, 10/16, 4/16, 10/16, BlockID.chuteBlock, 0);  

var chuteRender = new ICRender.Model();

chuteRender.addEntry(chuteModel);

BlockRenderer.setStaticICRender(BlockID.chuteBlock, -1, chuteRender);


StorageInterface.createInterface(BlockID.chuteBlock, {
    slots: {
        "slot1": {
            input: true,
            output: false,
            maxStack: 64
        },
    },
});


TileEntity.registerPrototype(BlockID.chuteBlock,{

    defaultValues: {
        noRedstone: true
    },

    useNetworkItemContainer: true,

    init: function() {
    },

    tick: function() {

        var blockBelowID = this.blockSource.getBlockId(this.x, this.y - 1, this.z);

        if (Block.isSolid(blockBelowID)) {
            return;
        }

        if (!this.data.noRedstone) {
            return;
        }
        
        StorageInterface.checkHoppers(this);
        var item = this.container.getSlot("slot1");

        if (item.id > 0) {
            debugLog_chute("dropping id=" + item.id + " count=" + item.count + " data=" + item.data);

            var entityID = this.blockSource.spawnDroppedItem(
                this.x + 0.5, this.y - 0.6, this.z + 0.5,
                item.id, item.count, item.data, item.extra
            );

            this.container.clearSlot("slot1");
            this.container.sendChanges();
            Entity.setVelocity(entityID, 0, -0.5, 0);
    
        }

    },

    redstone: function(params) {
        this.data.noRedstone = (params.power === 0);
        debugLog_chute("redstone power=" + params.power + " → noRedstone=" + this.data.noRedstone);
    },


})
