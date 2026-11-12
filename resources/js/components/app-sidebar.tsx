import { Link, usePage } from '@inertiajs/react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, home } from '@/routes';
import type { NavItem } from '@/types';

import { 
    LayoutDashboard, 
    ListOrdered, 
    QrCode, 
    ClipboardList, 
    Home, 
    Phone, 
    Ticket 
} from 'lucide-react';

export function AppSidebar() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { auth } = usePage<any>().props;
    const isAdmin = auth?.user?.role === 'admin';

    const mainNavItems: NavItem[] = isAdmin
        ? [
              {
                  title: 'Dashboard',
                  href: dashboard(),
                  icon: LayoutDashboard,
              },
              {
                  title: 'Manajemen Antrean',
                  href: '/admin/antrean',
                  icon: ListOrdered,
              },
              {
                  title: 'Scan Kehadiran',
                  href: '/admin/scan',
                  icon: QrCode,
              },
              {
                  title: 'Data Reservasi',
                  href: '/admin/reservasi',
                  icon: ClipboardList,
              },
              {
                  title: 'Halaman Web',
                  href: home(),
                  icon: Home,
              },
          ]
        : [
              {
                  title: 'Tiket & Antrean Saya',
                  href: dashboard(),
                  icon: Ticket,
              },
              {
                  title: 'Halaman Beranda',
                  href: home(),
                  icon: Home,
              },
          ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Bantuan WhatsApp',
            href: 'https://wa.me/6281234567890',
            icon: Phone,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
