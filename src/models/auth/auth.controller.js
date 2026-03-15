import authservice from './auth.service.js';

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body || {};
        const tenantId = req.user.tenantId;

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

        // Handle service-specific errors
        if (err.message === "User already exists in this tenant") {
            return res.status(409).json({
                success: false,
                message: "User already exists in this tenant"
            });
        }

        if (err.message === "Invalid role for this tenant") {
            return res.status(400).json({
                success: false,
                message: "Invalid role for this tenant"
            });
        }

        // Handle Prisma errors
        if (err.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Email already in use"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
};

export const login = async (req, res) => {
    try {

        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const result = await authservice.login({ email, password });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: result
        });
    }
    catch (error) {
        console.error("Login error:", error);

        // Handle authentication errors
        if (error.message === "Invalid credentials") {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (error.message === "User is inactive") {
            return res.status(403).json({
                success: false,
                message: "This account has been deactivated"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }





}