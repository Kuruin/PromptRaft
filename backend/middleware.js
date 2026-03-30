const jwt = require("jsonwebtoken");

const { User, Settings } = require("./db");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({
            message: "Missing or invalid authorization header"
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
        if (decoded.id) {
            req.userId = decoded.id;

            // Check maintenance mode
            const settings = await Settings.findOne();
            if (settings && settings.isMaintenanceMode) {
                const user = await User.findById(req.userId);
                if (!user || !user.isAdmin) {
                    return res.status(503).json({ message: "Platform is currently under maintenance." });
                }
            }

            next();
        } else {
            return res.status(403).json({
                message: "Invalid token payload"
            });
        }
    } catch (err) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

const adminMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({
            message: "Missing or invalid authorization header"
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
        if (decoded.id) {
            req.userId = decoded.id;
            // Check if user is admin in DB
            const user = await User.findById(req.userId);
            if (user && user.isAdmin) {
                next();
            } else {
                return res.status(403).json({
                    message: "Forbidden: Admin access required"
                });
            }
        } else {
            return res.status(403).json({
                message: "Invalid token payload"
            });
        }
    } catch (err) {
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

const optionalAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_TOKEN);
        if (decoded.id) {
            req.userId = decoded.id;
        }
    } catch (err) {
        // Silent failure for optional auth
    }
    next();
};

module.exports = {
    authMiddleware,
    adminMiddleware,
    optionalAuthMiddleware
}
