const jwt = require('jsonwebtoken');
const jwtkey = "8ca44b776f8562a8068d72b68a66761e73e9432cd8e06659be94936056072615be78e8694da0d770e77ac50dacca5f8142180bfce242088032a370f227c13102";

const verify = (req, res, next) => {
    const token = req.cookies["token"];
    if (!token) {
        return res.status(401).json({ error: "Token is required" });
    }
    try {
        const decoded = jwt.verify(token, jwtkey);
        //console.log({ "decoded token": decoded });

        if (!decoded) {
            return res.status(401).json({ error: "Invalid token" });
        }
        //console.log("Decoded token:", decoded);
        if(decoded.role !== 'admin') {
            return res.status(403).json({ error: "Access denied" });
        }

        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = verify;
