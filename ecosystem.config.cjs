module.exports = {
    apps: [
        {
            name: "Admin Dashboard",
            script: "src/index.js",
            env: {
                NODE_ENV: "production",
            },
            watch: ["src/**/*.js"]
        },
    ],
};