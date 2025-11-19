import jwt from "jsonwebtoken";

const JWT_SECRET = "mykey";

// Auth middleware to verify JWT token
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Access token is required" 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: "Invalid or expired token" 
            });
        }
        
        req.user = user;
        next();
    });
}