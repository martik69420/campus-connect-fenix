
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const AuthForm: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", inviteCode: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    displayName: "",
    school: "",
    inviteCode: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(loginData.username, loginData.inviteCode);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(
      registerData.username,
      registerData.displayName,
      registerData.school,
      registerData.inviteCode
    );
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden">
      <Tabs defaultValue="login">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Campus Fenix</CardTitle>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
          </div>
          <CardDescription>
            Connect with your school community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="username"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inviteCode">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="invite code"
                    value={loginData.inviteCode}
                    onChange={(e) => setLoginData({ ...loginData, inviteCode: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-sm text-center text-muted-foreground">
                <span>Use invite code "test" for demo</span>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="register" className="mt-0">
            <form onSubmit={handleRegister}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="r-username">Username</Label>
                  <Input
                    id="r-username"
                    placeholder="Choose a username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your full name"
                    value={registerData.displayName}
                    onChange={(e) => setRegisterData({ ...registerData, displayName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="school">School</Label>
                  <Input
                    id="school"
                    placeholder="Your school/university"
                    value={registerData.school}
                    onChange={(e) => setRegisterData({ ...registerData, school: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="r-inviteCode">Invite Code</Label>
                  <Input
                    id="r-inviteCode"
                    placeholder="Invite code"
                    value={registerData.inviteCode}
                    onChange={(e) => setRegisterData({ ...registerData, inviteCode: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
              <div className="mt-4 text-sm text-center text-muted-foreground">
                <span>Use invite code "test" for demo</span>
              </div>
            </form>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default AuthForm;
