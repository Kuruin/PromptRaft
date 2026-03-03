import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardEnhanced, CardEnhancedContent, CardEnhancedHeader, CardEnhancedTitle, CardEnhancedDescription } from "@/components/ui/card-enhanced";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Login = () => {
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
            const res = await axios.post("http://localhost:3000/api/v1/user/signin", {
                username: email, // Backend expects 'username' (which is the email here)
                password
            });

            if (res.data.token) {
                toast.success("Welcome back!");
                login(res.data.token, res.data.user);
                navigate("/prompt-refine");
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
                <CardEnhanced variant="ocean" className="w-full max-w-md">
                    <CardEnhancedHeader>
                        <CardEnhancedTitle>Welcome Back</CardEnhancedTitle>
                        <CardEnhancedDescription>Sign in to continue your prompt engineering journey</CardEnhancedDescription>
                    </CardEnhancedHeader>
                    <CardEnhancedContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <div className="relative">
                                    <Input
                                        type={visiblePassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVisiblePassword(!visiblePassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                    >
                                        {visiblePassword ? (
                                            <Eye className="h-4 w-4" />
                                        ) : (
                                            <EyeOff className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading} variant="ocean">
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-primary hover:underline">
                                Sign up
                            </Link>
                        </div>
                    </CardEnhancedContent>
                </CardEnhanced>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
