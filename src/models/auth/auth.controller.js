import authservice from './auth.service.js';

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const tenantId=req.user.tenantId;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const result = await authservice.register({
            name,
            email,
            password,
            role,
            tenantId
            
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: result
        });

    } catch (err) {
        console.error("Register error:", err);

        if (err.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "User already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const result = await authservice.login({ email, password });

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: result
        });
    }
    catch (error) {
        console.log("login error", error)
    }





}