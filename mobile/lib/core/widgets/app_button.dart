import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

enum ButtonVariant { primary, secondary, outline, inverse, danger }
typedef AppButtonVariant = ButtonVariant;

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final ButtonVariant variant;
  final dynamic icon;
  final double? width;

  AppButton({
    super.key,
    String? text,
    String? label,
    this.onPressed,
    this.isLoading = false,
    this.variant = ButtonVariant.primary,
    this.icon,
    this.width,
  }) : text = text ?? label ?? '';

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    BorderSide side = BorderSide.none;

    switch (variant) {
      case ButtonVariant.primary:
        bg = AppColors.brand;
        fg = Colors.white;
        break;
      case ButtonVariant.secondary:
        bg = AppColors.brandTint;
        fg = AppColors.brandDark;
        break;
      case ButtonVariant.outline:
        bg = Colors.transparent;
        fg = AppColors.ink;
        side = const BorderSide(color: AppColors.line, width: 1.5);
        break;
      case ButtonVariant.inverse:
        bg = Colors.white;
        fg = AppColors.brand;
        break;
      case ButtonVariant.danger:
        bg = AppColors.danger;
        fg = Colors.white;
        break;
    }

    final isInteractive = !isLoading && onPressed != null;

    return SizedBox(
      width: width ?? double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: isInteractive ? onPressed : null,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: fg,
          disabledBackgroundColor: bg.withOpacity(0.6),
          disabledForegroundColor: fg.withOpacity(0.7),
          elevation: 0,
          side: side,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20),
        ),
        child: isLoading
            ? SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  valueColor: AlwaysStoppedAnimation<Color>(fg),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    if (icon is Widget)
                      icon as Widget
                    else if (icon is IconData)
                      Icon(icon as IconData, size: 18, color: fg),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: AppTypography.button.copyWith(color: fg),
                  ),
                ],
              ),
      ),
    );
  }
}
