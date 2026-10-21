class UserModel {
  final String id;
  final String name;
  final String fullName;
  final String email;
  final String role;
  final String? phoneNumber;

  UserModel({
    required this.id,
    required this.name,
    required this.fullName,
    required this.email,
    required this.role,
    this.phoneNumber,
  });

  String get normalizedRole {
    final r = role.toUpperCase();
    if (r.contains('OFFICER')) return 'AGRICULTURAL_OFFICER';
    if (r.contains('TRANSPORT') || r.contains('LOGISTIC')) return 'TRANSPORT_OPERATOR';
    return 'FARMER';
  }

  String get initials {
    final parts = (fullName.isNotEmpty ? fullName : name).trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'AG';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final full = json['fullName'] ?? json['name'] ?? '';
    return UserModel(
      id: json['id'] ?? json['_id'] ?? '',
      name: full,
      fullName: full,
      email: json['email'] ?? '',
      role: json['role'] ?? 'FARMER',
      phoneNumber: json['phoneNumber'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'fullName': fullName,
    'email': email,
    'role': role,
    'phoneNumber': phoneNumber,
  };
}
