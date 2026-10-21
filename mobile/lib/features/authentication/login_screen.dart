import 'package:flutter/material.dart';
import '../../core/auth/auth_state.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_config.dart';
import '../../core/api/api_exception.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_text_field.dart';
import '../../core/widgets/logo.dart';
import '../../l10n/app_localizations.dart';

class LoginScreen extends StatefulWidget {
  final AuthState authState;
  final VoidCallback onRegisterTap;
  final VoidCallback onLoginSuccess;

  const LoginScreen({
    super.key,
    required this.authState,
    required this.onRegisterTap,
    required this.onLoginSuccess,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  String? _errorMessage;
  bool _isNetworkError = false;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || !email.contains('@')) {
      setState(() {
        _errorMessage = 'Please enter a valid email address.';
        _isNetworkError = false;
      });
      return;
    }
    if (password.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter your password.';
        _isNetworkError = false;
      });
      return;
    }

    setState(() {
      _errorMessage = null;
      _isNetworkError = false;
      _isSubmitting = true;
    });

    try {
      await widget.authState.login(email, password);
      widget.onLoginSuccess();
    } catch (e) {
      setState(() {
        if (e is ApiException) {
          _errorMessage = e.friendlyMessage;
          _isNetworkError = e.code == 'NETWORK_ERROR';
        } else {
          final msg = e.toString().replaceAll('Exception: ', '').replaceAll('ApiException: ', '');
          _errorMessage = msg;
          _isNetworkError = msg.toLowerCase().contains('connect') || msg.toLowerCase().contains('network') || msg.toLowerCase().contains('socket');
        }
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _showConnectionModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ServerConnectionSheet(
        onConfigChanged: () {
          setState(() {
            _errorMessage = null;
            _isNetworkError = false;
          });
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Server Mode Status Chip in top header
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  InkWell(
                    onTap: () => _showConnectionModal(context),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            ApiConfig.currentMode == ApiConnectionMode.usb
                                ? Icons.usb_rounded
                                : Icons.wifi_rounded,
                            size: 14,
                            color: AppColors.brand,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            ApiConfig.currentMode == ApiConnectionMode.usb
                                ? 'USB (ADB)'
                                : (ApiConfig.currentMode == ApiConnectionMode.lan ? 'Wi-Fi LAN' : 'Custom Host'),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.ink,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.tune_rounded, size: 12, color: AppColors.muted),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Center(
                child: Column(
                  children: [
                    const AgriGuardLogo(size: 60),
                    const SizedBox(height: 12),
                    Text('Agri Guard', style: AppTypography.heading1.copyWith(fontSize: 24)),
                    const SizedBox(height: 4),
                    Text(l10n.t('tagline'), style: AppTypography.caption),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Text(l10n.t('login'), style: AppTypography.heading1),
              const SizedBox(height: 16),

              if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.dangerTint,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.danger.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: AppTypography.caption.copyWith(color: AppColors.dangerInk, height: 1.35),
                            ),
                          ),
                        ],
                      ),
                      if (_isNetworkError) ...[
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.settings_ethernet_rounded, size: 16, color: AppColors.dangerInk),
                            label: const Text(
                              'Switch Backend Address / Mode',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.dangerInk),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: AppColors.danger.withOpacity(0.5)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              backgroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                            ),
                            onPressed: () => _showConnectionModal(context),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

              AppTextField(
                label: l10n.t('email'),
                hint: l10n.t('emailHint'),
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: const Icon(Icons.mail_outline, size: 20, color: AppColors.muted),
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
              const SizedBox(height: 24),
              AppButton(
                text: _isSubmitting ? l10n.t('signingIn') : l10n.t('login'),
                isLoading: _isSubmitting,
                onPressed: _handleSubmit,
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(l10n.t('noAccount'), style: AppTypography.body),
                  const SizedBox(width: 6),
                  GestureDetector(
                    onTap: widget.onRegisterTap,
                    child: Text(
                      l10n.t('register'),
                      style: AppTypography.heading3.copyWith(
                        color: AppColors.brand,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _ServerConnectionSheet extends StatefulWidget {
  final VoidCallback onConfigChanged;

  const _ServerConnectionSheet({required this.onConfigChanged});

  @override
  State<_ServerConnectionSheet> createState() => _ServerConnectionSheetState();
}

class _ServerConnectionSheetState extends State<_ServerConnectionSheet> {
  final _urlController = TextEditingController();
  bool _testing = false;
  String? _testMessage;
  bool _testSuccess = false;

  @override
  void initState() {
    super.initState();
    _urlController.text = ApiConfig.baseUrl;
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _testConnection() async {
    final candidate = _urlController.text.trim();
    if (!ApiConfig.isValidUrl(candidate)) {
      setState(() {
        _testSuccess = false;
        _testMessage = 'Please enter a valid HTTP/HTTPS URL with host and port.';
      });
      return;
    }

    setState(() {
      _testing = true;
      _testMessage = null;
    });

    try {
      await ApiConfig.setBaseUrl(candidate);
      final client = ApiClient();
      final ok = await client.healthCheck();

      if (mounted) {
        setState(() {
          _testing = false;
          _testSuccess = ok;
          _testMessage = ok
              ? 'Connected successfully to AgriGuard Unified FastAPI Backend!'
              : 'Server reached, but health status is degraded.';
        });
        widget.onConfigChanged();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _testing = false;
          _testSuccess = false;
          _testMessage = 'Connection failed: ${e.toString().replaceAll("Exception: ", "")}';
        });
      }
    }
  }

  Future<void> _applyPreset(ApiConnectionMode mode) async {
    await ApiConfig.setConnectionMode(mode);
    setState(() {
      _urlController.text = ApiConfig.baseUrl;
      _testMessage = null;
    });
    widget.onConfigChanged();
    await _testConnection();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Backend Server Connection',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.ink),
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Select how your physical phone communicates with the FastAPI backend.',
            style: TextStyle(fontSize: 12, color: AppColors.muted),
          ),
          const SizedBox(height: 16),

          // 1-Tap Preset Buttons
          const Text('Quick Connection Mode:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                    side: BorderSide(
                      color: ApiConfig.currentMode == ApiConnectionMode.usb ? AppColors.brand : AppColors.line,
                      width: ApiConfig.currentMode == ApiConnectionMode.usb ? 2 : 1,
                    ),
                    backgroundColor: ApiConfig.currentMode == ApiConnectionMode.usb ? AppColors.brandTint : Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => _applyPreset(ApiConnectionMode.usb),
                  child: const Column(
                    children: [
                      Icon(Icons.usb_rounded, size: 20, color: AppColors.brand),
                      SizedBox(height: 4),
                      Text('USB Mode', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.ink)),
                      Text('ADB Reverse', style: TextStyle(fontSize: 9, color: AppColors.muted)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                    side: BorderSide(
                      color: ApiConfig.currentMode == ApiConnectionMode.lan ? AppColors.brand : AppColors.line,
                      width: ApiConfig.currentMode == ApiConnectionMode.lan ? 2 : 1,
                    ),
                    backgroundColor: ApiConfig.currentMode == ApiConnectionMode.lan ? AppColors.brandTint : Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => _applyPreset(ApiConnectionMode.lan),
                  child: const Column(
                    children: [
                      Icon(Icons.wifi_rounded, size: 20, color: AppColors.brand),
                      SizedBox(height: 4),
                      Text('Wi-Fi LAN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.ink)),
                      Text('192.168.1.3:8000', style: TextStyle(fontSize: 9, color: AppColors.muted)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // URL Text Field
          const Text('Custom Backend Base URL:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
          const SizedBox(height: 6),
          TextField(
            controller: _urlController,
            decoration: InputDecoration(
              hintText: 'http://192.168.1.3:8000/api/v1',
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.line)),
              suffixIcon: IconButton(
                icon: const Icon(Icons.check_circle_outline, color: AppColors.brand),
                onPressed: () {
                  ApiConfig.setBaseUrl(_urlController.text.trim());
                  widget.onConfigChanged();
                },
              ),
            ),
            style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
          ),
          const SizedBox(height: 12),

          // Test Status Banner
          if (_testMessage != null)
            Container(
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: _testSuccess ? AppColors.brandTint : AppColors.dangerTint,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Icon(_testSuccess ? Icons.check_circle : Icons.error_outline,
                      size: 16, color: _testSuccess ? AppColors.brandDark : AppColors.danger),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _testMessage!,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _testSuccess ? AppColors.brandDark : AppColors.dangerInk,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Test and Save Button
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  icon: _testing
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.network_check_rounded, size: 16),
                  label: Text(_testing ? 'Testing...' : 'Test & Save Connection'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _testing ? null : _testConnection,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
