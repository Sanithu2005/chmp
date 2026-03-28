"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Users, Stethoscope, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { authClient } from "@/lib/auth-client";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    role: z.enum(["parent", "medical_professional"], {
      message: "Please select your role",
    }),
    licenseNumber: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
    if (data.role === "medical_professional" && (!data.licenseNumber || data.licenseNumber.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License number is required for medical professionals",
        path: ["licenseNumber"],
      });
    }
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const roles: { value: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "parent",
    label: "Parent",
    description: "Manage child health records",
    icon: <Users className="h-5 w-5" />,
  },
  {
    value: "medical_professional",
    label: "Medical Professional",
    description: "Manage patients & clinic",
    icon: <Stethoscope className="h-5 w-5" />,
  },
];

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { data: session, error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.fullName,
        role: data.role,
        licenseNumber: data.licenseNumber ?? "",
      });

      if (error) {
        toast.error(error.message || "Failed to create account. Please try again.");
        return;
      }

      toast.success("Account created successfully!");

      if (data.role === "parent") {
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
        {/* Role Selection */}
        <div className="space-y-2">
          <Label>I am registering as a...</Label>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                id={`role-${role.value}`}
                onClick={() => setValue("role", role.value, { shouldValidate: true })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                )}
                style={{
                  borderColor:
                    selectedRole === role.value
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                  background:
                    selectedRole === role.value
                      ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                      : "var(--color-card)",
                  color:
                    selectedRole === role.value
                      ? "var(--color-primary)"
                      : "var(--color-muted-foreground)",
                }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    background:
                      selectedRole === role.value
                        ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
                        : "color-mix(in srgb, var(--color-muted-foreground) 10%, transparent)",
                  }}
                >
                  {role.icon}
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                  {role.label}
                </span>
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="text-xs" style={{ color: "var(--color-destructive)" }}>
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="register-name">Full Name</Label>
          <Input
            id="register-name"
            type="text"
            placeholder="John Doe"
            autoComplete="name"
            {...register("fullName")}
            style={{
              borderColor: errors.fullName ? "var(--color-destructive)" : undefined,
            }}
          />
          {errors.fullName && (
            <p className="text-xs" style={{ color: "var(--color-destructive)" }}>
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email Address</Label>
          <Input
            id="register-email"
            type="email"
            placeholder="john@example.com"
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

        {/* License Number (Conditional) */}
        {selectedRole === "medical_professional" && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="register-license">Medical License Number</Label>
            <Input
              id="register-license"
              type="text"
              placeholder="SLMC-12345"
              {...register("licenseNumber")}
              style={{
                borderColor: errors.licenseNumber ? "var(--color-destructive)" : undefined,
              }}
            />
            {errors.licenseNumber && (
              <p className="text-xs" style={{ color: "var(--color-destructive)" }}>
                {errors.licenseNumber.message}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="register-password">Password</Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="register-confirm-password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
                {...register("confirmPassword")}
                style={{
                  borderColor: errors.confirmPassword ? "var(--color-destructive)" : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: "var(--color-muted-foreground)" }}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs" style={{ color: "var(--color-destructive)" }}>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <Button
          id="register-submit"
          type="submit"
          className="w-full mt-2"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account…
            </>
          ) : (
            "Create Account"
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
            Already have an account?
          </span>
        </div>
      </div>

      <Button variant="outline" className="w-full" size="lg" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
    </div>
  );
}
