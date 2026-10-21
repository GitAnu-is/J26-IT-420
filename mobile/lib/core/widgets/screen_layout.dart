import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class ScreenLayout extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final bool showBack;
  final VoidCallback? onBack;
  final List<Widget>? actions;
  final Widget body;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final bool isScrollable;
  final EdgeInsetsGeometry padding;

  ScreenLayout({
    super.key,
    this.title,
    this.subtitle,
    this.showBack = false,
    this.onBack,
    List<Widget>? actions,
    Widget? action,
    Widget? body,
    Widget? child,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.isScrollable = true,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  }) : actions = actions ?? (action != null ? [action] : null),
       body = body ?? child ?? const SizedBox.shrink();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      appBar: (title != null || showBack || (actions != null && actions!.isNotEmpty))
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: showBack
                  ? IconButton(
                      icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: AppColors.ink),
                      onPressed: onBack ?? () => Navigator.of(context).maybePop(),
                    )
                  : null,
              title: title != null
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title!, style: AppTypography.heading2),
                        if (subtitle != null) ...[
                          const SizedBox(height: 2),
                          Text(subtitle!, style: AppTypography.caption),
                        ],
                      ],
                    )
                  : null,
              actions: actions,
            )
          : null,
      body: SafeArea(
        child: isScrollable
            ? SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: padding,
                child: body,
              )
            : Padding(
                padding: padding,
                child: body,
              ),
      ),
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
    );
  }
}
