// utils/jwt.utils.js
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const JWT_SECRETS = {
    access: {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiry: process.env.ACCESS_TOKEN_EXPIRY
    },
    refresh: {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiry: process.env.REFRESH_TOKEN_EXPIRY
    }
};

export const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRETS.access.secret, {
        expiresIn: JWT_SECRETS.access.expiry
    });
};

export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_SECRETS.refresh.secret, {
        expiresIn: JWT_SECRETS.refresh.expiry
    });
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_SECRETS.access.secret);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_SECRETS.refresh.secret);
};