const { z } = require("zod");

const signupSchema = z.object({
    username: z.string().email(),
    password: z.string().min(6),
    firstName: z.string(),
    lastName: z.string()
});

module.exports = { signupSchema };