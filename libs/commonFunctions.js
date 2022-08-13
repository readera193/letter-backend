module.exports = {
    fisherYatesShuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    now() {
        return new Date().toLocaleString("zh-TW", { "hour12": false });
    },
};

