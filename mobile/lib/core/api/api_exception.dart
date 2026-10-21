class ApiException implements Exception {
  final int statusCode;
  final String code;
  final String message;
  final List<FieldError> details;

  ApiException({
    required this.statusCode,
    required this.code,
    required this.message,
    this.details = const [],
  });

  factory ApiException.network(String message, {String? hint}) {
    final fullMsg = hint != null ? '$message\n$hint' : message;
    return ApiException(
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to AgriGuard backend: $fullMsg',
    );
  }

  factory ApiException.unauthorized(String message) {
    return ApiException(
      statusCode: 401,
      code: 'AUTH_ERROR',
      message: message,
    );
  }

  factory ApiException.server(String message) {
    return ApiException(
      statusCode: 500,
      code: 'SERVER_ERROR',
      message: 'Server encountered an issue: $message',
    );
  }

  String get friendlyMessage {
    if (code == 'NETWORK_ERROR') {
      return message;
    }
    if (code == 'SERVER_ERROR') {
      return message;
    }
    if (code == 'AUTH_ERROR' || code == 'INVALID_CREDENTIALS') {
      return message.isNotEmpty ? message : 'Invalid email or password. Please try again.';
    }
    if (code == 'ACCOUNT_INACTIVE') {
      return 'Your account is deactivated. Please contact extension support.';
    }
    if (code == 'VALIDATION_ERROR' && details.isNotEmpty) {
      return details.map((d) => d.message).join('\n');
    }
    return message;
  }

  @override
  String toString() => message;

  factory ApiException.fromJson(int statusCode, Map<String, dynamic> json) {
    final errorObj = json['error'] is Map<String, dynamic> ? json['error'] : null;
    final code = errorObj?['code'] ?? json['code'] ?? 'API_ERROR';
    final message = json['message'] ?? errorObj?['message'] ?? 'An unexpected error occurred.';
    
    final rawDetails = errorObj?['details'] ?? json['details'];
    final List<FieldError> details = [];
    if (rawDetails is List) {
      for (final item in rawDetails) {
        if (item is Map<String, dynamic>) {
          details.add(FieldError.fromJson(item));
        }
      }
    }

    return ApiException(
      statusCode: statusCode,
      code: code.toString(),
      message: message.toString(),
      details: details,
    );
  }
}

class FieldError {
  final String field;
  final String message;

  FieldError({required this.field, required this.message});

  factory FieldError.fromJson(Map<String, dynamic> json) {
    return FieldError(
      field: json['field']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
    );
  }
}
