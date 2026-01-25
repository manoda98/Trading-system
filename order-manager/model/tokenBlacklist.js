const blacklist = new Set();

module.exports = {
    add(token) {
        blacklist.add(token);
        console.log(token)
        console.log("Blacklisted tokens: ", blacklist)
    },
    isBlacklisted(token) {
        console.log("Blacklisted tokens: ", blacklist)
        return blacklist.has(token);
    },
};
