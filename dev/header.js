if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
        return this.indexOf(search, start) !== -1;
    };
}
IMPORT('StorageInterface');
IMPORT('CoreKit:3');
IMPORT('TickScheduler:3');
