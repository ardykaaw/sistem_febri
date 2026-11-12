<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        <!-- Tabler Core UI CSS -->
        <link href="/tabler/css/tabler.min.css" rel="stylesheet" />
        <link href="/tabler/css/demo.min.css" rel="stylesheet" />
        <style>
            :root {
                --tblr-primary: #0C7C70;
                --tblr-primary-rgb: 12, 124, 112;
                --tblr-primary-fg: #ffffff;
                --tblr-body-bg: #F4F7F6;
                --tblr-font-sans-serif: 'Instrument Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }

            body {
                font-feature-settings: "cv03", "cv04", "cv11";
                -webkit-font-smoothing: antialiased;
                background-color: #F4F7F6;
            }

            /* Fluid & Modern Card System */
            .card {
                border-radius: 1rem !important;
                border: 1px solid rgba(12, 124, 112, 0.08) !important;
                background-color: #ffffff !important;
                box-shadow: 0 4px 20px -2px rgba(17, 41, 38, 0.05), 0 2px 6px -1px rgba(17, 41, 38, 0.03) !important;
                transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            .card.card-link-pop:hover,
            .card-hover:hover {
                transform: translateY(-3px) !important;
                box-shadow: 0 12px 28px -4px rgba(12, 124, 112, 0.12), 0 4px 12px -2px rgba(17, 41, 38, 0.05) !important;
            }
            .card-header {
                border-bottom: 1px solid rgba(12, 124, 112, 0.06) !important;
                padding: 1.15rem 1.5rem !important;
                background-color: #ffffff !important;
            }
            .card-body {
                padding: 1.5rem !important;
            }
            .card-footer {
                border-top: 1px solid rgba(12, 124, 112, 0.06) !important;
                background-color: #FAFCFB !important;
                padding: 1rem 1.5rem !important;
            }

            /* Premium Buttons & Controls */
            .btn {
                border-radius: 0.65rem !important;
                font-weight: 600 !important;
                letter-spacing: -0.01em !important;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }
            .btn:active {
                transform: scale(0.98) !important;
            }
            .btn-primary {
                background: linear-gradient(135deg, #0C7C70 0%, #096158 100%) !important;
                border: 1px solid #0C7C70 !important;
                color: #ffffff !important;
                box-shadow: 0 4px 14px rgba(12, 124, 112, 0.25) !important;
            }
            .btn-primary:hover {
                background: linear-gradient(135deg, #0E8E81 0%, #0A6F64 100%) !important;
                box-shadow: 0 6px 20px rgba(12, 124, 112, 0.35) !important;
                transform: translateY(-1px) !important;
                color: #ffffff !important;
            }
            .btn-outline-primary {
                color: #0C7C70 !important;
                border-color: rgba(12, 124, 112, 0.3) !important;
                background-color: rgba(12, 124, 112, 0.04) !important;
            }
            .btn-outline-primary:hover {
                background-color: #0C7C70 !important;
                border-color: #0C7C70 !important;
                color: #ffffff !important;
                transform: translateY(-1px) !important;
                box-shadow: 0 4px 14px rgba(12, 124, 112, 0.22) !important;
            }

            /* Soft Badges */
            .badge {
                border-radius: 9999px !important;
                font-weight: 600 !important;
                padding: 0.35rem 0.65rem !important;
                letter-spacing: 0.01em !important;
            }
            .bg-teal-lt {
                background-color: #E2F5F0 !important;
                color: #0C7C70 !important;
                border: 1px solid rgba(12, 124, 112, 0.2) !important;
            }
            .bg-yellow-lt {
                background-color: #FEF7E6 !important;
                color: #B27B10 !important;
                border: 1px solid rgba(245, 183, 85, 0.3) !important;
            }
            .bg-red-lt {
                background-color: #FDF0F0 !important;
                color: #D63939 !important;
                border: 1px solid rgba(214, 57, 57, 0.2) !important;
            }
            .bg-azure-lt {
                background-color: #E8F4FD !important;
                color: #206BC4 !important;
                border: 1px solid rgba(32, 107, 196, 0.2) !important;
            }

            /* Clean Modern Tables */
            .card-table thead th {
                background-color: #F8FAF9 !important;
                color: #4A6963 !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                font-size: 0.725rem !important;
                letter-spacing: 0.05em !important;
                border-bottom: 1.5px solid rgba(12, 124, 112, 0.08) !important;
                padding: 0.9rem 1.15rem !important;
            }
            .card-table tbody td {
                padding: 1rem 1.15rem !important;
                vertical-align: middle !important;
                border-bottom: 1px solid rgba(12, 124, 112, 0.05) !important;
            }
            .table-hover tbody tr:hover {
                background-color: rgba(12, 124, 112, 0.025) !important;
            }

            /* Tabler Vertical Sidebar Canonical Enforcements */
            .navbar-vertical {
                background-color: #112926 !important;
                border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
            }

            /* Desktop Sidebar Layout */
            @media (min-width: 992px) {
                .navbar-vertical.navbar-expand-lg {
                    width: 16rem !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    bottom: 0 !important;
                    z-index: 1030 !important;
                    align-items: flex-start !important;
                    display: flex !important;
                    flex-direction: column !important;
                    overflow-y: auto !important;
                    padding: 0 !important;
                    transform: none !important;
                }

                .navbar-vertical.navbar-expand-lg .navbar-collapse {
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: stretch !important;
                    flex-grow: 1 !important;
                    width: 100% !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }

                .navbar-vertical.navbar-expand-lg ~ .navbar,
                .navbar-vertical.navbar-expand-lg ~ .page-wrapper {
                    margin-left: 16rem !important;
                    width: calc(100% - 16rem) !important;
                }

                .mobile-sidebar-backdrop {
                    display: none !important;
                }
                .mobile-top-bar {
                    display: none !important;
                }
            }

            /* Mobile Sidebar Drawer Layout */
            @media (max-width: 991.98px) {
                .mobile-sidebar-backdrop {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(10, 25, 23, 0.65);
                    backdrop-filter: blur(4px);
                    z-index: 1040;
                    transition: opacity 0.25s ease;
                }

                .navbar-vertical.navbar-expand-lg {
                    position: fixed !important;
                    top: 0 !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    width: 280px !important;
                    max-width: 82vw !important;
                    z-index: 1050 !important;
                    box-shadow: 6px 0 32px rgba(0, 0, 0, 0.45) !important;
                    transform: translateX(-100%);
                    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
                    overflow-y: auto !important;
                    display: flex !important;
                    flex-direction: column !important;
                    height: 100vh !important;
                    padding: 0 !important;
                }

                .navbar-vertical.navbar-expand-lg.mobile-drawer-open {
                    transform: translateX(0) !important;
                }

                .navbar-vertical.navbar-expand-lg .navbar-collapse {
                    display: flex !important;
                    flex-direction: column !important;
                    width: 100% !important;
                    visibility: visible !important;
                }

                .page-wrapper {
                    margin-left: 0 !important;
                    width: 100% !important;
                }

                .mobile-top-bar {
                    display: flex !important;
                    position: sticky !important;
                    top: 0 !important;
                    z-index: 1020 !important;
                    background-color: #112926 !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
                    padding: 0.65rem 1rem !important;
                }
            }

            /* Sidebar navigation items styling */
            .navbar-vertical .navbar-nav {
                display: flex !important;
                flex-direction: column !important;
                gap: 0.25rem !important;
                padding: 0.5rem 0.75rem !important;
                margin: 0 !important;
                list-style: none !important;
            }

            .navbar-vertical .navbar-nav .nav-item {
                width: 100% !important;
            }

            .navbar-vertical .navbar-nav .nav-link {
                display: flex !important;
                align-items: center !important;
                gap: 0.75rem !important;
                padding: 0.65rem 0.95rem !important;
                border-radius: 0.65rem !important;
                color: #A3C2BB !important;
                font-size: 0.875rem !important;
                font-weight: 500 !important;
                text-decoration: none !important;
                transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
            }

            .navbar-vertical .navbar-nav .nav-link:hover {
                background-color: rgba(255, 255, 255, 0.08) !important;
                color: #ffffff !important;
                transform: translateX(3px) !important;
            }

            .navbar-vertical .navbar-nav .nav-item.active .nav-link,
            .navbar-vertical .navbar-nav .nav-link.active {
                background-color: rgba(12, 124, 112, 0.45) !important;
                color: #ffffff !important;
                font-weight: 700 !important;
                border-left: 3.5px solid #20C997 !important;
            }

            .navbar-vertical .navbar-nav .nav-link-icon {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 1.25rem !important;
                height: 1.25rem !important;
            }
        </style>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased" style="background-color: #F4F7F6;">
        <x-inertia::app />
        <script src="/tabler/js/tabler.min.js" defer></script>
    </body>
</html>
