import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class ChipOption<T> {
  final T value;
  final String label;
  final String? description;
  final IconData? icon;

  ChipOption({
    required this.value,
    required this.label,
    this.description,
    this.icon,
  });
}

class AppChoiceChips<T> extends StatelessWidget {
  final String? label;
  final List<ChipOption<T>> options;
  final T selectedValue;
  final ValueChanged<T> onSelected;
  final bool isStacked;

  const AppChoiceChips({
    super.key,
    this.label,
    required this.options,
    T? selectedValue,
    T? selected,
    required this.onSelected,
    this.isStacked = false,
  }) : selectedValue = (selectedValue ?? selected) as T;

  @override
  Widget build(BuildContext context) {
    Widget content;
    if (isStacked) {
      return Column(
        children: options.map((opt) {
          final isSelected = opt.value == selectedValue;
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: InkWell(
              onTap: () => onSelected(opt.value),
              borderRadius: BorderRadius.circular(20),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.brandSoft : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isSelected ? AppColors.brand : AppColors.line,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    if (opt.icon != null) ...[
                      Container(
                        height: 44,
                        width: 44,
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.brandTint : AppColors.canvas,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          opt.icon,
                          color: isSelected ? AppColors.brand : AppColors.muted,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 14),
                    ],
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            opt.label,
                            style: AppTypography.heading3.copyWith(
                              color: isSelected ? AppColors.brandDark : AppColors.ink,
                            ),
                          ),
                          if (opt.description != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              opt.description!,
                              style: AppTypography.caption,
                            ),
                          ],
                        ],
                      ),
                    ),
                    Radio<T>(
                      value: opt.value,
                      groupValue: selectedValue,
                      onChanged: (val) {
                        if (val != null) onSelected(val);
                      },
                      activeColor: AppColors.brand,
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      );
    } else {
      content = Wrap(
        spacing: 8,
        runSpacing: 8,
        children: options.map((opt) {
          final isSelected = opt.value == selectedValue;
          return ChoiceChip(
            label: Text(opt.label),
            selected: isSelected,
            onSelected: (_) => onSelected(opt.value),
            labelStyle: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
              color: isSelected ? AppColors.brandDark : AppColors.ink,
            ),
            backgroundColor: Colors.white,
            selectedColor: AppColors.brandTint,
            side: BorderSide(
              color: isSelected ? AppColors.brand : AppColors.line,
              width: isSelected ? 1.5 : 1,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          );
        }).toList(),
      );
    }

    if (label != null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label!,
            style: AppTypography.heading3,
          ),
          const SizedBox(height: 8),
          content,
        ],
      );
    }

    return content;
  }
}

typedef ChoiceChips<T> = AppChoiceChips<T>;
