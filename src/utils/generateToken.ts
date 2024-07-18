
import jwt from 'jsonwebtoken';

const generateAccessToken = (username: string,userId:string ,role: string) => {
    return jwt.sign(
        {
            UserInfo: {
                username,
                userId,
                role
            }
        },
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: '2d' }
    );
};

const generateRefreshToken = (username: string,userId:string,role:string) => {
    return jwt.sign(
        { username,userId,role },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: '7d' }
    );
};


export { generateAccessToken, generateRefreshToken };
