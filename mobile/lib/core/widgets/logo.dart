import 'package:flutter/material.dart';
import '../theme/colors.dart';

class AgriGuardLogo extends StatelessWidget {
  final double size;
  final bool inverted;

  const AgriGuardLogo({
    super.key,
    this.size = 48,
    this.inverted = false,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _AgriGuardLogoPainter(inverted: inverted),
    );
  }
}

class _AgriGuardLogoPainter extends CustomPainter {
  final bool inverted;

  _AgriGuardLogoPainter({required this.inverted});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 48.0;

    final shieldColor = inverted ? Colors.white : AppColors.brand;
    final leafColor = inverted ? AppColors.brand : Colors.white;
    final veinColor = inverted ? Colors.white : AppColors.brand;
    const accentColor = Color(0xFF65A765);

    // 1. Outer Shield: M24 3 41 9.5V22c0 11-7.4 19.6-17 23-9.6-3.4-17-12-17-23V9.5L24 3Z
    final shieldPaint = Paint()
      ..color = shieldColor
      ..style = PaintingStyle.fill;

    final shieldPath = Path();
    shieldPath.moveTo(24 * scale, 3 * scale);
    shieldPath.lineTo(41 * scale, 9.5 * scale);
    shieldPath.lineTo(41 * scale, 22 * scale);
    shieldPath.cubicTo(41 * scale, 33 * scale, 33.6 * scale, 41.6 * scale, 24 * scale, 45 * scale);
    shieldPath.cubicTo(14.4 * scale, 41.6 * scale, 7 * scale, 33 * scale, 7 * scale, 22 * scale);
    shieldPath.lineTo(7 * scale, 9.5 * scale);
    shieldPath.close();
    canvas.drawPath(shieldPath, shieldPaint);

    // 2. Inner Leaf: M15.5 32.5c0-10.5 6.5-16 17.5-17 0 11-6 17-17.5 17Z
    final leafPaint = Paint()
      ..color = leafColor
      ..style = PaintingStyle.fill;

    final leafPath = Path();
    leafPath.moveTo(15.5 * scale, 32.5 * scale);
    leafPath.cubicTo(15.5 * scale, 22 * scale, 22 * scale, 16.5 * scale, 33 * scale, 15.5 * scale);
    leafPath.cubicTo(33 * scale, 26.5 * scale, 27 * scale, 32.5 * scale, 15.5 * scale, 32.5 * scale);
    leafPath.close();
    canvas.drawPath(leafPath, leafPaint);

    // 3. Leaf Vein: M17 31l10-10
    final veinPaint = Paint()
      ..color = veinColor
      ..strokeWidth = 1.8 * scale
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(17 * scale, 31 * scale), Offset(27 * scale, 21 * scale), veinPaint);

    // 4. Accent Bud: circle cx=33 cy=15.5 r=2.2
    final budPaint = Paint()
      ..color = accentColor
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(33 * scale, 15.5 * scale), 2.2 * scale, budPaint);
  }

  @override
  bool shouldRepaint(covariant _AgriGuardLogoPainter oldDelegate) =>
      oldDelegate.inverted != inverted;
}
