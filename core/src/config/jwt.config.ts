export const jwtConfigs = {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || "default_access_secret",
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
    accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
    refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
}