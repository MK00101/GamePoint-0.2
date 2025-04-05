import React, { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface PasswordRule {
  regex: RegExp;
  message: string;
}

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const [score, setScore] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const passwordRules: PasswordRule[] = [
    { regex: /.{8,}/, message: "At least 8 characters" },
    { regex: /[A-Z]/, message: "At least one uppercase letter" },
    { regex: /[a-z]/, message: "At least one lowercase letter" },
    { regex: /[0-9]/, message: "At least one number" },
    { regex: /[^A-Za-z0-9]/, message: "At least one special character" },
  ];

  // Calculate password strength score when password changes
  useEffect(() => {
    if (!password) {
      setScore(0);
      return;
    }

    let newScore = 0;
    passwordRules.forEach((rule) => {
      if (rule.regex.test(password)) {
        newScore++;
      }
    });

    setScore(newScore);
  }, [password]);

  // Get indicator color based on score
  const getIndicatorColor = () => {
    if (score === 0) return "bg-gray-200";
    if (score < 2) return "bg-red-500";
    if (score < 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Get text feedback based on score
  const getFeedbackText = () => {
    if (score === 0) return "";
    if (score < 2) return "Weak";
    if (score < 4) return "Moderate";
    if (score < 5) return "Strong";
    return "Very Strong";
  };

  return (
    <div className="space-y-2 mt-1">
      {/* Strength indicator bars */}
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className={`h-full flex-1 rounded-full transition-colors ${
              index <= score ? getIndicatorColor() : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">{getFeedbackText()}</p>
        <button
          type="button"
          onClick={() => setShowRules(!showRules)}
          className="text-xs text-primary hover:underline"
        >
          {showRules ? "Hide requirements" : "Show requirements"}
        </button>
      </div>

      {/* Password rules */}
      {showRules && (
        <div className="text-xs space-y-1 mt-1 p-2 bg-muted/50 rounded-md">
          {passwordRules.map((rule, index) => {
            const isValid = rule.regex.test(password);
            return (
              <div key={index} className="flex items-center gap-1">
                {isValid ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <X className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    isValid ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
                  }
                >
                  {rule.message}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}