import 'package:flutter/material.dart';
import '../../core/auth/auth_state.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_text_field.dart';
import '../../core/widgets/choice_chips.dart';
import '../../core/widgets/screen_layout.dart';
import '../../l10n/app_localizations.dart';

class RegisterScreen extends StatefulWidget {
  final AuthState authState;
  final VoidCallback onLoginTap;
  final VoidCallback onRegisterSuccess;

  const RegisterScreen({
    super.key,
    required this.authState,
    required this.onLoginTap,
    required this.onRegisterSuccess,
  });

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  String _selectedRole = AppConstants.roleFarmer;

  bool _obscurePassword = true;
  String? _errorMessage;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    if (name.isEmpty) {
      setState(() => _errorMessage = 'Please enter your full name.');
      return;
    }
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _errorMessage = 'Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setState(() => _errorMessage = 'Password must be at least 8 characters.');
      return;
    }
    if (password != confirm) {
      setState(() => _errorMessage = 'The two passwords do not match.');
      return;
    }

    setState(() {
      _errorMessage = null;
      _isSubmitting = true;
    });

    try {
      await widget.authState.register(
        fullName: name,
        email: email,
        role: _selectedRole,
        password: password,
      );
      widget.onRegisterSuccess();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '').replaceAll('ApiException: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ScreenLayout(
      showBack: true,
      onBack: widget.onLoginTap,
      title: l10n.t('register'),
      subtitle: 'Create your account to access AgriGuard AI platform',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_errorMessage != null)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.dangerTint,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.danger.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: AppTypography.caption.copyWith(color: AppColors.dangerInk),
                    ),
                  ),
                ],
              ),
            ),

          AppTextField(
            label: l10n.t('fullName'),
            hint: l10n.t('fullNameHint'),
            controller: _nameController,
            prefixIcon: const Icon(Icons.person_outline, size: 20, color: AppColors.muted),
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: l10n.t('email'),
            hint: l10n.t('emailHint'),
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            prefixIcon: const Icon(Icons.mail_outline, size: 20, color: AppColors.muted),
          ),
          const SizedBox(height: 16),

          Text(l10n.t('iAmA'), style: AppTypography.heading3.copyWith(fontSize: 14)),
          const SizedBox(height: 8),
          AppChoiceChips<String>(
            isStacked: true,
            selectedValue: _selectedRole,
            onSelected: (val) => setState(() => _selectedRole = val),
            options: [
              ChipOption(
                value: AppConstants.roleFarmer,
                label: l10n.t('roleFarmer'),
                description: l10n.t('roleFarmerDesc'),
                icon: Icons.eco_outlined,
              ),
              ChipOption(
                value: AppConstants.roleOfficer,
                label: l10n.t('roleOfficer'),
                description: l10n.t('roleOfficerDesc'),
                icon: Icons.assignment_turned_in_outlined,
              ),
              ChipOption(
                value: AppConstants.roleTransport,
                label: l10n.t('roleTransport'),
                description: l10n.t('roleTransportDesc'),
                icon: Icons.local_shipping_outlined,
              ),
            ],
          ),
          const SizedBox(height: 16),

          AppTextField(
            label: l10n.t('password'),
            hint: '••••••••',
            controller: _passwordController,
            obscureText: _obscurePassword,
            prefixIcon: const Icon(Icons.lock_outline, size: 20, color: AppColors.muted),
            suffixIcon: IconButton(
              icon: Icon(
                _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                size: 20,
                color: AppColors.muted,
              ),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
          const SizedBox(height: 16),
          AppTextField(
            label: l10n.t('confirmPassword'),
            hint: '••••••••',
            controller: _confirmController,
            obscureText: _obscurePassword,
            prefixIcon: const Icon(Icons.lock_outline, size: 20, color: AppColors.muted),
          ),
          const SizedBox(height: 24),

          AppButton(
            text: _isSubmitting ? l10n.t('creatingAccount') : l10n.t('register'),
            isLoading: _isSubmitting,
            onPressed: _handleSubmit,
          ),
          const SizedBox(height: 20),

          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(l10n.t('haveAccount'), style: AppTypography.body),
              const SizedBox(width: 6),
              GestureDetector(
                onTap: widget.onLoginTap,
                child: Text(
                  l10n.t('login'),
                  style: AppTypography.heading3.copyWith(
                    color: AppColors.brand,
                    fontSize: 14,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
