module.exports = (api) => {
    api.cache(true);

    return {
        plugins: ['babel-plugin-root-import'],
    };
};