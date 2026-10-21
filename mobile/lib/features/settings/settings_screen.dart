import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/auth/auth_state.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_config.dart';
import '../../core/constants/app_constants.dart';
import '../../l10n/app_localizations.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _apiUrlController = TextEditingController();
  bool _testingApi = false;
  String? _apiTestMessage;
  bool _apiTestSuccess = false;

  String _district = 'Kurunegala';

  bool _notifWeather = true;
  bool _notifHarvest = true;
  bool _notifDisease = true;
  bool _notifTransport = true;

  @override
  void initState() {
    super.initState();
    _apiUrlController.text = ApiConfig.baseUrl;
  }

  @override
  void dispose() {
    _apiUrlController.dispose();
    super.dispose();
  }

  Future<void> _testAndSaveApiUrl() async {
    final url = _apiUrlController.text.trim();
    if (url.isEmpty) return;

    setState(() {
      _testingApi = true;
      _apiTestMessage = null;
    });

    try {
      final valid = await ApiConfig.setBaseUrl(url);
      if (!valid) {
        setState(() {
          _testingApi = false;
          _apiTestSuccess = false;
          _apiTestMessage = 'Invalid URL format. Please enter a valid HTTP/HTTPS URL.';
        });
        return;
      }
      _apiUrlController.text = ApiConfig.baseUrl;
      final client = Provider.of<ApiClient>(context, listen: false);
      final healthy = await client.healthCheck();

      setState(() {
        _testingApi = false;
        _apiTestSuccess = healthy;
        _apiTestMessage = healthy
            ? 'Connected successfully to AgriGuard backend (${ApiConfig.baseUrl})'
            : 'Server reached, but health check returned non-200 status.';
      });
    } catch (e) {
      setState(() {
        _testingApi = false;
        _apiTestSuccess = false;
        _apiTestMessage = 'Connection failed: ${e.toString().replaceAll('Exception: ', '')}';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authState = Provider.of<AuthState>(context);
    final user = authState.user;

    final initial = user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : 'A';
    final roleDisplay = user != null
        ? user.role == AppConstants.roleOfficer
            ? l10n.roleOfficer
            : user.role == AppConstants.roleTransport
                ? l10n.roleTransport
                : l10n.roleFarmer
        : l10n.roleFarmer;

    return ScreenLayout(
      showBack: true,
      title: l10n.settingsTitle,
      subtitle: 'Manage your profile, language, notification and connection preferences',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // User Profile Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: const BoxDecoration(
                    color: AppColors.brand,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initial,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? 'AgriGuard Member',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.brandTint,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          roleDisplay,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.brandDark,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.email ?? 'user@agriguard.lk',
                        style: const TextStyle(fontSize: 12, color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Language Selector
          Text(
            l10n.language,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.ink),
          ),
          const SizedBox(height: 4),
          Text(
            l10n.languageNote,
            style: const TextStyle(fontSize: 12, color: AppColors.muted),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildLangCard('en', 'English', 'English', l10n),
              const SizedBox(width: 8),
              _buildLangCard('si', 'සිංහල', 'Sinhala', l10n),
              const SizedBox(width: 8),
              _buildLangCard('ta', 'தமிழ்', 'Tamil', l10n),
            ],
          ),
          const SizedBox(height: 24),

          // Backend Connection Configuration Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.dns_outlined, size: 18, color: AppColors.brand),
                    SizedBox(width: 8),
                    Text(
                      'BACKEND API CONNECTION',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: AppColors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Configured for Android Emulator (10.0.2.2:8000) or Physical Device LAN IP.',
                  style: TextStyle(fontSize: 11, color: AppColors.muted),
                ),
                const SizedBox(height: 12),

                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: TextField(
                    controller: _apiUrlController,
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      hintText: 'http://10.0.2.2:8000/api/v1',
                      contentPadding: EdgeInsets.symmetric(vertical: 12),
                    ),
                    style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                  ),
                ),
                const SizedBox(height: 10),

                if (_apiTestMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _apiTestSuccess ? AppColors.brandTint : AppColors.dangerTint,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _apiTestSuccess ? Icons.check_circle : Icons.error_outline,
                          size: 16,
                          color: _apiTestSuccess ? AppColors.brandDark : AppColors.danger,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _apiTestMessage!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: _apiTestSuccess ? AppColors.brandDark : AppColors.dangerInk,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.line),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          _apiUrlController.text = 'http://10.0.2.2:8000/api/v1';
                          _testAndSaveApiUrl();
                        },
                        child: const Text('Emulator (10.0.2.2)', style: TextStyle(fontSize: 11, color: AppColors.ink)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.brand,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _testingApi ? null : _testAndSaveApiUrl,
                        child: _testingApi
                            ? const SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : const Text('Test & Save', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Location & Crop Preferences
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.preferredLocation,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.ink),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: AppConstants.districts.contains(_district) ? _district : 'Kurunegala',
                      isExpanded: true,
                      items: AppConstants.districts.map((d) {
                        return DropdownMenuItem<String>(value: d, child: Text(d, style: const TextStyle(fontSize: 13)));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _district = val);
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Notification Toggles
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              children: [
                _buildToggleRow(l10n.notifWeather, _notifWeather, (v) => setState(() => _notifWeather = v)),
                const Divider(height: 1, color: AppColors.line),
                _buildToggleRow(l10n.notifHarvest, _notifHarvest, (v) => setState(() => _notifHarvest = v)),
                const Divider(height: 1, color: AppColors.line),
                _buildToggleRow(l10n.notifDisease, _notifDisease, (v) => setState(() => _notifDisease = v)),
                const Divider(height: 1, color: AppColors.line),
                _buildToggleRow(l10n.notifTransport, _notifTransport, (v) => setState(() => _notifTransport = v)),
              ],
            ),
          ),
          const SizedBox(height: 28),

          // Logout Button
          AppButton(
            label: l10n.logout,
            icon: Icons.logout,
            variant: AppButtonVariant.danger,
            onPressed: () async {
              await authState.logout();
              if (mounted) {
                Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
              }
            },
          ),
          const SizedBox(height: 14),
          Center(
            child: Text(
              l10n.appVersion,
              style: const TextStyle(fontSize: 11, color: AppColors.muted),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildLangCard(String code, String native, String english, AppLocalizations l10n) {
    final isSel = l10n.locale.languageCode == code;
    return Expanded(
      child: GestureDetector(
        onTap: () => l10n.setLocale(Locale(code)),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: isSel ? AppColors.brandSoft : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSel ? AppColors.brand : AppColors.line,
              width: isSel ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Text(
                native,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.ink),
              ),
              const SizedBox(height: 2),
              Text(
                english,
                style: const TextStyle(fontSize: 11, color: AppColors.muted),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildToggleRow(String title, bool val, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.ink),
            ),
          ),
          Switch(
            value: val,
            activeThumbColor: AppColors.brand,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
