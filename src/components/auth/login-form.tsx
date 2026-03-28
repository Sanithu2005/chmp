"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { data: session, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Invalid email or password. Please try again.");
        return;
      }

      toast.success("Signed in successfully!");

      const role = session?.user?.role as string | undefined;
      if (role === "parent") {
        router.push("/parent");
      } else {
        router.push("/doctor");
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div
      className="rounded-2xl border p-8 shadow-sm"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email Address</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="doctor@hospital.lk"
            autoComplete="email"
            {...register("email")}
            style={{
              borderColor: errors.email ? "var(--color-destructive)" : undefined,
            }}
          />
          {errors.email && (
            <p className="text-xs" style={{ color: "var(--color-destructive)" }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-10"
              {...register("password")}
              style={{
                borderColor: errors.password ? "var(--color-destructive)" : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: "var(--color-muted-foreground)" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs" style={{ color: "var(--color-destructive)" }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          id="login-submit"
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
        </div>
        <div className="relative flex justify-center">
          <span
            className="px-3 text-xs"
            style={{ background: "var(--color-card)", color: "var(--color-muted-foreground)" }}
          >
            Don&apos;t have an account?
          </span>
        </div>
      </div>

      <Button variant="outline" className="w-full" size="lg" asChild>
        <Link href="/register">Create Account</Link>
      </Button>
    </div>
  );
}
