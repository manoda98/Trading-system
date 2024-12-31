const blacklist = new Set();

module.exports = {
    add(token) {
        blacklist.add(token);
        console.log(blacklist)
    },
    isBlacklisted(token) {
        console.log(blacklist)
        return blacklist.has(token);
    },
};
