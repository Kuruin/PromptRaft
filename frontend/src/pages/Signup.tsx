import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardEnhanced, CardEnhancedContent, CardEnhancedHeader, CardEnhancedTitle, CardEnhancedDescription } from "@/components/ui/card-enhanced";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { EyeOff, Eye } from "lucide-react";
import axios from "axios";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Signup = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [visiblePassword, setVisiblePassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await axios.post("http://localhost:3000/api/v1/user/signup", {
                username: email,
                password,
                firstName,
                lastName
            });

            if (res.data.token) {
                toast.success("Account created successfully!");
                // Auto-login after signup
                // We need to fetch user profile since signup might not return full user object in previous impl
                // But let's check: Backend signup returns { msg, token }.
                // We need to fetch /me or just trust the next load. 
                // Let's manually login the context with token and a temp user object or fetch it.

                // Let's fetch the user details immediately
                try {
                    const meRes = await axios.get("http://localhost:3000/api/v1/user/me", {
                        headers: { Authorization: `Bearer ${res.data.token}` }
                    });
                    login(res.data.token, meRes.data.user);
                    navigate("/prompt-refine");
                } catch (e) {
                    // Fallback if fetch fails
                    navigate("/login");
                }
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Signup failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
                <CardEnhanced variant="gold" className="w-full max-w-md">
                    <CardEnhancedHeader>
                        <CardEnhancedTitle>Join the Crew</CardEnhancedTitle>
                        <CardEnhancedDescription>Create your account to start crafting prompts</CardEnhancedDescription>
                    </CardEnhancedHeader>
                    <CardEnhancedContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First Name</label>
                                    <Input
                                        placeholder="John"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Last Name</label>
                                    <Input
                                        placeholder="Doe"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="sailor@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type={visiblePassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setVisiblePassword(!visiblePassword)}
                                    className="absolute right-3 top-11 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                >
                                    {visiblePassword ? (
                                        <Eye className="h-4 w-4" />
                                    ) : (
                                        <EyeOff className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading} variant="ocean">
                                {isLoading ? "Creating Account..." : "Sign Up"}
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary hover:underline">
                                Login
                            </Link>
                        </div>
                    </CardEnhancedContent>
                </CardEnhanced>
            </div>
            <Footer />
        </div>
    );
};

export default Signup;
