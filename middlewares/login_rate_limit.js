const limiter=require('express-rate-limit')
const bannedIPs=new Map()
const limit =limiter({
    windowMs: 7000,
    max: 5,
    handler: (req, res) => {
        const ip=req.ip;
        const bannedTime=10000;
        bannedIPs.set(ip,Date.now()+bannedTime);
        console.log(bannedIPs);
        res.status(429).json({
            code:429,
            error: `You have been blocked for ${bannedTime/1000} seconds`,
        })

    }
})

const blockBannedIPs = (req, res, next) => {

    const ip=req.ip;
    if(bannedIPs.has(ip))
    {
        if(bannedIPs.get(ip)>Date.now())
        {
            return res.status(429).json({
                code:429,
                error: "You have been blocked for 10 seconds",
            })
        }
        else
        {
            bannedIPs.delete(ip);
            
        }
        
    }
    next();
}

module.exports = {limit , blockBannedIPs};