import { Injectable } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class PasswordValidationService {

  /**
   * Validator to check if passwords match
   */
  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  /**
   * Validator for password strength
   * Requires: min 8 chars, 1 uppercase, 1 special character
   */
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    const passwordValid = hasUpperCase && hasSpecialChar && hasMinLength;

    return passwordValid ? null : { passwordStrength: true };
  }

  /**
   * Calculate password strength (0-4)
   * Returns strength level for UI indicators
   */
  calculatePasswordStrength(password: string): number {
    if (!password) {
      return 0;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    return Math.min(strength, 4);
  }

  /**
   * Get password strength label
   */
  getPasswordStrengthLabel(strength: number): string {
    const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    return labels[strength] || 'Très faible';
  }

  /**
   * Get password strength color
   */
  getPasswordStrengthColor(strength: number): string {
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
    return colors[strength] || '#ef4444';
  }

  /**
   * Get complete password strength info for UI
   * Returns percentage (0-100), label, and color
   */
  getPasswordStrengthInfo(password: string): { percentage: number; label: string; color: string } {
    const strength = this.calculatePasswordStrength(password);
    return {
      percentage: strength * 25, // Convert 0-4 to 0-100
      label: this.getPasswordStrengthLabel(strength),
      color: this.getPasswordStrengthColor(strength)
    };
  }
}
